import {
  DISH_KINDS,
  INGREDIENT_QUALITIES,
  INITIAL_KITCHEN_COUNT,
  INITIAL_TABLE_COUNT,
  KITCHEN_SLOT_MAX,
  OFFLINE_TICK_CAP_SEC,
  SAVE_KEY,
  SAVE_VERSION,
  UNIT_MAX_STAMINA,
} from './config'
import { createInitialState, createRestaurantState, createShelf, tick } from './game'
import { createChefWeight, createEmptyShelf, createInitialKitchen } from './kitchen'
import type {
  ChefWeight,
  DishKind,
  GameState,
  Ingredient,
  IngredientQuality,
  RestaurantState,
  SaveBlob,
  ShelfStock,
  StorageLike,
  Unit,
  UnitLocation,
} from './types'

const LOCATIONS: ReadonlySet<UnitLocation> = new Set([
  'camp',
  'hospital_bed',
  'hospital_queue',
  'restaurant_seat',
  'restaurant_queue',
])

const DISH_SET: ReadonlySet<string> = new Set(DISH_KINDS)
const QUALITY_SET: ReadonlySet<string> = new Set(INGREDIENT_QUALITIES)

function cloneRestaurant(restaurant: RestaurantState): RestaurantState {
  return {
    tables: [...restaurant.tables],
    queue: [...restaurant.queue],
    shelf: { ...restaurant.shelf },
    shelfStar: { ...restaurant.shelfStar },
    nextDishIndex: restaurant.nextDishIndex,
    kitchen: restaurant.kitchen.map((item) => ({ ...item })),
    nextIngredientId: restaurant.nextIngredientId,
    chefWeight: { ...restaurant.chefWeight },
  }
}

export function serialize(state: GameState, savedAt: number): SaveBlob {
  return {
    version: SAVE_VERSION,
    savedAt,
    units: state.units.map((unit) => ({ ...unit })),
    beds: [...state.beds],
    queue: [...state.queue],
    potionCount: state.potionCount,
    supply: state.supply,
    nextUnitId: state.nextUnitId,
    restaurant: cloneRestaurant(state.restaurant),
  }
}

function isDishKind(value: unknown): value is DishKind {
  return typeof value === 'string' && DISH_SET.has(value)
}

function isQuality(value: unknown): value is IngredientQuality {
  return typeof value === 'string' && QUALITY_SET.has(value)
}

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseUnit(value: unknown): Unit | null {
  if (!value || typeof value !== 'object') return null
  const unit = value as Record<string, unknown>
  if (
    typeof unit.id !== 'string' ||
    unit.id.length === 0 ||
    typeof unit.name !== 'string' ||
    !finiteNumber(unit.hp) ||
    !finiteNumber(unit.maxHp) ||
    unit.maxHp <= 0 ||
    typeof unit.location !== 'string' ||
    !LOCATIONS.has(unit.location as UnitLocation) ||
    typeof unit.potionBoost !== 'boolean'
  ) {
    return null
  }

  const maxStamina =
    finiteNumber(unit.maxStamina) && unit.maxStamina > 0 ? unit.maxStamina : UNIT_MAX_STAMINA
  const stamina = finiteNumber(unit.stamina) ? unit.stamina : maxStamina
  const order = unit.order === null || unit.order === undefined ? null : isDishKind(unit.order) ? unit.order : null
  const served = typeof unit.served === 'boolean' ? unit.served : false

  return {
    id: unit.id,
    name: unit.name,
    hp: unit.hp,
    maxHp: unit.maxHp,
    stamina,
    maxStamina,
    location: unit.location as UnitLocation,
    potionBoost: unit.potionBoost,
    order,
    served,
  }
}

function parseIdList(
  raw: unknown,
  ids: Set<string>,
  occupied: Set<string>,
): string[] | null {
  if (!Array.isArray(raw) || !raw.every((id) => typeof id === 'string')) return null
  const list: string[] = []
  for (const id of raw) {
    if (!ids.has(id) || occupied.has(id)) return null
    occupied.add(id)
    list.push(id)
  }
  return list
}

function parseSlots(
  raw: unknown,
  ids: Set<string>,
  occupied: Set<string>,
): (string | null)[] | null {
  if (!Array.isArray(raw)) return null
  const slots: (string | null)[] = []
  for (const slot of raw) {
    if (slot === null) {
      slots.push(null)
      continue
    }
    if (typeof slot !== 'string' || !ids.has(slot) || occupied.has(slot)) return null
    occupied.add(slot)
    slots.push(slot)
  }
  return slots
}

function parseShelf(raw: unknown, fallback: () => ShelfStock): ShelfStock | null {
  if (raw === undefined) return fallback()
  if (!raw || typeof raw !== 'object') return null
  const src = raw as Record<string, unknown>
  const shelf = createEmptyShelf()
  for (const kind of DISH_KINDS) {
    const value = src[kind]
    if (value === undefined) {
      shelf[kind] = 0
      continue
    }
    if (!finiteNumber(value) || value < 0) return null
    shelf[kind] = value
  }
  return shelf
}

function parseIngredient(value: unknown): Ingredient | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (typeof item.id !== 'string' || item.id.length === 0) return null
  if (!isDishKind(item.kind) || !isQuality(item.quality)) return null
  return { id: item.id, kind: item.kind, quality: item.quality }
}

function parseKitchen(raw: unknown): Ingredient[] | null {
  if (raw === undefined) return createInitialKitchen()
  if (!Array.isArray(raw) || raw.length > KITCHEN_SLOT_MAX) return null
  const kitchen: Ingredient[] = []
  const ids = new Set<string>()
  for (const item of raw) {
    const parsed = parseIngredient(item)
    if (!parsed || ids.has(parsed.id)) return null
    ids.add(parsed.id)
    kitchen.push(parsed)
  }
  return kitchen
}

function parseChefWeight(raw: unknown): ChefWeight | null {
  if (raw === undefined) return createChefWeight()
  if (!raw || typeof raw !== 'object') return null
  const src = raw as Record<string, unknown>
  const weights = createChefWeight()
  for (const kind of DISH_KINDS) {
    const value = src[kind]
    if (value === undefined) continue
    if (!finiteNumber(value) || value < 0) return null
    weights[kind] = value
  }
  return weights
}

function nextIngredientIdFrom(kitchen: Ingredient[], raw: unknown): number {
  if (finiteNumber(raw) && raw >= 1) return Math.floor(raw)
  let max = INITIAL_KITCHEN_COUNT
  for (const item of kitchen) {
    const match = /^m(\d+)$/.exec(item.id)
    if (!match) continue
    const n = Number(match[1])
    if (Number.isFinite(n)) max = Math.max(max, n)
  }
  return max + 1
}

function clampStars(shelf: ShelfStock, stars: ShelfStock): ShelfStock {
  const next = { ...stars }
  for (const kind of DISH_KINDS) {
    if (next[kind] > shelf[kind]) next[kind] = shelf[kind]
  }
  return next
}

function parseRestaurant(
  raw: unknown,
  units: Unit[],
  ids: Set<string>,
  occupied: Set<string>,
): RestaurantState | null {
  if (raw === undefined) {
    const seated = units.filter((unit) => unit.location === 'restaurant_seat')
    const waiting = units.filter((unit) => unit.location === 'restaurant_queue')
    if (seated.length === 0 && waiting.length === 0) return createRestaurantState()

    const tables: (string | null)[] = seated.map((unit) => unit.id)
    while (tables.length < INITIAL_TABLE_COUNT) tables.push(null)
    for (const unit of seated) occupied.add(unit.id)
    const queue: string[] = []
    for (const unit of waiting) {
      if (occupied.has(unit.id)) return null
      occupied.add(unit.id)
      queue.push(unit.id)
    }
    return {
      tables,
      queue,
      shelf: createShelf(),
      shelfStar: createEmptyShelf(),
      nextDishIndex: 0,
      kitchen: createInitialKitchen(),
      nextIngredientId: INITIAL_KITCHEN_COUNT + 1,
      chefWeight: createChefWeight(),
    }
  }

  if (!raw || typeof raw !== 'object') return null
  const blob = raw as Record<string, unknown>
  const tables = parseSlots(blob.tables, ids, occupied)
  if (!tables) return null
  const queue = parseIdList(blob.queue, ids, occupied)
  if (!queue) return null
  const shelf = parseShelf(blob.shelf, createShelf)
  if (!shelf) return null
  const shelfStarRaw = parseShelf(blob.shelfStar, createEmptyShelf)
  if (!shelfStarRaw) return null
  const kitchen = parseKitchen(blob.kitchen)
  if (!kitchen) return null
  const chefWeight = parseChefWeight(blob.chefWeight)
  if (!chefWeight) return null
  const nextDishIndex = finiteNumber(blob.nextDishIndex) ? Math.max(0, Math.floor(blob.nextDishIndex)) : 0
  const nextIngredientId = nextIngredientIdFrom(kitchen, blob.nextIngredientId)
  return {
    tables,
    queue,
    shelf,
    shelfStar: clampStars(shelf, shelfStarRaw),
    nextDishIndex,
    kitchen,
    nextIngredientId,
    chefWeight,
  }
}

export function deserialize(raw: unknown): { state: GameState; savedAt: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const blob = raw as Record<string, unknown>
  if (!finiteNumber(blob.version) || blob.version < 1 || blob.version > SAVE_VERSION) return null
  if (!finiteNumber(blob.savedAt)) return null
  if (!Array.isArray(blob.units)) return null

  const units: Unit[] = []
  for (const item of blob.units) {
    const unit = parseUnit(item)
    if (!unit) return null
    units.push(unit)
  }

  const ids = new Set(units.map((unit) => unit.id))
  if (ids.size !== units.length) return null

  if (typeof blob.potionCount !== 'number' || !Number.isFinite(blob.potionCount) || blob.potionCount < 0) {
    return null
  }
  if (typeof blob.supply !== 'number' || !Number.isFinite(blob.supply) || blob.supply < 0) return null
  if (typeof blob.nextUnitId !== 'number' || !Number.isFinite(blob.nextUnitId)) return null

  const occupied = new Set<string>()
  const beds = parseSlots(blob.beds, ids, occupied)
  if (!beds) return null
  const queue = parseIdList(blob.queue, ids, occupied)
  if (!queue) return null
  const restaurant = parseRestaurant(blob.restaurant, units, ids, occupied)
  if (!restaurant) return null

  for (const unit of units) {
    if (unit.location === 'hospital_bed' && !beds.includes(unit.id)) return null
    if (unit.location === 'hospital_queue' && !queue.includes(unit.id)) return null
    if (unit.location === 'restaurant_seat' && !restaurant.tables.includes(unit.id)) return null
    if (unit.location === 'restaurant_queue' && !restaurant.queue.includes(unit.id)) return null
    if (unit.location === 'camp' && occupied.has(unit.id)) return null
    if (unit.location !== 'restaurant_seat') {
      unit.order = null
      unit.served = false
    } else if (!unit.order) {
      const kind = DISH_KINDS[restaurant.nextDishIndex % DISH_KINDS.length] ?? DISH_KINDS[0]
      restaurant.nextDishIndex += 1
      unit.order = kind
      unit.served = false
    }
  }

  return {
    savedAt: blob.savedAt,
    state: {
      units,
      beds,
      queue,
      potionCount: blob.potionCount,
      supply: blob.supply,
      nextUnitId: blob.nextUnitId,
      restaurant,
    },
  }
}

export function createMemoryStorage(initial?: Record<string, string>): StorageLike {
  const mem = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem(key) {
      return mem.has(key) ? (mem.get(key) ?? null) : null
    },
    setItem(key, value) {
      mem.set(key, value)
    },
  }
}

function defaultStorage(): StorageLike {
  if (typeof localStorage !== 'undefined') return localStorage
  return createMemoryStorage()
}

export function loadGame(storage: StorageLike = defaultStorage(), now = Date.now()): GameState {
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return createInitialState()
    const loaded = deserialize(JSON.parse(raw) as unknown)
    if (!loaded) return createInitialState()
    const elapsedSec = Math.min(Math.max(0, (now - loaded.savedAt) / 1000), OFFLINE_TICK_CAP_SEC)
    if (elapsedSec > 0) tick(loaded.state, elapsedSec)
    return loaded.state
  } catch {
    return createInitialState()
  }
}

export function saveGame(state: GameState, storage: StorageLike = defaultStorage(), now = Date.now()): void {
  storage.setItem(SAVE_KEY, JSON.stringify(serialize(state, now)))
}

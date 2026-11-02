import {
  INGREDIENT_QUALITIES,
  INITIAL_KITCHEN_COUNT,
  INITIAL_SHELF_PER_DISH,
  INITIAL_TABLE_COUNT,
  KITCHEN_SLOT_MAX,
  MENU_CATS,
  OFFLINE_TICK_CAP_SEC,
  SAVE_KEY,
  SAVE_VERSION,
  UNIT_MAX_STAMINA,
} from './config'
import { createInitialState, createRestaurantState, tick } from './game'
import { getGeneral, resolveGeneralId } from './generals'
import { createChefWeight, createInitialKitchen } from './kitchen'
import {
  cloneMenu,
  createMenu,
  DEFAULT_DISH_BY_CAT,
  getDish,
  isDishId,
  LEGACY_KIND_TO_CAT,
  migrateLegacyKind,
  migrateLegacyOrder,
  takeNextMenuDish,
} from './menu'
import type {
  ChefWeight,
  GameState,
  Ingredient,
  IngredientQuality,
  MenuCat,
  MenuSlot,
  MenuState,
  RestaurantState,
  SaveBlob,
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
  'marching',
  'captive',
  'persuading',
])

const FREE_LOCATIONS: ReadonlySet<UnitLocation> = new Set([
  'camp',
  'marching',
  'captive',
  'persuading',
])

const QUALITY_SET: ReadonlySet<string> = new Set(INGREDIENT_QUALITIES)

function cloneRestaurant(restaurant: RestaurantState): RestaurantState {
  return {
    tables: [...restaurant.tables],
    queue: [...restaurant.queue],
    menu: cloneMenu(restaurant.menu),
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
  const order =
    unit.order === null || unit.order === undefined ? null : migrateLegacyOrder(unit.order)
  const served = typeof unit.served === 'boolean' ? unit.served : false
  const givenId = typeof unit.generalId === 'string' ? unit.generalId : undefined
  const generalId = resolveGeneralId(unit.name, givenId)
  if (!generalId) return null
  const general = getGeneral(generalId)
  const name = general?.name ?? unit.name
  const location = unit.location as UnitLocation
  const busy = location === 'marching' || location === 'persuading'
  const rawRemain = finiteNumber(unit.jobRemain) && unit.jobRemain > 0 ? unit.jobRemain : 0
  const rawTotal = finiteNumber(unit.jobTotal) && unit.jobTotal > 0 ? unit.jobTotal : 0
  const jobRemain = busy ? rawRemain : 0
  const jobTotal = busy ? (rawTotal > 0 ? rawTotal : Math.max(jobRemain, 1)) : 0

  return {
    id: unit.id,
    name,
    generalId,
    hp: unit.hp,
    maxHp: unit.maxHp,
    stamina,
    maxStamina,
    location,
    potionBoost: unit.potionBoost,
    order,
    served,
    jobRemain,
    jobTotal,
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

function parseNonNeg(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback
  if (!finiteNumber(value) || value < 0) return null
  return value
}

function parseMenuSlot(raw: unknown, cat: MenuCat): MenuSlot | null {
  if (!raw || typeof raw !== 'object') return null
  const src = raw as Record<string, unknown>
  if (!isDishId(src.dishId)) return null
  if (getDish(src.dishId).cat !== cat) return null
  const stock = parseNonNeg(src.stock, 0)
  if (stock === null) return null
  const star = parseNonNeg(src.star, 0)
  if (star === null) return null
  return {
    dishId: src.dishId,
    stock,
    star: Math.min(star, stock),
  }
}

function parseV5Menu(raw: unknown): MenuState | null {
  if (!raw || typeof raw !== 'object') return null
  const src = raw as Record<string, unknown>
  const menu = createMenu(0)
  for (const cat of MENU_CATS) {
    const slot = parseMenuSlot(src[cat], cat)
    if (!slot) return null
    menu[cat] = slot
  }
  return menu
}

function migrateMenuFromLegacyShelf(shelfRaw: unknown, starRaw: unknown): MenuState | null {
  if (shelfRaw === undefined) return createMenu()
  if (!shelfRaw || typeof shelfRaw !== 'object') return null
  const src = shelfRaw as Record<string, unknown>
  const stars =
    starRaw && typeof starRaw === 'object' ? (starRaw as Record<string, unknown>) : {}
  const pairs: { cat: MenuCat; old: string }[] = [
    { cat: '饭', old: '粥' },
    { cat: '菜', old: '炒饭' },
    { cat: '酒', old: '烤肉' },
  ]
  const menu = createMenu(0)
  for (const { cat, old } of pairs) {
    const stock = parseNonNeg(src[old], INITIAL_SHELF_PER_DISH)
    if (stock === null) return null
    const star = parseNonNeg(stars[old], 0)
    if (star === null) return null
    menu[cat] = {
      dishId: DEFAULT_DISH_BY_CAT[cat],
      stock,
      star: Math.min(star, stock),
    }
  }
  return menu
}

function parseIngredient(value: unknown): Ingredient | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (typeof item.id !== 'string' || item.id.length === 0) return null
  const kind = migrateLegacyKind(item.kind)
  if (!kind || !isQuality(item.quality)) return null
  return { id: item.id, kind, quality: item.quality }
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
  for (const cat of MENU_CATS) {
    const legacy = Object.entries(LEGACY_KIND_TO_CAT).find(([, value]) => value === cat)?.[0]
    const value = src[cat] ?? (legacy ? src[legacy] : undefined)
    if (value === undefined) continue
    if (!finiteNumber(value) || value < 0) return null
    weights[cat] = value
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
      menu: createMenu(),
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
  const menu =
    blob.menu !== undefined
      ? parseV5Menu(blob.menu)
      : migrateMenuFromLegacyShelf(blob.shelf, blob.shelfStar)
  if (!menu) return null
  const kitchen = parseKitchen(blob.kitchen)
  if (!kitchen) return null
  const chefWeight = parseChefWeight(blob.chefWeight)
  if (!chefWeight) return null
  const nextDishIndex = finiteNumber(blob.nextDishIndex) ? Math.max(0, Math.floor(blob.nextDishIndex)) : 0
  const nextIngredientId = nextIngredientIdFrom(kitchen, blob.nextIngredientId)
  return {
    tables,
    queue,
    menu,
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
    if (FREE_LOCATIONS.has(unit.location) && occupied.has(unit.id)) return null
    if (unit.location !== 'restaurant_seat') {
      unit.order = null
      unit.served = false
    } else if (!unit.order) {
      unit.order = takeNextMenuDish(restaurant)
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
    removeItem(key) {
      mem.delete(key)
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

/** 只删游戏存档键。prefs / 主屏 / 更新气泡等独立键不要走这里。 */
export function clearGameSave(storage: StorageLike = defaultStorage()): void {
  storage.removeItem(SAVE_KEY)
}

export function cloneGameState(state: GameState): GameState {
  const loaded = deserialize(serialize(state, 0))
  if (!loaded) return createInitialState()
  return loaded.state
}

export function assignGameState(target: GameState, source: GameState): void {
  const next = cloneGameState(source)
  target.units = next.units
  target.beds = next.beds
  target.queue = next.queue
  target.potionCount = next.potionCount
  target.supply = next.supply
  target.nextUnitId = next.nextUnitId
  target.restaurant = next.restaurant
}

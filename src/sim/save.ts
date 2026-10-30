import { OFFLINE_TICK_CAP_SEC, SAVE_KEY, SAVE_VERSION } from './config'
import { createInitialState, tick } from './game'
import type { GameState, SaveBlob, StorageLike, Unit, UnitLocation } from './types'

const LOCATIONS: ReadonlySet<UnitLocation> = new Set(['camp', 'hospital_bed', 'hospital_queue'])

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
  }
}

function isUnit(value: unknown): value is Unit {
  if (!value || typeof value !== 'object') return false
  const unit = value as Record<string, unknown>
  return (
    typeof unit.id === 'string' &&
    unit.id.length > 0 &&
    typeof unit.name === 'string' &&
    typeof unit.hp === 'number' &&
    Number.isFinite(unit.hp) &&
    typeof unit.maxHp === 'number' &&
    Number.isFinite(unit.maxHp) &&
    unit.maxHp > 0 &&
    typeof unit.location === 'string' &&
    LOCATIONS.has(unit.location as UnitLocation) &&
    typeof unit.potionBoost === 'boolean'
  )
}

export function deserialize(raw: unknown): { state: GameState; savedAt: number } | null {
  if (!raw || typeof raw !== 'object') return null
  const blob = raw as Record<string, unknown>
  if (blob.version !== SAVE_VERSION) return null
  if (typeof blob.savedAt !== 'number' || !Number.isFinite(blob.savedAt)) return null
  if (!Array.isArray(blob.units) || !blob.units.every(isUnit)) return null
  if (!Array.isArray(blob.beds)) return null
  if (!Array.isArray(blob.queue) || !blob.queue.every((id) => typeof id === 'string')) return null
  if (typeof blob.potionCount !== 'number' || !Number.isFinite(blob.potionCount) || blob.potionCount < 0) {
    return null
  }
  if (typeof blob.supply !== 'number' || !Number.isFinite(blob.supply) || blob.supply < 0) return null
  if (typeof blob.nextUnitId !== 'number' || !Number.isFinite(blob.nextUnitId)) return null

  const units = blob.units.map((unit) => ({ ...unit }))
  const ids = new Set(units.map((unit) => unit.id))
  if (ids.size !== units.length) return null

  const beds: (string | null)[] = []
  const occupied = new Set<string>()
  for (const slot of blob.beds) {
    if (slot === null) {
      beds.push(null)
      continue
    }
    if (typeof slot !== 'string' || !ids.has(slot) || occupied.has(slot)) return null
    occupied.add(slot)
    beds.push(slot)
  }

  const queue: string[] = []
  for (const id of blob.queue) {
    if (!ids.has(id) || occupied.has(id)) return null
    occupied.add(id)
    queue.push(id)
  }

  for (const unit of units) {
    if (unit.location === 'hospital_bed' && !beds.includes(unit.id)) return null
    if (unit.location === 'hospital_queue' && !queue.includes(unit.id)) return null
    if (unit.location === 'camp' && occupied.has(unit.id)) return null
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

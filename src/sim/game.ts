import {
  BASE_HEAL_PER_SEC,
  EXPAND_BED_COST,
  INITIAL_BED_COUNT,
  INITIAL_POTION_COUNT,
  INITIAL_SUPPLY,
  INITIAL_UNIT_COUNT,
  INJURE_HP,
  POTION_COST,
  POTION_HEAL_MULTIPLIER,
  UNIT_MAX_HP,
  UNIT_NAMES,
} from './config'
import type { GameState, Unit } from './types'

export function createInitialState(): GameState {
  const count = Math.min(INITIAL_UNIT_COUNT, UNIT_NAMES.length)
  const units: Unit[] = []
  for (let i = 0; i < count; i++) {
    units.push({
      id: `u${i + 1}`,
      name: UNIT_NAMES[i] ?? `士兵${i + 1}`,
      hp: UNIT_MAX_HP,
      maxHp: UNIT_MAX_HP,
      location: 'camp',
      potionBoost: false,
    })
  }
  return {
    units,
    beds: Array.from({ length: INITIAL_BED_COUNT }, () => null),
    queue: [],
    potionCount: INITIAL_POTION_COUNT,
    supply: INITIAL_SUPPLY,
    nextUnitId: count + 1,
  }
}

export function findUnit(state: GameState, id: string): Unit | undefined {
  return state.units.find((unit) => unit.id === id)
}

export function healRate(unit: Unit): number {
  return BASE_HEAL_PER_SEC * (unit.potionBoost ? POTION_HEAL_MULTIPLIER : 1)
}

export function canInjure(state: GameState): boolean {
  return state.units.some((unit) => unit.location === 'camp' && unit.hp >= unit.maxHp)
}

export function canExpandBed(state: GameState): boolean {
  return state.supply >= EXPAND_BED_COST
}

export function canApplyPotion(state: GameState, unitId: string): boolean {
  const unit = findUnit(state, unitId)
  return (
    !!unit &&
    unit.location === 'hospital_bed' &&
    !unit.potionBoost &&
    state.potionCount >= POTION_COST
  )
}

function firstEmptyBed(state: GameState): number {
  return state.beds.findIndex((id) => id === null)
}

function admit(state: GameState, unit: Unit): void {
  const empty = firstEmptyBed(state)
  if (empty >= 0) {
    state.beds[empty] = unit.id
    unit.location = 'hospital_bed'
    return
  }
  state.queue.push(unit.id)
  unit.location = 'hospital_queue'
}

export function assignQueueToBeds(state: GameState): void {
  while (state.queue.length > 0) {
    const empty = firstEmptyBed(state)
    if (empty < 0) break
    const id = state.queue.shift()
    if (!id) break
    const unit = findUnit(state, id)
    if (!unit) continue
    state.beds[empty] = id
    unit.location = 'hospital_bed'
  }
}

function discharge(state: GameState, unit: Unit, bedIndex: number): void {
  unit.hp = unit.maxHp
  unit.location = 'camp'
  unit.potionBoost = false
  state.beds[bedIndex] = null
}

function dischargeFull(state: GameState): boolean {
  let changed = false
  for (let i = 0; i < state.beds.length; i++) {
    const id = state.beds[i]
    if (!id) continue
    const unit = findUnit(state, id)
    if (!unit) {
      state.beds[i] = null
      changed = true
      continue
    }
    if (unit.hp >= unit.maxHp) {
      discharge(state, unit, i)
      changed = true
    }
  }
  if (changed) assignQueueToBeds(state)
  return changed
}

/** 只有占床单位按基础回血 × 药剂倍率回血；满血离院后空床立刻分给队首。 */
export function tick(state: GameState, dt: number): void {
  if (!Number.isFinite(dt) || dt <= 0) return
  let remaining = dt
  while (remaining > 0) {
    dischargeFull(state)
    const occupants: Unit[] = []
    for (const id of state.beds) {
      if (!id) continue
      const unit = findUnit(state, id)
      if (unit) occupants.push(unit)
    }
    if (occupants.length === 0) break

    let slice = remaining
    for (const unit of occupants) {
      const rate = healRate(unit)
      if (rate <= 0) continue
      const need = unit.maxHp - unit.hp
      if (need <= 0) {
        slice = 0
        break
      }
      slice = Math.min(slice, need / rate)
    }

    if (slice <= 0) {
      if (!dischargeFull(state)) break
      continue
    }

    for (const unit of occupants) {
      unit.hp = Math.min(unit.maxHp, unit.hp + healRate(unit) * slice)
    }
    remaining -= slice
    dischargeFull(state)
  }
}

/** 从营地选一个满血待命兵，hp 设为造伤值并送医院。 */
export function injureAndSendToHospital(state: GameState): boolean {
  const unit = state.units.find((item) => item.location === 'camp' && item.hp >= item.maxHp)
  if (!unit) return false
  unit.hp = INJURE_HP
  unit.potionBoost = false
  admit(state, unit)
  return true
}

/** 对占床单位用药；没床不能用药。 */
export function applyPotion(state: GameState, unitId: string): boolean {
  if (!canApplyPotion(state, unitId)) return false
  const unit = findUnit(state, unitId)
  if (!unit) return false
  state.potionCount -= POTION_COST
  unit.potionBoost = true
  return true
}

/** 扣 supply，+1 床；新空床立刻分给队首。 */
export function expandBed(state: GameState): boolean {
  if (!canExpandBed(state)) return false
  state.supply -= EXPAND_BED_COST
  state.beds.push(null)
  assignQueueToBeds(state)
  return true
}

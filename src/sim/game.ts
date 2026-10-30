import {
  BASE_HEAL_PER_SEC,
  DISH_KINDS,
  EAT_PER_SEC,
  EXPAND_BED_COST,
  EXPAND_TABLE_COST,
  HUNGER_STAMINA,
  INITIAL_BED_COUNT,
  INITIAL_POTION_COUNT,
  INITIAL_SHELF_PER_DISH,
  INITIAL_SUPPLY,
  INITIAL_TABLE_COUNT,
  INITIAL_UNIT_COUNT,
  INJURE_HP,
  POTION_COST,
  POTION_HEAL_MULTIPLIER,
  RESTOCK_PER_DISH,
  UNIT_MAX_HP,
  UNIT_MAX_STAMINA,
  UNIT_NAMES,
} from './config'
import type { DishKind, GameState, RestaurantState, ShelfStock, Unit } from './types'

export function createShelf(count = INITIAL_SHELF_PER_DISH): ShelfStock {
  return {
    粥: count,
    炒饭: count,
    烤肉: count,
  }
}

export function createRestaurantState(): RestaurantState {
  return {
    tables: Array.from({ length: INITIAL_TABLE_COUNT }, () => null),
    queue: [],
    shelf: createShelf(),
    nextDishIndex: 0,
  }
}

export function createInitialState(): GameState {
  const count = Math.min(INITIAL_UNIT_COUNT, UNIT_NAMES.length)
  const units: Unit[] = []
  for (let i = 0; i < count; i++) {
    units.push({
      id: `u${i + 1}`,
      name: UNIT_NAMES[i] ?? `士兵${i + 1}`,
      hp: UNIT_MAX_HP,
      maxHp: UNIT_MAX_HP,
      stamina: UNIT_MAX_STAMINA,
      maxStamina: UNIT_MAX_STAMINA,
      location: 'camp',
      potionBoost: false,
      order: null,
      served: false,
    })
  }
  return {
    units,
    beds: Array.from({ length: INITIAL_BED_COUNT }, () => null),
    queue: [],
    potionCount: INITIAL_POTION_COUNT,
    supply: INITIAL_SUPPLY,
    nextUnitId: count + 1,
    restaurant: createRestaurantState(),
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

export function canStarve(state: GameState): boolean {
  return state.units.some((unit) => unit.location === 'camp' && unit.stamina >= unit.maxStamina)
}

export function canExpandBed(state: GameState): boolean {
  return state.supply >= EXPAND_BED_COST
}

export function canExpandTable(state: GameState): boolean {
  return state.supply >= EXPAND_TABLE_COST
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

export function canServeDish(state: GameState, unitId: string): boolean {
  const unit = findUnit(state, unitId)
  return (
    !!unit &&
    unit.location === 'restaurant_seat' &&
    !unit.served &&
    !!unit.order &&
    (state.restaurant.shelf[unit.order] ?? 0) > 0
  )
}

function firstEmptyBed(state: GameState): number {
  return state.beds.findIndex((id) => id === null)
}

function firstEmptyTable(state: GameState): number {
  return state.restaurant.tables.findIndex((id) => id === null)
}

function nextDish(state: GameState): DishKind {
  const kind = DISH_KINDS[state.restaurant.nextDishIndex % DISH_KINDS.length] ?? DISH_KINDS[0]
  state.restaurant.nextDishIndex += 1
  return kind
}

function seatAndOrder(state: GameState, unit: Unit, tableIndex: number): void {
  state.restaurant.tables[tableIndex] = unit.id
  unit.location = 'restaurant_seat'
  unit.order = nextDish(state)
  unit.served = false
}

function admitHospital(state: GameState, unit: Unit): void {
  const empty = firstEmptyBed(state)
  if (empty >= 0) {
    state.beds[empty] = unit.id
    unit.location = 'hospital_bed'
    return
  }
  state.queue.push(unit.id)
  unit.location = 'hospital_queue'
}

function admitRestaurant(state: GameState, unit: Unit): void {
  const empty = firstEmptyTable(state)
  if (empty >= 0) {
    seatAndOrder(state, unit, empty)
    return
  }
  state.restaurant.queue.push(unit.id)
  unit.location = 'restaurant_queue'
  unit.order = null
  unit.served = false
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

export function assignQueueToTables(state: GameState): void {
  while (state.restaurant.queue.length > 0) {
    const empty = firstEmptyTable(state)
    if (empty < 0) break
    const id = state.restaurant.queue.shift()
    if (!id) break
    const unit = findUnit(state, id)
    if (!unit) continue
    seatAndOrder(state, unit, empty)
  }
}

function discharge(state: GameState, unit: Unit, bedIndex: number): void {
  unit.hp = unit.maxHp
  unit.location = 'camp'
  unit.potionBoost = false
  state.beds[bedIndex] = null
}

function leaveTable(state: GameState, unit: Unit, tableIndex: number): void {
  unit.stamina = unit.maxStamina
  unit.location = 'camp'
  unit.order = null
  unit.served = false
  state.restaurant.tables[tableIndex] = null
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

function leaveFull(state: GameState): boolean {
  let changed = false
  for (let i = 0; i < state.restaurant.tables.length; i++) {
    const id = state.restaurant.tables[i]
    if (!id) continue
    const unit = findUnit(state, id)
    if (!unit) {
      state.restaurant.tables[i] = null
      changed = true
      continue
    }
    if (unit.served && unit.stamina >= unit.maxStamina) {
      leaveTable(state, unit, i)
      changed = true
    }
  }
  if (changed) assignQueueToTables(state)
  return changed
}

function tickHospital(state: GameState, dt: number): void {
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

function tickRestaurant(state: GameState, dt: number): void {
  let remaining = dt
  while (remaining > 0) {
    leaveFull(state)
    const eaters: Unit[] = []
    for (const id of state.restaurant.tables) {
      if (!id) continue
      const unit = findUnit(state, id)
      if (unit?.served) eaters.push(unit)
    }
    if (eaters.length === 0) break

    let slice = remaining
    for (const unit of eaters) {
      if (EAT_PER_SEC <= 0) continue
      const need = unit.maxStamina - unit.stamina
      if (need <= 0) {
        slice = 0
        break
      }
      slice = Math.min(slice, need / EAT_PER_SEC)
    }

    if (slice <= 0) {
      if (!leaveFull(state)) break
      continue
    }

    for (const unit of eaters) {
      unit.stamina = Math.min(unit.maxStamina, unit.stamina + EAT_PER_SEC * slice)
    }
    remaining -= slice
    leaveFull(state)
  }
}

/** 医院占床回血与餐厅占座进食并行；满则离区回营地，空位立刻分给队首。 */
export function tick(state: GameState, dt: number): void {
  if (!Number.isFinite(dt) || dt <= 0) return
  tickHospital(state, dt)
  tickRestaurant(state, dt)
}

/** 从营地选一个满血待命兵，hp 设为造伤值并送医院。 */
export function injureAndSendToHospital(state: GameState): boolean {
  const unit = state.units.find((item) => item.location === 'camp' && item.hp >= item.maxHp)
  if (!unit) return false
  unit.hp = INJURE_HP
  unit.potionBoost = false
  admitHospital(state, unit)
  return true
}

/** 从营地选一个满体力待命兵，体力清零并送餐厅。 */
export function starveAndSendToRestaurant(state: GameState): boolean {
  const unit = state.units.find((item) => item.location === 'camp' && item.stamina >= item.maxStamina)
  if (!unit) return false
  unit.stamina = HUNGER_STAMINA
  unit.order = null
  unit.served = false
  admitRestaurant(state, unit)
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

/** 占座且货架有对应菜时上菜：扣库存并开始进食。 */
export function serveDish(state: GameState, unitId: string): boolean {
  if (!canServeDish(state, unitId)) return false
  const unit = findUnit(state, unitId)
  if (!unit || !unit.order) return false
  state.restaurant.shelf[unit.order] -= 1
  unit.served = true
  return true
}

/** 调试：每种菜库存各加 RESTOCK_PER_DISH。 */
export function restockShelf(state: GameState): void {
  for (const kind of DISH_KINDS) {
    state.restaurant.shelf[kind] += RESTOCK_PER_DISH
  }
}

/** 扣 supply，+1 床；新空床立刻分给队首。 */
export function expandBed(state: GameState): boolean {
  if (!canExpandBed(state)) return false
  state.supply -= EXPAND_BED_COST
  state.beds.push(null)
  assignQueueToBeds(state)
  return true
}

/** 扣 supply，+1 桌；新空座立刻分给队首并让其点餐。 */
export function expandTable(state: GameState): boolean {
  if (!canExpandTable(state)) return false
  state.supply -= EXPAND_TABLE_COST
  state.restaurant.tables.push(null)
  assignQueueToTables(state)
  return true
}

import {
  BASE_HEAL_PER_SEC,
  DISH_KINDS,
  EAT_PER_SEC,
  EXPAND_BED_COST,
  EXPAND_TABLE_COST,
  HUNGER_STAMINA,
  INITIAL_BED_COUNT,
  INITIAL_KITCHEN_COUNT,
  INITIAL_POTION_COUNT,
  INITIAL_SHELF_PER_DISH,
  INITIAL_SUPPLY,
  INITIAL_TABLE_COUNT,
  INITIAL_UNIT_COUNT,
  INJURE_HP,
  MARCH_CAPTURE_BASE,
  MARCH_CAPTURE_MAX,
  MARCH_CAPTURE_MIN,
  MARCH_CAPTURE_POWER_SCALE,
  MARCH_DURATION_SEC,
  MARCH_INJURY_CHANCE,
  MARCH_INJURY_HP,
  MARCH_STAMINA_COST,
  MARCH_SUPPLY_GAIN,
  PERSUADE_RATE,
  PERSUADE_SEC,
  POTION_COST,
  POTION_HEAL_MULTIPLIER,
  RESTOCK_PER_DISH,
  UNIT_MAX_HP,
  UNIT_MAX_STAMINA,
} from './config'
import {
  capturableGenerals,
  getGeneral,
  STARTER_GENERAL_IDS,
  type General,
  type GeneralTag,
} from './generals'
import { consumeShelfDish, createChefWeight, createEmptyShelf, createInitialKitchen } from './kitchen'
import type { DishKind, GameState, RestaurantState, Rng, ShelfStock, Unit, UnitLocation } from './types'

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
    shelfStar: createEmptyShelf(),
    nextDishIndex: 0,
    kitchen: createInitialKitchen(),
    nextIngredientId: INITIAL_KITCHEN_COUNT + 1,
    chefWeight: createChefWeight(),
  }
}

export function createUnitFromGeneral(
  id: string,
  general: General,
  location: UnitLocation = 'camp',
): Unit {
  return {
    id,
    name: general.name,
    generalId: general.id,
    hp: UNIT_MAX_HP,
    maxHp: UNIT_MAX_HP,
    stamina: UNIT_MAX_STAMINA,
    maxStamina: UNIT_MAX_STAMINA,
    location,
    potionBoost: false,
    order: null,
    served: false,
    jobRemain: 0,
    jobTotal: 0,
  }
}

function clearJob(unit: Unit): void {
  unit.jobRemain = 0
  unit.jobTotal = 0
}

export function createInitialState(): GameState {
  const units: Unit[] = []
  const count = Math.min(INITIAL_UNIT_COUNT, STARTER_GENERAL_IDS.length)
  for (let i = 0; i < count; i++) {
    const general = getGeneral(STARTER_GENERAL_IDS[i]!)
    if (!general) continue
    units.push(createUnitFromGeneral(`u${i + 1}`, general))
  }
  return {
    units,
    beds: Array.from({ length: INITIAL_BED_COUNT }, () => null),
    queue: [],
    potionCount: INITIAL_POTION_COUNT,
    supply: INITIAL_SUPPLY,
    nextUnitId: units.length + 1,
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function tagOf(unit: Unit): GeneralTag {
  return getGeneral(unit.generalId)?.tag ?? '战'
}

export function persuadeDuration(tag: GeneralTag): number {
  return PERSUADE_SEC[tag]
}

export function persuadeSuccessRate(tag: GeneralTag): number {
  return PERSUADE_RATE[tag]
}

export function captureChance(attackerPower: number, defenderPower: number): number {
  const raw = MARCH_CAPTURE_BASE + (attackerPower - defenderPower) / MARCH_CAPTURE_POWER_SCALE
  return clamp(raw, MARCH_CAPTURE_MIN, MARCH_CAPTURE_MAX)
}

export function canMarchUnit(state: GameState, unitId: string): boolean {
  const unit = findUnit(state, unitId)
  return (
    !!unit &&
    unit.location === 'camp' &&
    unit.hp >= unit.maxHp &&
    unit.stamina >= unit.maxStamina
  )
}

export function canPersuadeUnit(state: GameState, unitId: string): boolean {
  const unit = findUnit(state, unitId)
  return !!unit && unit.location === 'captive'
}

/** 营地选满血满体待命 1 人出征。 */
export function startMarch(state: GameState, unitId: string): boolean {
  if (!canMarchUnit(state, unitId)) return false
  const unit = findUnit(state, unitId)
  if (!unit) return false
  unit.location = 'marching'
  unit.jobTotal = MARCH_DURATION_SEC
  unit.jobRemain = MARCH_DURATION_SEC
  return true
}

/** 对押回俘虏开劝降挂机。失败则释放，不可再劝同一次俘虏。 */
export function startPersuade(state: GameState, unitId: string): boolean {
  if (!canPersuadeUnit(state, unitId)) return false
  const unit = findUnit(state, unitId)
  if (!unit) return false
  const duration = persuadeDuration(tagOf(unit))
  unit.location = 'persuading'
  unit.jobTotal = duration
  unit.jobRemain = duration
  return true
}

function tryCapture(state: GameState, attacker: Unit, rng: Rng): Unit | null {
  const pool = capturableGenerals(state)
  if (pool.length === 0) return null
  const enemy = pool[Math.floor(rng() * pool.length)]
  if (!enemy) return null
  const attackerPower = getGeneral(attacker.generalId)?.power ?? 70
  if (rng() >= captureChance(attackerPower, enemy.power)) return null
  const captive = createUnitFromGeneral(`u${state.nextUnitId}`, enemy, 'captive')
  state.nextUnitId += 1
  state.units.push(captive)
  return captive
}

function resolveMarch(state: GameState, unit: Unit, rng: Rng): void {
  unit.stamina = Math.max(0, unit.stamina - MARCH_STAMINA_COST)
  const injured = rng() < MARCH_INJURY_CHANCE
  if (injured) unit.hp = Math.max(1, unit.maxHp - MARCH_INJURY_HP)
  state.supply += MARCH_SUPPLY_GAIN
  tryCapture(state, unit, rng)
  clearJob(unit)
  if (injured) {
    unit.stamina = unit.maxStamina
    admitHospital(state, unit)
    return
  }
  if (unit.stamina < unit.maxStamina) {
    admitRestaurant(state, unit)
    return
  }
  unit.location = 'camp'
}

function removeUnit(state: GameState, unitId: string): void {
  const index = state.units.findIndex((item) => item.id === unitId)
  if (index >= 0) state.units.splice(index, 1)
}

function resolvePersuade(state: GameState, unit: Unit, rng: Rng): void {
  const success = rng() < persuadeSuccessRate(tagOf(unit))
  clearJob(unit)
  if (success) {
    unit.location = 'camp'
    unit.hp = unit.maxHp
    unit.stamina = unit.maxStamina
    unit.potionBoost = false
    unit.order = null
    unit.served = false
    return
  }
  removeUnit(state, unit.id)
}

function resolveDueJobs(state: GameState, rng: Rng): void {
  const due = state.units.filter(
    (unit) =>
      (unit.location === 'marching' || unit.location === 'persuading') && unit.jobRemain <= 0,
  )
  for (const unit of due) {
    if (unit.location === 'marching') resolveMarch(state, unit, rng)
    else if (unit.location === 'persuading') resolvePersuade(state, unit, rng)
  }
}

function nextJobRemain(state: GameState): number | null {
  let next: number | null = null
  for (const unit of state.units) {
    if (unit.location !== 'marching' && unit.location !== 'persuading') continue
    if (unit.jobRemain <= 0) return 0
    next = next === null ? unit.jobRemain : Math.min(next, unit.jobRemain)
  }
  return next
}

/** 出征/劝降与医院餐厅并行；任务结束的剩余时间才进入补给区，避免同一段 dt 结算两次。 */
export function tick(state: GameState, dt: number, rng: Rng = Math.random): void {
  if (!Number.isFinite(dt) || dt <= 0) return
  let remaining = dt
  while (remaining > 0) {
    resolveDueJobs(state, rng)
    const untilJob = nextJobRemain(state)
    if (untilJob === null) {
      tickHospital(state, remaining)
      tickRestaurant(state, remaining)
      return
    }
    const slice = Math.min(remaining, untilJob)
    if (slice <= 0) {
      resolveDueJobs(state, rng)
      if (nextJobRemain(state) === 0) break
      continue
    }
    for (const unit of state.units) {
      if (unit.location !== 'marching' && unit.location !== 'persuading') continue
      unit.jobRemain -= slice
    }
    tickHospital(state, slice)
    tickRestaurant(state, slice)
    remaining -= slice
  }
  resolveDueJobs(state, rng)
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
  consumeShelfDish(state, unit.order)
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

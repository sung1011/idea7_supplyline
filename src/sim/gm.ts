import { DISH_KINDS, UNIT_MAX_HP, UNIT_MAX_STAMINA } from './config'
import { createInitialState } from './game'
import { grantCoarse } from './kitchen'
import { assignGameState } from './save'
import type { GameState } from './types'

export const GM_SUPPLY_GRANT = 50
export const GM_POTION_GRANT = 5
export const GM_SHELF_GRANT = 5
export const GM_COARSE_GRANT = 5

export type GameSnapshotStats = {
  camp: number
  hospitalBeds: number
  hospitalQueue: number
  restaurantSeats: number
  restaurantQueue: number
  bedCount: number
  tableCount: number
  supply: number
  potionCount: number
  shelfTotal: number
  kitchenCount: number
}

export function snapshotStats(state: GameState): GameSnapshotStats {
  return {
    camp: state.units.filter((unit) => unit.location === 'camp').length,
    hospitalBeds: state.beds.filter(Boolean).length,
    hospitalQueue: state.queue.length,
    restaurantSeats: state.restaurant.tables.filter(Boolean).length,
    restaurantQueue: state.restaurant.queue.length,
    bedCount: state.beds.length,
    tableCount: state.restaurant.tables.length,
    supply: Math.floor(state.supply),
    potionCount: Math.floor(state.potionCount),
    shelfTotal: DISH_KINDS.reduce((sum, kind) => sum + (state.restaurant.shelf[kind] ?? 0), 0),
    kitchenCount: state.restaurant.kitchen.length,
  }
}

export function gmResetState(target: GameState): void {
  assignGameState(target, createInitialState())
}

export function gmAddSupply(state: GameState, amount = GM_SUPPLY_GRANT): void {
  state.supply += Math.max(0, Math.floor(amount))
}

export function gmAddPotion(state: GameState, amount = GM_POTION_GRANT): void {
  state.potionCount += Math.max(0, Math.floor(amount))
}

export function gmAddShelfEach(state: GameState, amount = GM_SHELF_GRANT): void {
  const qty = Math.max(0, Math.floor(amount))
  for (const kind of DISH_KINDS) {
    state.restaurant.shelf[kind] += qty
  }
}

/** 全员满血满体力回营地，清医院床位/排队和餐厅占座/排队，不改床数桌数。 */
export function gmRecallAll(state: GameState): void {
  for (const unit of state.units) {
    unit.hp = unit.maxHp > 0 ? unit.maxHp : UNIT_MAX_HP
    unit.stamina = unit.maxStamina > 0 ? unit.maxStamina : UNIT_MAX_STAMINA
    unit.location = 'camp'
    unit.potionBoost = false
    unit.order = null
    unit.served = false
  }
  for (let i = 0; i < state.beds.length; i++) state.beds[i] = null
  state.queue.length = 0
  for (let i = 0; i < state.restaurant.tables.length; i++) state.restaurant.tables[i] = null
  state.restaurant.queue.length = 0
}

/** 调后厨 `grantCoarse`，栏满即停。 */
export function gmGrantCoarse(state: GameState, times = GM_COARSE_GRANT): number {
  const n = Math.max(0, Math.floor(times))
  let granted = 0
  for (let i = 0; i < n; i++) {
    if (!grantCoarse(state)) break
    granted += 1
  }
  return granted
}

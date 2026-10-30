import { describe, expect, it } from 'vitest'
import { PREFS_KEY, loadPrefs, savePrefs } from '../ui/prefs'
import {
  INITIAL_BED_COUNT,
  INITIAL_KITCHEN_COUNT,
  INITIAL_POTION_COUNT,
  INITIAL_SHELF_PER_DISH,
  INITIAL_SUPPLY,
  INITIAL_TABLE_COUNT,
  INITIAL_UNIT_COUNT,
  KITCHEN_SLOT_MAX,
  SAVE_KEY,
  UNIT_MAX_HP,
  UNIT_MAX_STAMINA,
} from './config'
import { createInitialState, expandBed, injureAndSendToHospital, starveAndSendToRestaurant } from './game'
import {
  GM_COARSE_GRANT,
  GM_POTION_GRANT,
  GM_SHELF_GRANT,
  GM_SUPPLY_GRANT,
  gmAddPotion,
  gmAddShelfEach,
  gmAddSupply,
  gmGrantCoarse,
  gmRecallAll,
  gmResetState,
  snapshotStats,
} from './gm'
import { clearGameSave, createMemoryStorage, loadGame, saveGame } from './save'

describe('snapshot stats', () => {
  it('reads the current camp / hospital / restaurant snapshot', () => {
    const state = createInitialState()
    expect(injureAndSendToHospital(state)).toBe(true)
    expect(injureAndSendToHospital(state)).toBe(true)
    expect(injureAndSendToHospital(state)).toBe(true)
    expect(starveAndSendToRestaurant(state)).toBe(true)
    const stats = snapshotStats(state)
    expect(stats.camp).toBe(0)
    expect(stats.hospitalBeds).toBe(INITIAL_BED_COUNT)
    expect(stats.hospitalQueue).toBe(1)
    expect(stats.restaurantSeats).toBe(INITIAL_TABLE_COUNT)
    expect(stats.restaurantQueue).toBe(0)
    expect(stats.bedCount).toBe(INITIAL_BED_COUNT)
    expect(stats.tableCount).toBe(INITIAL_TABLE_COUNT)
    expect(stats.supply).toBe(INITIAL_SUPPLY)
    expect(stats.potionCount).toBe(INITIAL_POTION_COUNT)
    expect(stats.shelfTotal).toBe(INITIAL_SHELF_PER_DISH * 3)
    expect(stats.kitchenCount).toBe(INITIAL_KITCHEN_COUNT)
  })
})

describe('GM', () => {
  it('reset restores a clean initial state', () => {
    const state = createInitialState()
    injureAndSendToHospital(state)
    starveAndSendToRestaurant(state)
    expect(expandBed(state)).toBe(true)
    gmAddSupply(state, 20)
    gmAddPotion(state, 9)
    gmAddShelfEach(state, 3)
    gmGrantCoarse(state, 2)
    gmResetState(state)
    expect(state).toEqual(createInitialState())
    expect(state.units).toHaveLength(INITIAL_UNIT_COUNT)
    expect(state.units.every((unit) => unit.location === 'camp')).toBe(true)
    expect(state.beds).toEqual(Array.from({ length: INITIAL_BED_COUNT }, () => null))
    expect(state.queue).toEqual([])
    expect(state.restaurant.tables).toEqual([null])
    expect(state.restaurant.queue).toEqual([])
    expect(state.potionCount).toBe(INITIAL_POTION_COUNT)
    expect(state.supply).toBe(INITIAL_SUPPLY)
    expect(state.restaurant.kitchen).toHaveLength(INITIAL_KITCHEN_COUNT)
  })

  it('clearing the save key leaves prefs alone', () => {
    const storage = createMemoryStorage()
    const dirty = createInitialState()
    gmAddSupply(dirty, 99)
    saveGame(dirty, storage, 1)
    savePrefs({ music: false, sfx: false }, storage as unknown as Storage)
    expect(storage.getItem(SAVE_KEY)).toBeTruthy()
    expect(storage.getItem(PREFS_KEY)).toContain('"music":false')
    clearGameSave(storage)
    expect(storage.getItem(SAVE_KEY)).toBeNull()
    expect(loadGame(storage, 1)).toEqual(createInitialState())
    expect(loadPrefs(storage as unknown as Storage)).toEqual({ music: false, sfx: false })
  })

  it('grants supply, potion, shelf stock and coarse materials', () => {
    const state = createInitialState()
    gmAddSupply(state)
    gmAddPotion(state)
    gmAddShelfEach(state)
    const granted = gmGrantCoarse(state)
    expect(state.supply).toBe(INITIAL_SUPPLY + GM_SUPPLY_GRANT)
    expect(state.potionCount).toBe(INITIAL_POTION_COUNT + GM_POTION_GRANT)
    expect(state.restaurant.shelf.粥).toBe(INITIAL_SHELF_PER_DISH + GM_SHELF_GRANT)
    expect(state.restaurant.shelf.炒饭).toBe(INITIAL_SHELF_PER_DISH + GM_SHELF_GRANT)
    expect(state.restaurant.shelf.烤肉).toBe(INITIAL_SHELF_PER_DISH + GM_SHELF_GRANT)
    expect(granted).toBe(GM_COARSE_GRANT)
    expect(state.restaurant.kitchen).toHaveLength(INITIAL_KITCHEN_COUNT + GM_COARSE_GRANT)
    expect(state.restaurant.kitchen.slice(-granted).every((item) => item.quality === '粗料')).toBe(true)
  })

  it('stops granting coarse at the kitchen cap', () => {
    const state = createInitialState()
    const granted = gmGrantCoarse(state, 99)
    expect(granted).toBe(KITCHEN_SLOT_MAX - INITIAL_KITCHEN_COUNT)
    expect(state.restaurant.kitchen).toHaveLength(KITCHEN_SLOT_MAX)
    expect(gmGrantCoarse(state, 1)).toBe(0)
  })

  it('recalls everyone to camp at full hp and stamina without shrinking beds', () => {
    const state = createInitialState()
    injureAndSendToHospital(state)
    injureAndSendToHospital(state)
    injureAndSendToHospital(state)
    starveAndSendToRestaurant(state)
    expect(expandBed(state)).toBe(true)
    gmRecallAll(state)
    expect(state.units.every((unit) => unit.location === 'camp')).toBe(true)
    expect(state.units.every((unit) => unit.hp === UNIT_MAX_HP && unit.stamina === UNIT_MAX_STAMINA)).toBe(true)
    expect(state.units.every((unit) => !unit.potionBoost && unit.order === null && !unit.served)).toBe(true)
    expect(state.beds.every((id) => id === null)).toBe(true)
    expect(state.beds).toHaveLength(INITIAL_BED_COUNT + 1)
    expect(state.queue).toEqual([])
    expect(state.restaurant.tables.every((id) => id === null)).toBe(true)
    expect(state.restaurant.queue).toEqual([])
  })
})

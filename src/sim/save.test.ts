import { describe, expect, it } from 'vitest'
import {
  INITIAL_SHELF_PER_DISH,
  INITIAL_TABLE_COUNT,
  INITIAL_UNIT_COUNT,
  SAVE_KEY,
  UNIT_MAX_HP,
  UNIT_MAX_STAMINA,
} from './config'
import { createInitialState, injureAndSendToHospital, starveAndSendToRestaurant, tick } from './game'
import { createMemoryStorage, deserialize, loadGame, saveGame, serialize } from './save'

describe('存档', () => {
  it('读写往返保持医院状态', () => {
    const state = createInitialState()
    injureAndSendToHospital(state)
    injureAndSendToHospital(state)
    injureAndSendToHospital(state)
    tick(state, 3)
    const blob = serialize(state, 1_700_000_000_000)
    const loaded = deserialize(blob)
    expect(loaded).not.toBeNull()
    expect(loaded?.savedAt).toBe(1_700_000_000_000)
    expect(loaded?.state).toEqual(state)
    expect(loaded?.state.units).not.toBe(state.units)
  })

  it('存档 v2 往返保持餐厅状态', () => {
    const state = createInitialState()
    starveAndSendToRestaurant(state)
    starveAndSendToRestaurant(state)
    tick(state, 1)
    const blob = serialize(state, 1_700_000_000_111)
    expect(blob.version).toBe(2)
    const loaded = deserialize(blob)
    expect(loaded).not.toBeNull()
    expect(loaded?.savedAt).toBe(1_700_000_000_111)
    expect(loaded?.state).toEqual(state)
    expect(loaded?.state.restaurant.tables).not.toBe(state.restaurant.tables)
    expect(loaded?.state.restaurant.shelf).not.toBe(state.restaurant.shelf)
  })

  it('经 storage 读写往返', () => {
    const storage = createMemoryStorage()
    const state = createInitialState()
    starveAndSendToRestaurant(state)
    tick(state, 1)
    saveGame(state, storage, 10_000)
    const loaded = loadGame(storage, 10_000)
    expect(loaded).toEqual(state)
    expect(storage.getItem(SAVE_KEY)).toContain('"version":2')
  })

  it('v1 旧档缺字段时迁移餐厅与体力', () => {
    const v1 = {
      version: 1,
      savedAt: 20_000,
      units: [
        {
          id: 'u1',
          name: '冲冲侠',
          hp: UNIT_MAX_HP,
          maxHp: UNIT_MAX_HP,
          location: 'camp',
          potionBoost: false,
        },
      ],
      beds: [null, null],
      queue: [],
      potionCount: 3,
      supply: 50,
      nextUnitId: 2,
    }
    const loaded = deserialize(v1)
    expect(loaded).not.toBeNull()
    expect(loaded?.state.units[0]?.stamina).toBe(UNIT_MAX_STAMINA)
    expect(loaded?.state.units[0]?.maxStamina).toBe(UNIT_MAX_STAMINA)
    expect(loaded?.state.units[0]?.order).toBeNull()
    expect(loaded?.state.units[0]?.served).toBe(false)
    expect(loaded?.state.restaurant.tables).toHaveLength(INITIAL_TABLE_COUNT)
    expect(loaded?.state.restaurant.queue).toEqual([])
    expect(loaded?.state.restaurant.shelf.粥).toBe(INITIAL_SHELF_PER_DISH)
    expect(loaded?.state.restaurant.shelf.炒饭).toBe(INITIAL_SHELF_PER_DISH)
    expect(loaded?.state.restaurant.shelf.烤肉).toBe(INITIAL_SHELF_PER_DISH)
  })

  it('读档失败回落新档', () => {
    const broken = createMemoryStorage({ [SAVE_KEY]: '{not json' })
    const fresh = loadGame(broken, 0)
    expect(fresh.units).toHaveLength(INITIAL_UNIT_COUNT)
    expect(
      fresh.units.every(
        (unit) => unit.location === 'camp' && unit.hp === UNIT_MAX_HP && unit.stamina === UNIT_MAX_STAMINA,
      ),
    ).toBe(true)

    const badVersion = createMemoryStorage({
      [SAVE_KEY]: JSON.stringify({ version: 99, savedAt: 1, units: [] }),
    })
    expect(loadGame(badVersion, 0).units).toHaveLength(INITIAL_UNIT_COUNT)
    expect(deserialize({ version: 1 })).toBeNull()
    expect(deserialize({ version: 2 })).toBeNull()
  })
})

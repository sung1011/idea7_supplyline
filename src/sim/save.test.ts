import { describe, expect, it } from 'vitest'
import {
  INITIAL_KITCHEN_COUNT,
  INITIAL_SHELF_PER_DISH,
  INITIAL_TABLE_COUNT,
  INITIAL_UNIT_COUNT,
  MARCH_DURATION_SEC,
  SAVE_KEY,
  SAVE_VERSION,
  UNIT_MAX_HP,
  UNIT_MAX_STAMINA,
} from './config'
import { createInitialState, injureAndSendToHospital, startMarch, starveAndSendToRestaurant, tick } from './game'
import { mergeIngredients } from './kitchen'
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

  it('存档 v4 往返保持餐厅、后厨与出征进度', () => {
    const state = createInitialState()
    starveAndSendToRestaurant(state)
    starveAndSendToRestaurant(state)
    const idle = state.units.find((unit) => unit.location === 'camp')
    expect(idle).toBeTruthy()
    startMarch(state, idle!.id)
    const [a, b] = state.restaurant.kitchen
    if (a && b) mergeIngredients(state, a.id, b.id, () => 0)
    tick(state, 1)
    const blob = serialize(state, 1_700_000_000_111)
    expect(blob.version).toBe(SAVE_VERSION)
    expect(blob.version).toBe(4)
    const loaded = deserialize(blob)
    expect(loaded).not.toBeNull()
    expect(loaded?.savedAt).toBe(1_700_000_000_111)
    expect(loaded?.state).toEqual(state)
    expect(loaded?.state.units.some((unit) => unit.location === 'marching')).toBe(true)
    expect(loaded?.state.units.every((unit) => unit.generalId.length > 0)).toBe(true)
    expect(loaded?.state.restaurant.tables).not.toBe(state.restaurant.tables)
    expect(loaded?.state.restaurant.shelf).not.toBe(state.restaurant.shelf)
    expect(loaded?.state.restaurant.kitchen).not.toBe(state.restaurant.kitchen)
    expect(loaded?.state.restaurant.chefWeight).not.toBe(state.restaurant.chefWeight)
  })

  it('经 storage 读写往返', () => {
    const storage = createMemoryStorage()
    const state = createInitialState()
    starveAndSendToRestaurant(state)
    tick(state, 1)
    saveGame(state, storage, 10_000)
    const loaded = loadGame(storage, 10_000)
    expect(loaded).toEqual(state)
    expect(storage.getItem(SAVE_KEY)).toContain('"version":4')
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
    expect(loaded?.state.units[0]?.generalId).toBe('liubei')
    expect(loaded?.state.units[0]?.name).toBe('刘备')
    expect(loaded?.state.units[0]?.jobRemain).toBe(0)
    expect(loaded?.state.restaurant.tables).toHaveLength(INITIAL_TABLE_COUNT)
    expect(loaded?.state.restaurant.queue).toEqual([])
    expect(loaded?.state.restaurant.shelf.粥).toBe(INITIAL_SHELF_PER_DISH)
    expect(loaded?.state.restaurant.shelf.炒饭).toBe(INITIAL_SHELF_PER_DISH)
    expect(loaded?.state.restaurant.shelf.烤肉).toBe(INITIAL_SHELF_PER_DISH)
    expect(loaded?.state.restaurant.kitchen).toHaveLength(INITIAL_KITCHEN_COUNT)
    expect(loaded?.state.restaurant.chefWeight).toEqual({ 粥: 1, 炒饭: 1, 烤肉: 1 })
    expect(loaded?.state.restaurant.shelfStar).toEqual({ 粥: 0, 炒饭: 0, 烤肉: 0 })
  })

  it('v2 旧档缺后厨字段时补材料栏与偏好', () => {
    const v2 = {
      version: 2,
      savedAt: 30_000,
      units: [
        {
          id: 'u1',
          name: '冲冲侠',
          hp: UNIT_MAX_HP,
          maxHp: UNIT_MAX_HP,
          stamina: 0,
          maxStamina: UNIT_MAX_STAMINA,
          location: 'restaurant_seat',
          potionBoost: false,
          order: '粥',
          served: false,
        },
      ],
      beds: [null, null],
      queue: [],
      potionCount: 3,
      supply: 50,
      nextUnitId: 2,
      restaurant: {
        tables: ['u1'],
        queue: [],
        shelf: { 粥: 1, 炒饭: 2, 烤肉: 3 },
        nextDishIndex: 4,
      },
    }
    const loaded = deserialize(v2)
    expect(loaded).not.toBeNull()
    expect(loaded?.state.restaurant.shelf).toEqual({ 粥: 1, 炒饭: 2, 烤肉: 3 })
    expect(loaded?.state.restaurant.tables).toEqual(['u1'])
    expect(loaded?.state.units[0]?.order).toBe('粥')
    expect(loaded?.state.restaurant.kitchen).toHaveLength(INITIAL_KITCHEN_COUNT)
    expect(loaded?.state.restaurant.chefWeight).toEqual({ 粥: 1, 炒饭: 1, 烤肉: 1 })
    expect(loaded?.state.restaurant.nextIngredientId).toBe(INITIAL_KITCHEN_COUNT + 1)
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
    expect(deserialize({ version: 3 })).toBeNull()
    expect(deserialize({ version: 4 })).toBeNull()
  })

  it('v3 旧档按昵称挂到名将表', () => {
    const v3 = {
      version: 3,
      savedAt: 40_000,
      units: [
        {
          id: 'u1',
          name: '冲冲侠',
          hp: UNIT_MAX_HP,
          maxHp: UNIT_MAX_HP,
          stamina: UNIT_MAX_STAMINA,
          maxStamina: UNIT_MAX_STAMINA,
          location: 'camp',
          potionBoost: false,
          order: null,
          served: false,
        },
        {
          id: 'u2',
          name: '盾盾仔',
          hp: UNIT_MAX_HP,
          maxHp: UNIT_MAX_HP,
          stamina: UNIT_MAX_STAMINA,
          maxStamina: UNIT_MAX_STAMINA,
          location: 'camp',
          potionBoost: false,
          order: null,
          served: false,
        },
      ],
      beds: [null, null],
      queue: [],
      potionCount: 3,
      supply: 50,
      nextUnitId: 3,
    }
    const loaded = deserialize(v3)
    expect(loaded).not.toBeNull()
    expect(loaded?.state.units.map((unit) => unit.generalId)).toEqual(['liubei', 'guanyu'])
    expect(loaded?.state.units.map((unit) => unit.name)).toEqual(['刘备', '关羽'])
  })

  it('读档后补算出征剩余时间', () => {
    const state = createInitialState()
    const unit = state.units[0]!
    startMarch(state, unit.id)
    unit.jobRemain = 4
    const blob = serialize(state, 1000)
    const loaded = deserialize(blob)
    expect(loaded?.state.units[0]?.location).toBe('marching')
    expect(loaded?.state.units[0]?.jobRemain).toBe(4)
    expect(loaded?.state.units[0]?.jobTotal).toBe(MARCH_DURATION_SEC)
  })
})

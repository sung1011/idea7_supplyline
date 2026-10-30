import { describe, expect, it } from 'vitest'
import { INITIAL_UNIT_COUNT, SAVE_KEY, UNIT_MAX_HP } from './config'
import { createInitialState, injureAndSendToHospital, tick } from './game'
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

  it('经 storage 读写往返', () => {
    const storage = createMemoryStorage()
    const state = createInitialState()
    injureAndSendToHospital(state)
    tick(state, 1)
    saveGame(state, storage, 10_000)
    const loaded = loadGame(storage, 10_000)
    expect(loaded).toEqual(state)
    expect(storage.getItem(SAVE_KEY)).toContain('"version":1')
  })

  it('读档失败回落新档', () => {
    const broken = createMemoryStorage({ [SAVE_KEY]: '{not json' })
    const fresh = loadGame(broken, 0)
    expect(fresh.units).toHaveLength(INITIAL_UNIT_COUNT)
    expect(fresh.units.every((unit) => unit.location === 'camp' && unit.hp === UNIT_MAX_HP)).toBe(true)

    const badVersion = createMemoryStorage({
      [SAVE_KEY]: JSON.stringify({ version: 99, savedAt: 1, units: [] }),
    })
    expect(loadGame(badVersion, 0).units).toHaveLength(INITIAL_UNIT_COUNT)
    expect(deserialize({ version: 1 })).toBeNull()
  })
})

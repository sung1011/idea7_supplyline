import { describe, expect, it } from 'vitest'
import { UNIT_NAMES } from './config'
import { createInitialState } from './game'
import {
  capturableGenerals,
  GENERALS,
  LEGACY_UNIT_NAME_TO_GENERAL_ID,
  occupiedGeneralIds,
  resolveGeneralId,
  STARTER_GENERAL_IDS,
} from './generals'

describe('名将表', () => {
  it('正史名 12～16 人，id 唯一，含开局 4 人', () => {
    expect(GENERALS.length).toBeGreaterThanOrEqual(12)
    expect(GENERALS.length).toBeLessThanOrEqual(16)
    expect(new Set(GENERALS.map((item) => item.id)).size).toBe(GENERALS.length)
    expect(STARTER_GENERAL_IDS).toHaveLength(4)
    for (const id of STARTER_GENERAL_IDS) {
      expect(GENERALS.some((item) => item.id === id)).toBe(true)
    }
  })

  it('旧四人昵称映射到开局名将', () => {
    expect(UNIT_NAMES.map((name) => LEGACY_UNIT_NAME_TO_GENERAL_ID[name])).toEqual([...STARTER_GENERAL_IDS])
    expect(resolveGeneralId('冲冲侠')).toBe('liubei')
    expect(resolveGeneralId('刘备')).toBe('liubei')
    expect(resolveGeneralId('关羽', 'guanyu')).toBe('guanyu')
  })

  it('开局占用四人，可俘池为尚未拥有的名将', () => {
    const state = createInitialState()
    expect([...occupiedGeneralIds(state)]).toEqual([...STARTER_GENERAL_IDS])
    const pool = capturableGenerals(state)
    expect(pool.every((item) => !STARTER_GENERAL_IDS.includes(item.id as (typeof STARTER_GENERAL_IDS)[number]))).toBe(
      true,
    )
    expect(pool.length).toBe(GENERALS.length - STARTER_GENERAL_IDS.length)
  })
})

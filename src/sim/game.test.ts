import { describe, expect, it } from 'vitest'
import {
  BASE_HEAL_PER_SEC,
  EXPAND_BED_COST,
  INITIAL_BED_COUNT,
  INITIAL_POTION_COUNT,
  INITIAL_SUPPLY,
  INJURE_HP,
  POTION_HEAL_MULTIPLIER,
  UNIT_MAX_HP,
} from './config'
import {
  applyPotion,
  createInitialState,
  expandBed,
  findUnit,
  injureAndSendToHospital,
  tick,
} from './game'

function injureMany(state: ReturnType<typeof createInitialState>, times: number): void {
  for (let i = 0; i < times; i++) {
    const ok = injureAndSendToHospital(state)
    expect(ok).toBe(true)
  }
}

describe('医院闭环', () => {
  it('占床单位按基础速度回血', () => {
    const state = createInitialState()
    injureAndSendToHospital(state)
    const unit = state.units.find((item) => item.location === 'hospital_bed')
    expect(unit).toBeTruthy()
    expect(unit?.hp).toBe(INJURE_HP)
    tick(state, 2)
    expect(unit?.hp).toBe(INJURE_HP + BASE_HEAL_PER_SEC * 2)
    expect(unit?.location).toBe('hospital_bed')
  })

  it('排队不回血', () => {
    const state = createInitialState()
    injureMany(state, INITIAL_BED_COUNT + 1)
    const queued = state.units.find((item) => item.location === 'hospital_queue')
    expect(queued).toBeTruthy()
    const hp = queued!.hp
    tick(state, 5)
    expect(queued?.hp).toBe(hp)
    expect(queued?.location).toBe('hospital_queue')
  })

  it('满血离院回营地并夹到 maxHp', () => {
    const state = createInitialState()
    injureAndSendToHospital(state)
    const unit = state.units.find((item) => item.id === state.beds[0])
    expect(unit).toBeTruthy()
    const need = UNIT_MAX_HP - INJURE_HP
    tick(state, need / BASE_HEAL_PER_SEC + 1)
    expect(unit?.location).toBe('camp')
    expect(unit?.hp).toBe(UNIT_MAX_HP)
    expect(unit?.potionBoost).toBe(false)
    expect(state.beds[0]).toBeNull()
  })

  it('空床立即分给队首', () => {
    const state = createInitialState()
    injureMany(state, INITIAL_BED_COUNT + 1)
    const queuedId = state.queue[0]
    expect(queuedId).toBeTruthy()
    const need = UNIT_MAX_HP - INJURE_HP
    tick(state, need / BASE_HEAL_PER_SEC)
    const unit = findUnit(state, queuedId)
    expect(unit?.location).toBe('hospital_bed')
    expect(state.beds.includes(queuedId)).toBe(true)
    expect(state.queue.includes(queuedId)).toBe(false)
  })

  it('药剂加速占床回血并耗药', () => {
    const state = createInitialState()
    injureAndSendToHospital(state)
    const unit = findUnit(state, state.beds[0]!)
    expect(unit).toBeTruthy()
    expect(applyPotion(state, unit!.id)).toBe(true)
    expect(state.potionCount).toBe(INITIAL_POTION_COUNT - 1)
    expect(unit?.potionBoost).toBe(true)
    tick(state, 2)
    expect(unit?.hp).toBe(INJURE_HP + BASE_HEAL_PER_SEC * POTION_HEAL_MULTIPLIER * 2)
  })

  it('没占床不能用药', () => {
    const state = createInitialState()
    injureMany(state, INITIAL_BED_COUNT + 1)
    const queued = state.units.find((item) => item.location === 'hospital_queue')
    const camp = state.units.find((item) => item.location === 'camp')
    expect(queued).toBeTruthy()
    expect(applyPotion(state, queued!.id)).toBe(false)
    if (camp) expect(applyPotion(state, camp.id)).toBe(false)
    expect(state.potionCount).toBe(INITIAL_POTION_COUNT)
    expect(queued?.potionBoost).toBe(false)
  })

  it('扩床扣补给并加一张床，空床接队首', () => {
    const state = createInitialState()
    injureMany(state, INITIAL_BED_COUNT + 1)
    const queuedId = state.queue[0]
    expect(expandBed(state)).toBe(true)
    expect(state.supply).toBe(INITIAL_SUPPLY - EXPAND_BED_COST)
    expect(state.beds.length).toBe(INITIAL_BED_COUNT + 1)
    expect(state.beds.includes(queuedId)).toBe(true)
    expect(findUnit(state, queuedId)?.location).toBe('hospital_bed')
  })

  it('补给不够时扩床失败', () => {
    const state = createInitialState()
    state.supply = EXPAND_BED_COST - 1
    expect(expandBed(state)).toBe(false)
    expect(state.supply).toBe(EXPAND_BED_COST - 1)
    expect(state.beds.length).toBe(INITIAL_BED_COUNT)
  })
})

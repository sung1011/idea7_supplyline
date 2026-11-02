import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
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
  INJURE_HP,
  MARCH_DURATION_SEC,
  MARCH_INJURY_HP,
  MARCH_STAMINA_COST,
  MARCH_SUPPLY_GAIN,
  PERSUADE_SEC,
  POTION_HEAL_MULTIPLIER,
  RESTOCK_PER_DISH,
  UNIT_MAX_HP,
  UNIT_MAX_STAMINA,
} from './config'
import {
  applyPotion,
  canMarchUnit,
  canPersuadeUnit,
  createInitialState,
  expandBed,
  expandTable,
  findUnit,
  injureAndSendToHospital,
  restockShelf,
  serveDish,
  startMarch,
  startPersuade,
  starveAndSendToRestaurant,
  tick,
} from './game'
import { capturableGenerals, STARTER_GENERAL_IDS } from './generals'
import type { Rng } from './types'

function rngSeq(values: number[]): Rng {
  let index = 0
  return () => values[index++] ?? 0.99
}

function injureMany(state: ReturnType<typeof createInitialState>, times: number): void {
  for (let i = 0; i < times; i++) {
    const ok = injureAndSendToHospital(state)
    expect(ok).toBe(true)
  }
}

function starveMany(state: ReturnType<typeof createInitialState>, times: number): void {
  for (let i = 0; i < times; i++) {
    const ok = starveAndSendToRestaurant(state)
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

describe('餐厅闭环', () => {
  it('占座后点餐，上菜后按速度回体力', () => {
    const state = createInitialState()
    expect(starveAndSendToRestaurant(state)).toBe(true)
    const unit = findUnit(state, state.restaurant.tables[0]!)
    expect(unit).toBeTruthy()
    expect(unit?.location).toBe('restaurant_seat')
    expect(unit?.stamina).toBe(HUNGER_STAMINA)
    expect(unit?.order).toBe(DISH_KINDS[0])
    expect(unit?.served).toBe(false)
    tick(state, 3)
    expect(unit?.stamina).toBe(HUNGER_STAMINA)
    expect(serveDish(state, unit!.id)).toBe(true)
    expect(unit?.served).toBe(true)
    tick(state, 2)
    expect(unit?.stamina).toBe(HUNGER_STAMINA + EAT_PER_SEC * 2)
    expect(unit?.location).toBe('restaurant_seat')
  })

  it('排队不进食', () => {
    const state = createInitialState()
    starveMany(state, INITIAL_TABLE_COUNT + 1)
    const seated = findUnit(state, state.restaurant.tables[0]!)
    const queued = state.units.find((item) => item.location === 'restaurant_queue')
    expect(seated).toBeTruthy()
    expect(queued).toBeTruthy()
    expect(queued?.order).toBeNull()
    expect(serveDish(state, seated!.id)).toBe(true)
    tick(state, 5)
    expect(queued?.stamina).toBe(HUNGER_STAMINA)
    expect(queued?.location).toBe('restaurant_queue')
    expect(queued?.served).toBe(false)
  })

  it('上菜消耗对应货架库存', () => {
    const state = createInitialState()
    starveAndSendToRestaurant(state)
    const unit = findUnit(state, state.restaurant.tables[0]!)
    const dish = unit!.order!
    expect(state.restaurant.shelf[dish]).toBe(INITIAL_SHELF_PER_DISH)
    expect(serveDish(state, unit!.id)).toBe(true)
    expect(state.restaurant.shelf[dish]).toBe(INITIAL_SHELF_PER_DISH - 1)
    expect(serveDish(state, unit!.id)).toBe(false)
  })

  it('空货架不能上菜', () => {
    const state = createInitialState()
    starveAndSendToRestaurant(state)
    const unit = findUnit(state, state.restaurant.tables[0]!)
    const dish = unit!.order!
    state.restaurant.shelf[dish] = 0
    expect(serveDish(state, unit!.id)).toBe(false)
    expect(unit?.served).toBe(false)
    tick(state, 4)
    expect(unit?.stamina).toBe(HUNGER_STAMINA)
    restockShelf(state)
    expect(state.restaurant.shelf[dish]).toBe(RESTOCK_PER_DISH)
    expect(serveDish(state, unit!.id)).toBe(true)
  })

  it('吃完回营地，空座接队首并让其点餐', () => {
    const state = createInitialState()
    starveMany(state, INITIAL_TABLE_COUNT + 1)
    const seatedId = state.restaurant.tables[0]!
    const queuedId = state.restaurant.queue[0]
    const seated = findUnit(state, seatedId)
    expect(serveDish(state, seatedId)).toBe(true)
    tick(state, UNIT_MAX_STAMINA / EAT_PER_SEC + 1)
    expect(seated?.location).toBe('camp')
    expect(seated?.stamina).toBe(UNIT_MAX_STAMINA)
    expect(seated?.order).toBeNull()
    expect(seated?.served).toBe(false)
    const next = findUnit(state, queuedId)
    expect(next?.location).toBe('restaurant_seat')
    expect(next?.order).toBe(DISH_KINDS[1])
    expect(next?.served).toBe(false)
    expect(state.restaurant.tables.includes(queuedId)).toBe(true)
    expect(state.restaurant.queue.includes(queuedId)).toBe(false)
  })

  it('扩桌扣补给并加一座，空座接队首', () => {
    const state = createInitialState()
    starveMany(state, INITIAL_TABLE_COUNT + 1)
    const queuedId = state.restaurant.queue[0]
    expect(expandTable(state)).toBe(true)
    expect(state.supply).toBe(INITIAL_SUPPLY - EXPAND_TABLE_COST)
    expect(state.restaurant.tables.length).toBe(INITIAL_TABLE_COUNT + 1)
    expect(state.restaurant.tables.includes(queuedId)).toBe(true)
    const unit = findUnit(state, queuedId)
    expect(unit?.location).toBe('restaurant_seat')
    expect(unit?.order).toBe(DISH_KINDS[1])
  })

  it('补给不够时扩桌失败', () => {
    const state = createInitialState()
    state.supply = EXPAND_TABLE_COST - 1
    expect(expandTable(state)).toBe(false)
    expect(state.supply).toBe(EXPAND_TABLE_COST - 1)
    expect(state.restaurant.tables.length).toBe(INITIAL_TABLE_COUNT)
  })

  it('饿了送餐：满体力营地人清零并送餐厅', () => {
    const state = createInitialState()
    const unit = state.units[0]
    expect(unit?.location).toBe('camp')
    expect(unit?.stamina).toBe(UNIT_MAX_STAMINA)
    expect(starveAndSendToRestaurant(state)).toBe(true)
    expect(unit?.stamina).toBe(HUNGER_STAMINA)
    expect(unit?.location).toBe('restaurant_seat')
    expect(state.restaurant.tables[0]).toBe(unit!.id)
  })

  it('Vue reactive 代理上造伤送医与饿了送餐可用', () => {
    const state = reactive(createInitialState())
    expect(injureAndSendToHospital(state)).toBe(true)
    expect(state.units[0]?.location).toBe('hospital_bed')
    expect(state.units[0]?.hp).toBe(INJURE_HP)
    expect(starveAndSendToRestaurant(state)).toBe(true)
    const diner = state.units.find((item) => item.location === 'restaurant_seat')
    expect(diner?.stamina).toBe(HUNGER_STAMINA)
    expect(state.restaurant.tables[0]).toBe(diner?.id)
  })

  it('医院与餐厅可在同一 tick 并存', () => {
    const state = createInitialState()
    injureAndSendToHospital(state)
    starveAndSendToRestaurant(state)
    const patient = findUnit(state, state.beds[0]!)
    const diner = findUnit(state, state.restaurant.tables[0]!)
    expect(serveDish(state, diner!.id)).toBe(true)
    tick(state, 2)
    expect(patient?.hp).toBe(INJURE_HP + BASE_HEAL_PER_SEC * 2)
    expect(patient?.location).toBe('hospital_bed')
    expect(diner?.stamina).toBe(HUNGER_STAMINA + EAT_PER_SEC * 2)
    expect(diner?.location).toBe('restaurant_seat')
  })
})

describe('名将出征与劝降', () => {
  it('开局四人挂到名将表且满血满体待命', () => {
    const state = createInitialState()
    expect(state.units.map((unit) => unit.generalId)).toEqual([...STARTER_GENERAL_IDS])
    expect(state.units.every((unit) => unit.location === 'camp' && unit.name.length > 0)).toBe(true)
    expect(canMarchUnit(state, state.units[0]!.id)).toBe(true)
  })

  it('非满血满体不能出征', () => {
    const state = createInitialState()
    const unit = state.units[0]!
    unit.hp = unit.maxHp - 1
    expect(startMarch(state, unit.id)).toBe(false)
    unit.hp = unit.maxHp
    unit.stamina = unit.maxStamina - 1
    expect(startMarch(state, unit.id)).toBe(false)
    expect(unit.location).toBe('camp')
  })

  it('出征走完扣补给并可能轻伤送医、偶发俘虏', () => {
    const state = createInitialState()
    const unit = state.units[0]!
    const supply = state.supply
    expect(startMarch(state, unit.id)).toBe(true)
    expect(unit.location).toBe('marching')
    tick(state, MARCH_DURATION_SEC, rngSeq([0, 0, 0]))
    expect(state.supply).toBe(supply + MARCH_SUPPLY_GAIN)
    expect(unit.hp).toBe(UNIT_MAX_HP - MARCH_INJURY_HP)
    expect(unit.location).toBe('hospital_bed')
    const captive = state.units.find((item) => item.location === 'captive')
    expect(captive).toBeTruthy()
    expect(capturableGenerals(state).some((item) => item.id === captive!.generalId)).toBe(false)
  })

  it('同 generalId 已占用则不再出俘', () => {
    const state = createInitialState()
    const unit = state.units[0]!
    startMarch(state, unit.id)
    tick(state, MARCH_DURATION_SEC, rngSeq([0.99, 0, 0]))
    const first = state.units.find((item) => item.location === 'captive')
    expect(first).toBeTruthy()
    const ids = new Set(state.units.map((item) => item.generalId))
    expect(ids.size).toBe(state.units.length)

    const ready = state.units.find((item) => canMarchUnit(state, item.id))
    expect(ready).toBeTruthy()
    startMarch(state, ready!.id)
    tick(state, MARCH_DURATION_SEC, rngSeq([0.99, 0, 0]))
    const captives = state.units.filter((item) => item.location === 'captive')
    expect(captives).toHaveLength(2)
    expect(captives[0]?.generalId).not.toBe(captives[1]?.generalId)
    expect(new Set(state.units.map((item) => item.generalId)).size).toBe(state.units.length)
  })

  it('无伤出征扣体力并送餐厅', () => {
    const state = createInitialState()
    const unit = state.units[0]!
    startMarch(state, unit.id)
    tick(state, MARCH_DURATION_SEC, rngSeq([0.99, 0, 0.99]))
    expect(unit.stamina).toBe(UNIT_MAX_STAMINA - MARCH_STAMINA_COST)
    expect(unit.hp).toBe(UNIT_MAX_HP)
    expect(unit.location).toBe('restaurant_seat')
    expect(state.units.some((item) => item.location === 'captive')).toBe(false)
  })

  it('劝降成功入编制，不可再俘同 id', () => {
    const state = createInitialState()
    const unit = state.units[0]!
    startMarch(state, unit.id)
    tick(state, MARCH_DURATION_SEC, rngSeq([0.99, 0, 0]))
    const captive = state.units.find((item) => item.location === 'captive')!
    expect(canPersuadeUnit(state, captive.id)).toBe(true)
    expect(startPersuade(state, captive.id)).toBe(true)
    expect(captive.location).toBe('persuading')
    tick(state, PERSUADE_SEC.战 + PERSUADE_SEC.智, rngSeq([0]))
    expect(findUnit(state, captive.id)?.location).toBe('camp')
    expect(capturableGenerals(state).some((item) => item.id === captive.generalId)).toBe(false)
    expect(canPersuadeUnit(state, captive.id)).toBe(false)
  })

  it('劝降失败则释放，不可再劝同一次俘虏', () => {
    const state = createInitialState()
    const unit = state.units[0]!
    startMarch(state, unit.id)
    tick(state, MARCH_DURATION_SEC, rngSeq([0.99, 0, 0]))
    const captive = state.units.find((item) => item.location === 'captive')!
    const generalId = captive.generalId
    startPersuade(state, captive.id)
    tick(state, 30, rngSeq([0.99]))
    expect(findUnit(state, captive.id)).toBeUndefined()
    expect(state.units.some((item) => item.generalId === generalId)).toBe(false)
    expect(capturableGenerals(state).some((item) => item.id === generalId)).toBe(true)
  })
})

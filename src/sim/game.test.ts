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
  POTION_HEAL_MULTIPLIER,
  RESTOCK_PER_DISH,
  UNIT_MAX_HP,
  UNIT_MAX_STAMINA,
} from './config'
import {
  applyPotion,
  createInitialState,
  expandBed,
  expandTable,
  findUnit,
  injureAndSendToHospital,
  restockShelf,
  serveDish,
  starveAndSendToRestaurant,
  tick,
} from './game'

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

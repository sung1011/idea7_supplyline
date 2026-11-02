import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { INITIAL_KITCHEN_COUNT, INITIAL_SHELF_PER_DISH, KITCHEN_SLOT_MAX, MENU_CATS } from './config'
import { createInitialState, starveAndSendToRestaurant } from './game'
import {
  boostChefWeight,
  cookByChefPreference,
  cookIngredient,
  createChefWeight,
  grantCoarse,
  mergeIngredients,
  pickWeightedCat,
  reservedOrderCounts,
} from './kitchen'
import type { Ingredient } from './types'

function coarse(id: string, kind: Ingredient['kind'] = '饭'): Ingredient {
  return { id, kind, quality: '粗料' }
}

function snapshotMenu(state: ReturnType<typeof createInitialState>) {
  return {
    饭: { ...state.restaurant.menu.饭 },
    菜: { ...state.restaurant.menu.菜 },
    酒: { ...state.restaurant.menu.酒 },
  }
}

describe('后厨 merge / 出菜 / 偏好', () => {
  it('同档两件 merge 升一档，且不消耗菜单库存', () => {
    const state = createInitialState()
    const menu = snapshotMenu(state)
    state.restaurant.kitchen = [coarse('a', '饭'), coarse('b', '酒')]
    state.restaurant.chefWeight = createChefWeight()
    expect(mergeIngredients(state, 'a', 'b', () => 0)).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(1)
    expect(state.restaurant.kitchen[0]?.quality).toBe('好料')
    expect(state.restaurant.kitchen[0]?.kind).toBe('饭')
    expect(state.restaurant.menu).toEqual(menu)
  })

  it('精品再 merge 仍出精品，种类可与原料不同', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [
      { id: 'a', kind: '酒', quality: '精品' },
      { id: 'b', kind: '酒', quality: '精品' },
    ]
    state.restaurant.chefWeight = { 饭: 1, 菜: 0, 酒: 0 }
    expect(mergeIngredients(state, 'a', 'b', () => 0.99)).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(1)
    expect(state.restaurant.kitchen[0]?.quality).toBe('精品')
    expect(state.restaurant.kitchen[0]?.kind).toBe('饭')
  })

  it('不同档或同一件不能 merge', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [
      coarse('a'),
      { id: 'b', kind: '饭', quality: '好料' },
    ]
    expect(mergeIngredients(state, 'a', 'b')).toBe(false)
    expect(mergeIngredients(state, 'a', 'a')).toBe(false)
    expect(state.restaurant.kitchen).toHaveLength(2)
  })

  it('做成菜耗材料、写入该 cat 当前上架菜库存', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [coarse('a', '菜')]
    const before = state.restaurant.menu.菜.stock
    expect(cookIngredient(state, 'a')).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(0)
    expect(state.restaurant.menu.菜.stock).toBe(before + 1)
    expect(state.restaurant.menu.菜.dishId).toBe('huiGuoRou')
    expect(state.restaurant.menu.菜.star).toBe(0)
  })

  it('高品质做成菜给当前上架菜打星标', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [{ id: 'p', kind: '酒', quality: '精品' }]
    expect(cookIngredient(state, 'p')).toBe(true)
    expect(state.restaurant.menu.酒.stock).toBe(INITIAL_SHELF_PER_DISH + 1)
    expect(state.restaurant.menu.酒.star).toBe(1)
    expect(state.restaurant.menu.酒.dishId).toBe('zhuoJiu')
  })

  it('栏满拒绝发粗料', () => {
    const state = createInitialState()
    state.restaurant.kitchen = Array.from({ length: KITCHEN_SLOT_MAX }, (_, i) =>
      coarse(`x${i}`, MENU_CATS[i % MENU_CATS.length]),
    )
    expect(grantCoarse(state, () => 0)).toBe(false)
    expect(state.restaurant.kitchen).toHaveLength(KITCHEN_SLOT_MAX)
    state.restaurant.kitchen.pop()
    expect(grantCoarse(state, () => 0)).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(KITCHEN_SLOT_MAX)
    expect(state.restaurant.kitchen.at(-1)?.quality).toBe('粗料')
    expect(state.restaurant.kitchen.at(-1)?.kind).toBe('饭')
  })

  it('偏好加权可注入 RNG：merge 出种跟着三类权重', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [coarse('a', '酒'), coarse('b', '酒')]
    state.restaurant.chefWeight = { 饭: 0, 菜: 1, 酒: 0 }
    expect(mergeIngredients(state, 'a', 'b', () => 0)).toBe(true)
    expect(state.restaurant.kitchen[0]?.kind).toBe('菜')
    expect(pickWeightedCat({ 饭: 0, 菜: 0, 酒: 8 }, () => 0.5)).toBe('酒')
  })

  it('按偏好做成菜按权重抽样材料', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [coarse('rice', '饭'), coarse('meat', '酒')]
    state.restaurant.chefWeight = { 饭: 0, 菜: 0, 酒: 3 }
    expect(cookByChefPreference(state, () => 0.1)).toBe(true)
    expect(state.restaurant.kitchen.map((item) => item.id)).toEqual(['rice'])
    expect(state.restaurant.menu.酒.stock).toBe(INITIAL_SHELF_PER_DISH + 1)
  })

  it('点某一类加重厨师偏好', () => {
    const state = createInitialState()
    expect(state.restaurant.chefWeight).toEqual({ 饭: 1, 菜: 1, 酒: 1 })
    boostChefWeight(state, '菜')
    expect(state.restaurant.chefWeight.菜).toBe(2)
  })

  it('占座未上菜时该 cat 记为订单预留，merge 仍不碰菜单', () => {
    const state = createInitialState()
    expect(starveAndSendToRestaurant(state)).toBe(true)
    const reserved = reservedOrderCounts(state)
    expect(reserved.饭).toBe(1)
    expect(reserved.菜).toBe(0)
    const menu = snapshotMenu(state)
    state.restaurant.kitchen = [coarse('a'), coarse('b')]
    expect(mergeIngredients(state, 'a', 'b', () => 0)).toBe(true)
    expect(state.restaurant.menu).toEqual(menu)
  })

  it('初始后厨约 6 个粗料且只属饭菜酒', () => {
    const state = createInitialState()
    expect(state.restaurant.kitchen).toHaveLength(INITIAL_KITCHEN_COUNT)
    expect(state.restaurant.kitchen.every((item) => item.quality === '粗料')).toBe(true)
    expect(state.restaurant.kitchen.every((item) => MENU_CATS.includes(item.kind))).toBe(true)
    expect(new Set(state.restaurant.kitchen.map((item) => item.id)).size).toBe(INITIAL_KITCHEN_COUNT)
  })

  it('Vue reactive 代理上 merge / 出菜可用', () => {
    const state = reactive(createInitialState())
    state.restaurant.kitchen = [coarse('a', '饭'), coarse('b', '饭')]
    expect(mergeIngredients(state, 'a', 'b', () => 0)).toBe(true)
    const id = state.restaurant.kitchen[0]?.id
    expect(id).toBeTruthy()
    expect(cookIngredient(state, id!)).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(0)
  })
})

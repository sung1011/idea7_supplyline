import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { DISH_KINDS, INITIAL_KITCHEN_COUNT, INITIAL_SHELF_PER_DISH, KITCHEN_SLOT_MAX } from './config'
import { createInitialState, starveAndSendToRestaurant } from './game'
import {
  boostChefWeight,
  cookByChefPreference,
  cookIngredient,
  createChefWeight,
  grantCoarse,
  mergeIngredients,
  pickWeightedDish,
  reservedOrderCounts,
} from './kitchen'
import type { Ingredient } from './types'

function coarse(id: string, kind: Ingredient['kind'] = '粥'): Ingredient {
  return { id, kind, quality: '粗料' }
}

function snapshotShelf(state: ReturnType<typeof createInitialState>) {
  return { ...state.restaurant.shelf }
}

describe('后厨 merge / 出菜 / 偏好', () => {
  it('同档两件 merge 升一档，且不消耗货架', () => {
    const state = createInitialState()
    const shelf = snapshotShelf(state)
    state.restaurant.kitchen = [coarse('a', '粥'), coarse('b', '烤肉')]
    state.restaurant.chefWeight = createChefWeight()
    expect(mergeIngredients(state, 'a', 'b', () => 0)).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(1)
    expect(state.restaurant.kitchen[0]?.quality).toBe('好料')
    expect(state.restaurant.kitchen[0]?.kind).toBe('粥')
    expect(state.restaurant.shelf).toEqual(shelf)
  })

  it('精品再 merge 仍出精品，种类可与原料不同', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [
      { id: 'a', kind: '烤肉', quality: '精品' },
      { id: 'b', kind: '烤肉', quality: '精品' },
    ]
    state.restaurant.chefWeight = { 粥: 1, 炒饭: 0, 烤肉: 0 }
    expect(mergeIngredients(state, 'a', 'b', () => 0.99)).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(1)
    expect(state.restaurant.kitchen[0]?.quality).toBe('精品')
    expect(state.restaurant.kitchen[0]?.kind).toBe('粥')
  })

  it('不同档或同一件不能 merge', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [
      coarse('a'),
      { id: 'b', kind: '粥', quality: '好料' },
    ]
    expect(mergeIngredients(state, 'a', 'b')).toBe(false)
    expect(mergeIngredients(state, 'a', 'a')).toBe(false)
    expect(state.restaurant.kitchen).toHaveLength(2)
  })

  it('做成菜耗材料、货架对应种类 +1', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [coarse('a', '炒饭')]
    const before = state.restaurant.shelf.炒饭
    expect(cookIngredient(state, 'a')).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(0)
    expect(state.restaurant.shelf.炒饭).toBe(before + 1)
    expect(state.restaurant.shelfStar.炒饭).toBe(0)
  })

  it('高品质做成菜给货架打星标', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [{ id: 'p', kind: '烤肉', quality: '精品' }]
    expect(cookIngredient(state, 'p')).toBe(true)
    expect(state.restaurant.shelf.烤肉).toBe(INITIAL_SHELF_PER_DISH + 1)
    expect(state.restaurant.shelfStar.烤肉).toBe(1)
  })

  it('栏满拒绝发粗料', () => {
    const state = createInitialState()
    state.restaurant.kitchen = Array.from({ length: KITCHEN_SLOT_MAX }, (_, i) =>
      coarse(`x${i}`, DISH_KINDS[i % DISH_KINDS.length]),
    )
    expect(grantCoarse(state, () => 0)).toBe(false)
    expect(state.restaurant.kitchen).toHaveLength(KITCHEN_SLOT_MAX)
    state.restaurant.kitchen.pop()
    expect(grantCoarse(state, () => 0)).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(KITCHEN_SLOT_MAX)
    expect(state.restaurant.kitchen.at(-1)?.quality).toBe('粗料')
    expect(state.restaurant.kitchen.at(-1)?.kind).toBe('粥')
  })

  it('偏好加权可注入 RNG：merge 出种跟着权重', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [coarse('a', '烤肉'), coarse('b', '烤肉')]
    state.restaurant.chefWeight = { 粥: 0, 炒饭: 1, 烤肉: 0 }
    expect(mergeIngredients(state, 'a', 'b', () => 0)).toBe(true)
    expect(state.restaurant.kitchen[0]?.kind).toBe('炒饭')
    expect(pickWeightedDish({ 粥: 0, 炒饭: 0, 烤肉: 8 }, () => 0.5)).toBe('烤肉')
  })

  it('按偏好做成菜按权重抽样材料', () => {
    const state = createInitialState()
    state.restaurant.kitchen = [coarse('congee', '粥'), coarse('meat', '烤肉')]
    state.restaurant.chefWeight = { 粥: 0, 炒饭: 0, 烤肉: 3 }
    expect(cookByChefPreference(state, () => 0.1)).toBe(true)
    expect(state.restaurant.kitchen.map((item) => item.id)).toEqual(['congee'])
    expect(state.restaurant.shelf.烤肉).toBe(INITIAL_SHELF_PER_DISH + 1)
  })

  it('点某菜加重厨师偏好', () => {
    const state = createInitialState()
    expect(state.restaurant.chefWeight).toEqual({ 粥: 1, 炒饭: 1, 烤肉: 1 })
    boostChefWeight(state, '炒饭')
    expect(state.restaurant.chefWeight.炒饭).toBe(2)
  })

  it('占座未上菜时该种类记为订单预留，merge 仍不碰货架', () => {
    const state = createInitialState()
    expect(starveAndSendToRestaurant(state)).toBe(true)
    const reserved = reservedOrderCounts(state)
    expect(reserved.粥).toBe(1)
    expect(reserved.炒饭).toBe(0)
    const shelf = snapshotShelf(state)
    state.restaurant.kitchen = [coarse('a'), coarse('b')]
    expect(mergeIngredients(state, 'a', 'b', () => 0)).toBe(true)
    expect(state.restaurant.shelf).toEqual(shelf)
  })

  it('初始后厨约 6 个粗料', () => {
    const state = createInitialState()
    expect(state.restaurant.kitchen).toHaveLength(INITIAL_KITCHEN_COUNT)
    expect(state.restaurant.kitchen.every((item) => item.quality === '粗料')).toBe(true)
    expect(new Set(state.restaurant.kitchen.map((item) => item.id)).size).toBe(INITIAL_KITCHEN_COUNT)
  })

  it('Vue reactive 代理上 merge / 出菜可用', () => {
    const state = reactive(createInitialState())
    state.restaurant.kitchen = [coarse('a', '粥'), coarse('b', '粥')]
    expect(mergeIngredients(state, 'a', 'b', () => 0)).toBe(true)
    const id = state.restaurant.kitchen[0]?.id
    expect(id).toBeTruthy()
    expect(cookIngredient(state, id!)).toBe(true)
    expect(state.restaurant.kitchen).toHaveLength(0)
  })
})

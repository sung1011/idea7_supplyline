import { describe, expect, it } from 'vitest'
import { INITIAL_SHELF_PER_DISH, MENU_CATS } from './config'
import { createInitialState, serveDish, starveAndSendToRestaurant } from './game'
import {
  canSwapMenuDish,
  DEFAULT_DISH_BY_CAT,
  DISHES,
  dishName,
  dishesOf,
  migrateLegacyKind,
  migrateLegacyOrder,
  swapMenuDish,
} from './menu'

describe('三类菜单', () => {
  it('每类至少两道，默认上架白饭 / 回锅肉 / 浊酒', () => {
    expect(MENU_CATS).toEqual(['饭', '菜', '酒'])
    for (const cat of MENU_CATS) {
      expect(dishesOf(cat).length).toBeGreaterThanOrEqual(2)
    }
    expect(DISHES.some((dish) => dish.id === 'baiFan' && dish.name === '白饭' && dish.cat === '饭')).toBe(true)
    expect(DISHES.some((dish) => dish.id === 'huiGuoRou' && dish.name === '回锅肉' && dish.cat === '菜')).toBe(true)
    expect(DISHES.some((dish) => dish.id === 'zhuoJiu' && dish.name === '浊酒' && dish.cat === '酒')).toBe(true)
    expect(DEFAULT_DISH_BY_CAT).toEqual({ 饭: 'baiFan', 菜: 'huiGuoRou', 酒: 'zhuoJiu' })
    const state = createInitialState()
    expect(state.restaurant.menu.饭).toEqual({ dishId: 'baiFan', stock: INITIAL_SHELF_PER_DISH, star: 0 })
    expect(state.restaurant.menu.菜.dishId).toBe('huiGuoRou')
    expect(state.restaurant.menu.酒.dishId).toBe('zhuoJiu')
  })

  it('同 cat 换菜成功则库存和星标清零', () => {
    const state = createInitialState()
    state.restaurant.menu.饭.stock = 5
    state.restaurant.menu.饭.star = 2
    expect(swapMenuDish(state, '饭')).toBe(true)
    expect(state.restaurant.menu.饭).toEqual({ dishId: 'zhou', stock: 0, star: 0 })
    expect(dishName(state.restaurant.menu.饭.dishId)).toBe('粥')
    expect(swapMenuDish(state, '饭')).toBe(true)
    expect(state.restaurant.menu.饭.dishId).toBe('baiFan')
  })

  it('占座未上菜且 order 指向旧菜时拒绝换菜', () => {
    const state = createInitialState()
    expect(starveAndSendToRestaurant(state)).toBe(true)
    const unit = state.units.find((item) => item.location === 'restaurant_seat')
    expect(unit?.order).toBe('baiFan')
    expect(canSwapMenuDish(state, '饭')).toBe(false)
    expect(swapMenuDish(state, '饭')).toBe(false)
    expect(state.restaurant.menu.饭.dishId).toBe('baiFan')
    expect(state.restaurant.menu.饭.stock).toBe(INITIAL_SHELF_PER_DISH)
    expect(canSwapMenuDish(state, '菜')).toBe(true)
    expect(swapMenuDish(state, '菜')).toBe(true)
    expect(state.restaurant.menu.菜.dishId).toBe('chaoQingCai')
    expect(state.restaurant.menu.菜.stock).toBe(0)
  })

  it('上菜后可以换掉刚点的那一类', () => {
    const state = createInitialState()
    starveAndSendToRestaurant(state)
    const unit = state.units.find((item) => item.location === 'restaurant_seat')!
    expect(serveDish(state, unit.id)).toBe(true)
    expect(swapMenuDish(state, '饭')).toBe(true)
    expect(state.restaurant.menu.饭.dishId).toBe('zhou')
    expect(state.restaurant.menu.饭.stock).toBe(0)
  })

  it('旧粥炒饭烤肉映射到饭菜酒与默认三道', () => {
    expect(migrateLegacyKind('粥')).toBe('饭')
    expect(migrateLegacyKind('炒饭')).toBe('菜')
    expect(migrateLegacyKind('烤肉')).toBe('酒')
    expect(migrateLegacyOrder('粥')).toBe('baiFan')
    expect(migrateLegacyOrder('炒饭')).toBe('huiGuoRou')
    expect(migrateLegacyOrder('烤肉')).toBe('zhuoJiu')
  })
})

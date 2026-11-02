import { INITIAL_SHELF_PER_DISH, MENU_CATS } from './config'
import type {
  DishDef,
  DishId,
  GameState,
  MenuCat,
  MenuSlot,
  MenuState,
  RestaurantState,
} from './types'

export const DISHES: readonly DishDef[] = [
  { id: 'baiFan', name: '白饭', cat: '饭' },
  { id: 'zhou', name: '粥', cat: '饭' },
  { id: 'huiGuoRou', name: '回锅肉', cat: '菜' },
  { id: 'chaoQingCai', name: '炒青菜', cat: '菜' },
  { id: 'zhuoJiu', name: '浊酒', cat: '酒' },
  { id: 'qingJiu', name: '清酒', cat: '酒' },
]

export const DEFAULT_DISH_BY_CAT: Record<MenuCat, DishId> = {
  饭: 'baiFan',
  菜: 'huiGuoRou',
  酒: 'zhuoJiu',
}

/** 旧货架三种 → 菜单三类。 */
export const LEGACY_KIND_TO_CAT: Readonly<Record<string, MenuCat>> = {
  粥: '饭',
  炒饭: '菜',
  烤肉: '酒',
}

/** 旧点餐/库存种类 → 该 cat 默认上架菜。 */
export const LEGACY_KIND_TO_DISH: Readonly<Record<string, DishId>> = {
  粥: 'baiFan',
  炒饭: 'huiGuoRou',
  烤肉: 'zhuoJiu',
}

const DISH_BY_ID = new Map<DishId, DishDef>(DISHES.map((dish) => [dish.id, dish]))
const DISH_IDS = new Set<string>(DISHES.map((dish) => dish.id))
const MENU_CAT_SET = new Set<string>(MENU_CATS)
const DISHES_BY_CAT: Record<MenuCat, DishDef[]> = {
  饭: DISHES.filter((dish) => dish.cat === '饭'),
  菜: DISHES.filter((dish) => dish.cat === '菜'),
  酒: DISHES.filter((dish) => dish.cat === '酒'),
}

export function isMenuCat(value: unknown): value is MenuCat {
  return typeof value === 'string' && MENU_CAT_SET.has(value)
}

export function isDishId(value: unknown): value is DishId {
  return typeof value === 'string' && DISH_IDS.has(value)
}

export function getDish(id: DishId): DishDef {
  return DISH_BY_ID.get(id) ?? DISHES[0]!
}

export function dishName(id: DishId): string {
  return getDish(id).name
}

export function dishesOf(cat: MenuCat): readonly DishDef[] {
  return DISHES_BY_CAT[cat]
}

export function catOfDish(id: DishId): MenuCat {
  return getDish(id).cat
}

export function migrateLegacyKind(value: unknown): MenuCat | null {
  if (isMenuCat(value)) return value
  if (typeof value !== 'string') return null
  return LEGACY_KIND_TO_CAT[value] ?? null
}

export function migrateLegacyOrder(value: unknown): DishId | null {
  if (isDishId(value)) return value
  if (typeof value !== 'string') return null
  return LEGACY_KIND_TO_DISH[value] ?? null
}

export function dishIdOfMark(mark: MenuCat | DishId): DishId {
  return isDishId(mark) ? mark : DEFAULT_DISH_BY_CAT[mark]
}

export function createCatCounts(value = 0): Record<MenuCat, number> {
  return {
    饭: value,
    菜: value,
    酒: value,
  }
}

export function createMenuSlot(cat: MenuCat, stock = INITIAL_SHELF_PER_DISH, star = 0): MenuSlot {
  return {
    dishId: DEFAULT_DISH_BY_CAT[cat],
    stock,
    star: Math.min(Math.max(0, star), Math.max(0, stock)),
  }
}

export function createMenu(stock = INITIAL_SHELF_PER_DISH): MenuState {
  return {
    饭: createMenuSlot('饭', stock),
    菜: createMenuSlot('菜', stock),
    酒: createMenuSlot('酒', stock),
  }
}

export function cloneMenu(menu: MenuState): MenuState {
  return {
    饭: { ...menu.饭 },
    菜: { ...menu.菜 },
    酒: { ...menu.酒 },
  }
}

export function nextDishInCat(cat: MenuCat, currentId: DishId): DishId {
  const list = dishesOf(cat)
  const index = list.findIndex((dish) => dish.id === currentId)
  const next = list[(index < 0 ? 0 : index + 1) % list.length]
  return next?.id ?? DEFAULT_DISH_BY_CAT[cat]
}

export function currentMenuDish(state: GameState, cat: MenuCat): DishId {
  return state.restaurant.menu[cat].dishId
}

/** 按饭 → 菜 → 酒轮询当前上架菜。 */
export function takeNextMenuDish(restaurant: RestaurantState): DishId {
  const cat = MENU_CATS[restaurant.nextDishIndex % MENU_CATS.length] ?? MENU_CATS[0]
  restaurant.nextDishIndex += 1
  return restaurant.menu[cat].dishId
}

export function hasUnservedOrderForDish(state: GameState, dishId: DishId): boolean {
  for (const id of state.restaurant.tables) {
    if (!id) continue
    const unit = state.units.find((item) => item.id === id)
    if (unit?.order === dishId && !unit.served) return true
  }
  return false
}

export function canSwapMenuDish(state: GameState, cat: MenuCat): boolean {
  const slot = state.restaurant.menu[cat]
  if (!slot) return false
  if (dishesOf(cat).length < 2) return false
  return !hasUnservedOrderForDish(state, slot.dishId)
}

/** 同 cat 换另一道。有占座未上菜且 order 指向旧菜则拒绝；成功则库存/星标清零。 */
export function swapMenuDish(state: GameState, cat: MenuCat): boolean {
  if (!canSwapMenuDish(state, cat)) return false
  const slot = state.restaurant.menu[cat]
  slot.dishId = nextDishInCat(cat, slot.dishId)
  slot.stock = 0
  slot.star = 0
  return true
}

export function addMenuStock(state: GameState, cat: MenuCat, stars = 0): void {
  const slot = state.restaurant.menu[cat]
  slot.stock += 1
  if (stars > 0) slot.star += 1
}

export function consumeMenuStock(state: GameState, cat: MenuCat): void {
  const slot = state.restaurant.menu[cat]
  slot.stock = Math.max(0, slot.stock - 1)
  if (slot.star > slot.stock) slot.star = slot.stock
}

export function menuStockOfOrder(state: GameState, order: DishId): number {
  const dish = getDish(order)
  const slot = state.restaurant.menu[dish.cat]
  if (slot.dishId !== order) return 0
  return slot.stock
}

export type UnitLocation =
  | 'camp'
  | 'hospital_bed'
  | 'hospital_queue'
  | 'restaurant_seat'
  | 'restaurant_queue'
  | 'marching'
  | 'captive'
  | 'persuading'

/** 菜单三类。材料 kind 只走这三轴。 */
export type MenuCat = '饭' | '菜' | '酒'

export type DishId = 'baiFan' | 'zhou' | 'huiGuoRou' | 'chaoQingCai' | 'zhuoJiu' | 'qingJiu'

export type DishDef = {
  id: DishId
  name: string
  cat: MenuCat
}

export type IngredientQuality = '粗料' | '好料' | '精品'

export type Ingredient = {
  id: string
  kind: MenuCat
  quality: IngredientQuality
}

export type ChefWeight = Record<MenuCat, number>

export type CatCount = Record<MenuCat, number>

export type Rng = () => number

export type Unit = {
  id: string
  name: string
  /** 全局唯一名将 id，编制/俘虏/劝降中占用同一 id 则不可再俘。 */
  generalId: string
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  location: UnitLocation
  /** 占床用药后回血 ×3，满血离院清除。 */
  potionBoost: boolean
  /** 占座后点的菜（当前上架 dishId）；离座或未入座为 null。 */
  order: DishId | null
  /** 占座且已上菜后才开始进食。 */
  served: boolean
  /** 出征 / 劝降剩余秒；非进行中为 0。 */
  jobRemain: number
  /** 出征 / 劝降总秒，用来画进度。 */
  jobTotal: number
}

export type MenuSlot = {
  dishId: DishId
  stock: number
  star: number
}

export type MenuState = Record<MenuCat, MenuSlot>

export type RestaurantState = {
  tables: (string | null)[]
  queue: string[]
  /** 三类菜单：每类当前上架一道。 */
  menu: MenuState
  nextDishIndex: number
  /** 后厨材料栏，上限见 KITCHEN_SLOT_MAX。 */
  kitchen: Ingredient[]
  nextIngredientId: number
  chefWeight: ChefWeight
}

export type GameState = {
  units: Unit[]
  beds: (string | null)[]
  queue: string[]
  potionCount: number
  supply: number
  nextUnitId: number
  restaurant: RestaurantState
}

export type SaveBlob = {
  version: number
  savedAt: number
  units: Unit[]
  beds: (string | null)[]
  queue: string[]
  potionCount: number
  supply: number
  nextUnitId: number
  restaurant: RestaurantState
}

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

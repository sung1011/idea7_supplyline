export type UnitLocation =
  | 'camp'
  | 'hospital_bed'
  | 'hospital_queue'
  | 'restaurant_seat'
  | 'restaurant_queue'

export type DishKind = '粥' | '炒饭' | '烤肉'

export type IngredientQuality = '粗料' | '好料' | '精品'

export type Ingredient = {
  id: string
  kind: DishKind
  quality: IngredientQuality
}

export type ChefWeight = Record<DishKind, number>

export type Rng = () => number

export type Unit = {
  id: string
  name: string
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  location: UnitLocation
  /** 占床用药后回血 ×3，满血离院清除。 */
  potionBoost: boolean
  /** 占座后点的菜；离座或未入座为 null。 */
  order: DishKind | null
  /** 占座且已上菜后才开始进食。 */
  served: boolean
}

export type ShelfStock = Record<DishKind, number>

export type RestaurantState = {
  tables: (string | null)[]
  queue: string[]
  shelf: ShelfStock
  /** 货架上带星标的份数，不超过对应种类库存；不接战斗 buff。 */
  shelfStar: ShelfStock
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

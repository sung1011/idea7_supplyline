import {
  CHEF_WEIGHT_STEP,
  DEFAULT_CHEF_WEIGHT,
  DISH_KINDS,
  INITIAL_KITCHEN_COUNT,
  KITCHEN_SLOT_MAX,
  NEXT_QUALITY,
  QUALITY_STAR_COUNT,
} from './config'
import type {
  ChefWeight,
  DishKind,
  GameState,
  Ingredient,
  IngredientQuality,
  Rng,
  ShelfStock,
} from './types'

export function createChefWeight(value = DEFAULT_CHEF_WEIGHT): ChefWeight {
  return {
    粥: value,
    炒饭: value,
    烤肉: value,
  }
}

export function createEmptyShelf(): ShelfStock {
  return {
    粥: 0,
    炒饭: 0,
    烤肉: 0,
  }
}

export function createInitialKitchen(): Ingredient[] {
  const items: Ingredient[] = []
  for (let i = 0; i < INITIAL_KITCHEN_COUNT; i++) {
    items.push({
      id: `m${i + 1}`,
      kind: DISH_KINDS[i % DISH_KINDS.length] ?? DISH_KINDS[0],
      quality: '粗料',
    })
  }
  return items
}

export function pickWeightedDish(weights: ChefWeight, rng: Rng = Math.random): DishKind {
  const totals = DISH_KINDS.map((kind) => Math.max(0, weights[kind] ?? 0))
  const sum = totals.reduce((acc, value) => acc + value, 0)
  if (sum <= 0) {
    const index = Math.min(DISH_KINDS.length - 1, Math.max(0, Math.floor(rng() * DISH_KINDS.length)))
    return DISH_KINDS[index] ?? DISH_KINDS[0]
  }
  let roll = rng() * sum
  for (let i = 0; i < DISH_KINDS.length; i++) {
    roll -= totals[i] ?? 0
    if (roll < 0) return DISH_KINDS[i] ?? DISH_KINDS[0]
  }
  return DISH_KINDS[DISH_KINDS.length - 1] ?? DISH_KINDS[0]
}

export function findIngredient(state: GameState, id: string): Ingredient | undefined {
  return state.restaurant.kitchen.find((item) => item.id === id)
}

export function canMerge(state: GameState, idA: string, idB: string): boolean {
  if (idA === idB) return false
  const a = findIngredient(state, idA)
  const b = findIngredient(state, idB)
  return !!a && !!b && a.quality === b.quality
}

export function canCookIngredient(state: GameState, id: string): boolean {
  return !!findIngredient(state, id)
}

export function canGrantCoarse(state: GameState): boolean {
  return state.restaurant.kitchen.length < KITCHEN_SLOT_MAX
}

export function reservedOrderCounts(state: GameState): ShelfStock {
  const reserved = createEmptyShelf()
  for (const id of state.restaurant.tables) {
    if (!id) continue
    const unit = state.units.find((item) => item.id === id)
    if (unit?.order && !unit.served) reserved[unit.order] += 1
  }
  return reserved
}

function pushIngredient(state: GameState, kind: DishKind, quality: IngredientQuality): Ingredient {
  const item: Ingredient = {
    id: `m${state.restaurant.nextIngredientId}`,
    kind,
    quality,
  }
  state.restaurant.nextIngredientId += 1
  state.restaurant.kitchen.push(item)
  return item
}

function removeIngredient(state: GameState, id: string): Ingredient | null {
  const index = state.restaurant.kitchen.findIndex((item) => item.id === id)
  if (index < 0) return null
  const [item] = state.restaurant.kitchen.splice(index, 1)
  return item ?? null
}

/** 同档两件合成更高一档（精品再 merge 仍为精品），种类按厨师权重随机。只动材料栏。 */
export function mergeIngredients(
  state: GameState,
  idA: string,
  idB: string,
  rng: Rng = Math.random,
): boolean {
  if (!canMerge(state, idA, idB)) return false
  const a = findIngredient(state, idA)
  if (!a) return false
  const quality = NEXT_QUALITY[a.quality]
  const kind = pickWeightedDish(state.restaurant.chefWeight, rng)
  if (!removeIngredient(state, idA) || !removeIngredient(state, idB)) return false
  pushIngredient(state, kind, quality)
  return true
}

function addToShelf(state: GameState, kind: DishKind, quality: IngredientQuality): void {
  state.restaurant.shelf[kind] += 1
  if (QUALITY_STAR_COUNT[quality] > 0) state.restaurant.shelfStar[kind] += 1
}

export function consumeShelfDish(state: GameState, kind: DishKind): void {
  state.restaurant.shelf[kind] = Math.max(0, state.restaurant.shelf[kind] - 1)
  if (state.restaurant.shelfStar[kind] > state.restaurant.shelf[kind]) {
    state.restaurant.shelfStar[kind] = state.restaurant.shelf[kind]
  }
}

/** 材料栏任一件做成菜：耗掉该材料，货架对应种类 +1。高品质打星标。 */
export function cookIngredient(state: GameState, id: string): boolean {
  const item = removeIngredient(state, id)
  if (!item) return false
  addToShelf(state, item.kind, item.quality)
  return true
}

/** 按厨师偏好从材料栏抽样一件做成菜。 */
export function cookByChefPreference(state: GameState, rng: Rng = Math.random): boolean {
  const kitchen = state.restaurant.kitchen
  if (kitchen.length === 0) return false
  const weights = kitchen.map((item) => Math.max(0, state.restaurant.chefWeight[item.kind] ?? 0))
  const sum = weights.reduce((acc, value) => acc + value, 0)
  let index = 0
  if (sum <= 0) {
    index = Math.min(kitchen.length - 1, Math.max(0, Math.floor(rng() * kitchen.length)))
  } else {
    let roll = rng() * sum
    for (let i = 0; i < kitchen.length; i++) {
      roll -= weights[i] ?? 0
      if (roll < 0) {
        index = i
        break
      }
      index = i
    }
  }
  const item = kitchen[index]
  if (!item) return false
  return cookIngredient(state, item.id)
}

/** 调试：发一份随机种类粗料；栏满拒绝。 */
export function grantCoarse(state: GameState, rng: Rng = Math.random): boolean {
  if (!canGrantCoarse(state)) return false
  const kind = pickWeightedDish(createChefWeight(1), rng)
  pushIngredient(state, kind, '粗料')
  return true
}

export function boostChefWeight(state: GameState, kind: DishKind): void {
  state.restaurant.chefWeight[kind] += CHEF_WEIGHT_STEP
}

/** 补给线玩法占位常量，改数值只动这一处。 */

export const GAME_NAME = '补给线'
export const GAME_TAGLINE = '为前线战士做后勤补给。'

export const SAVE_KEY = 'idea7Supplyline'
export const SAVE_VERSION = 4

export const INITIAL_BED_COUNT = 2
export const INITIAL_UNIT_COUNT = 4
export const UNIT_MAX_HP = 100
export const INJURE_HP = 40
export const BASE_HEAL_PER_SEC = 5
export const POTION_HEAL_MULTIPLIER = 3
export const POTION_COST = 1
export const INITIAL_POTION_COUNT = 3
export const EXPAND_BED_COST = 20
export const INITIAL_SUPPLY = 50

export const INITIAL_TABLE_COUNT = 1
export const EXPAND_TABLE_COST = 25
export const UNIT_MAX_STAMINA = 100
export const HUNGER_STAMINA = 0
export const EAT_PER_SEC = 8

export const DISH_KINDS = ['粥', '炒饭', '烤肉'] as const
export const INITIAL_SHELF_PER_DISH = 2
export const RESTOCK_PER_DISH = 2

export const DISH_EMOJI = {
  粥: '🥣',
  炒饭: '🍚',
  烤肉: '🍖',
} as const

export const INGREDIENT_QUALITIES = ['粗料', '好料', '精品'] as const
export const KITCHEN_SLOT_MAX = 12
export const INITIAL_KITCHEN_COUNT = 6
export const DEFAULT_CHEF_WEIGHT = 1
export const CHEF_WEIGHT_STEP = 1

export const NEXT_QUALITY = {
  粗料: '好料',
  好料: '精品',
  精品: '精品',
} as const

export const QUALITY_STAR_COUNT = {
  粗料: 0,
  好料: 1,
  精品: 2,
} as const

/** 读档 / 后台切回补算上限（秒）。 */
export const OFFLINE_TICK_CAP_SEC = 8 * 60 * 60

export const UNIT_NAMES = ['冲冲侠', '盾盾仔', '炮炮龙', '豆豆兵'] as const

/** 出征挂机秒数；单人满血满体出发。 */
export const MARCH_DURATION_SEC = 10
export const MARCH_STAMINA_COST = 40
export const MARCH_INJURY_CHANCE = 0.5
export const MARCH_INJURY_HP = 35
export const MARCH_SUPPLY_GAIN = 8
export const MARCH_CAPTURE_BASE = 0.42
export const MARCH_CAPTURE_POWER_SCALE = 80
export const MARCH_CAPTURE_MIN = 0.12
export const MARCH_CAPTURE_MAX = 0.72

/** 劝降挂机秒数 / 成功率，按俘虏擅长 tag。智更快更高。 */
export const PERSUADE_SEC = { 战: 14, 守: 12, 智: 8 } as const
export const PERSUADE_RATE = { 战: 0.38, 守: 0.48, 智: 0.62 } as const

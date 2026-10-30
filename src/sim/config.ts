/** 补给线玩法占位常量，改数值只动这一处。 */

export const GAME_NAME = '补给线'
export const GAME_TAGLINE = '为前线战士做后勤补给。'

export const SAVE_KEY = 'idea7Supplyline'
export const SAVE_VERSION = 2

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

/** 读档 / 后台切回补算上限（秒）。 */
export const OFFLINE_TICK_CAP_SEC = 8 * 60 * 60

export const UNIT_NAMES = ['冲冲侠', '盾盾仔', '炮炮龙', '豆豆兵'] as const

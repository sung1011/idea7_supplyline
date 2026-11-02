import { UNIT_NAMES } from './config'
import type { GameState } from './types'

export type GeneralTag = '战' | '守' | '智'
export type FactionId = 'shu' | 'wei' | 'wu' | 'other'

export type General = {
  id: string
  name: string
  faction: FactionId
  /** 阵营色，给大头盔 tint。 */
  color: string
  power: number
  tag: GeneralTag
}

export const FACTION_COLOR: Record<FactionId, string> = {
  shu: '#e4453a',
  wei: '#3d7dff',
  wu: '#2fbf4a',
  other: '#9b4dff',
}

export const STARTER_GENERAL_IDS = ['liubei', 'guanyu', 'zhangfei', 'zhaoyun'] as const

export const LEGACY_UNIT_NAME_TO_GENERAL_ID: Record<(typeof UNIT_NAMES)[number], string> = {
  冲冲侠: 'liubei',
  盾盾仔: 'guanyu',
  炮炮龙: 'zhangfei',
  豆豆兵: 'zhaoyun',
}

export const GENERALS: readonly General[] = [
  { id: 'liubei', name: '刘备', faction: 'shu', color: FACTION_COLOR.shu, power: 75, tag: '智' },
  { id: 'guanyu', name: '关羽', faction: 'shu', color: FACTION_COLOR.shu, power: 92, tag: '战' },
  { id: 'zhangfei', name: '张飞', faction: 'shu', color: FACTION_COLOR.shu, power: 88, tag: '战' },
  { id: 'zhaoyun', name: '赵云', faction: 'shu', color: FACTION_COLOR.shu, power: 86, tag: '战' },
  { id: 'zhuge', name: '诸葛亮', faction: 'shu', color: FACTION_COLOR.shu, power: 52, tag: '智' },
  { id: 'huangzhong', name: '黄忠', faction: 'shu', color: FACTION_COLOR.shu, power: 82, tag: '战' },
  { id: 'caocao', name: '曹操', faction: 'wei', color: FACTION_COLOR.wei, power: 78, tag: '智' },
  { id: 'dianwei', name: '典韦', faction: 'wei', color: FACTION_COLOR.wei, power: 93, tag: '战' },
  { id: 'xuchu', name: '许褚', faction: 'wei', color: FACTION_COLOR.wei, power: 90, tag: '守' },
  { id: 'xiahoudun', name: '夏侯惇', faction: 'wei', color: FACTION_COLOR.wei, power: 80, tag: '守' },
  { id: 'zhangliao', name: '张辽', faction: 'wei', color: FACTION_COLOR.wei, power: 87, tag: '战' },
  { id: 'sunquan', name: '孙权', faction: 'wu', color: FACTION_COLOR.wu, power: 62, tag: '智' },
  { id: 'zhouyu', name: '周瑜', faction: 'wu', color: FACTION_COLOR.wu, power: 68, tag: '智' },
  { id: 'taishi', name: '太史慈', faction: 'wu', color: FACTION_COLOR.wu, power: 84, tag: '战' },
  { id: 'ganning', name: '甘宁', faction: 'wu', color: FACTION_COLOR.wu, power: 83, tag: '战' },
  { id: 'lvbu', name: '吕布', faction: 'other', color: FACTION_COLOR.other, power: 98, tag: '战' },
]

const BY_ID = new Map(GENERALS.map((item) => [item.id, item]))
const BY_NAME = new Map(GENERALS.map((item) => [item.name, item]))

export function getGeneral(id: string): General | undefined {
  return BY_ID.get(id)
}

export function getGeneralByName(name: string): General | undefined {
  return BY_NAME.get(name)
}

/** 旧档昵称或正史名 → 名将 id。 */
export function resolveGeneralId(name: string, generalId?: string): string | undefined {
  if (generalId && BY_ID.has(generalId)) return generalId
  if (Object.hasOwn(LEGACY_UNIT_NAME_TO_GENERAL_ID, name)) {
    return LEGACY_UNIT_NAME_TO_GENERAL_ID[name as (typeof UNIT_NAMES)[number]]
  }
  return BY_NAME.get(name)?.id
}

export function occupiedGeneralIds(state: GameState): Set<string> {
  const ids = new Set<string>()
  for (const unit of state.units) {
    if (unit.generalId) ids.add(unit.generalId)
  }
  return ids
}

/** 尚未拥有（编制 / 俘虏 / 劝降中都不算可再出）的名将。 */
export function capturableGenerals(state: GameState): General[] {
  const occupied = occupiedGeneralIds(state)
  return GENERALS.filter((item) => !occupied.has(item.id))
}

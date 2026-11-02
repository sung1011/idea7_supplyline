import { getGeneral, getGeneralByName, type General, type GeneralTag } from '../sim/generals'

export type HatKind = 'spike' | 'dome' | 'cap' | 'horn'

export type FaceTone = {
  skin: string
  blush: string
  hair: string
  hat: string
  hatDeep: string
  cloth: string
  ring: string
  kind: HatKind
}

export const NAMED_FACES = {
  冲冲侠: {
    skin: '#ffd4a0',
    blush: '#ff8a8a',
    hair: '#3a2415',
    hat: '#ff3b4d',
    hatDeep: '#c4142c',
    cloth: '#ffd24a',
    ring: '#ff7a3a',
    kind: 'spike',
  },
  盾盾仔: {
    skin: '#f0c090',
    blush: '#f08080',
    hair: '#2a180c',
    hat: '#3d8dff',
    hatDeep: '#1e5ec4',
    cloth: '#7ed0ff',
    ring: '#4ec8ff',
    kind: 'dome',
  },
  炮炮龙: {
    skin: '#ffc878',
    blush: '#ff7a5a',
    hair: '#5a2810',
    hat: '#ff8a18',
    hatDeep: '#c45c00',
    cloth: '#ffb020',
    ring: '#ff9a3a',
    kind: 'horn',
  },
  豆豆兵: {
    skin: '#ffe0b0',
    blush: '#ff9aaa',
    hair: '#6a4020',
    hat: '#5fd13a',
    hatDeep: '#2a8a22',
    cloth: '#b8f07a',
    ring: '#7cff4a',
    kind: 'cap',
  },
} satisfies Record<string, FaceTone>

const PALETTE: FaceTone[] = [
  NAMED_FACES.冲冲侠,
  NAMED_FACES.盾盾仔,
  NAMED_FACES.炮炮龙,
  NAMED_FACES.豆豆兵,
]

const SKINS = ['#ffd4a0', '#f0c090', '#ffc878', '#ffe0b0'] as const
const BLUSHES = ['#ff8a8a', '#f08080', '#ff7a5a', '#ff9aaa'] as const
const HAIRS = ['#3a2415', '#2a180c', '#5a2810', '#6a4020'] as const

const HAT_BY_ID: Record<string, HatKind> = {
  liubei: 'cap',
  guanyu: 'spike',
  zhangfei: 'horn',
  zhaoyun: 'dome',
  zhuge: 'cap',
  huangzhong: 'spike',
  caocao: 'cap',
  dianwei: 'spike',
  xuchu: 'dome',
  xiahoudun: 'dome',
  zhangliao: 'spike',
  sunquan: 'cap',
  zhouyu: 'cap',
  taishi: 'spike',
  ganning: 'spike',
  lvbu: 'horn',
}

function hatByTag(tag: GeneralTag): HatKind {
  if (tag === '智') return 'cap'
  if (tag === '守') return 'dome'
  return 'spike'
}

export function hashName(name: string): number {
  let hash = 2166136261
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mixHex(hex: string, ratio: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.round(((n >> 16) & 255) * ratio)
  const g = Math.round(((n >> 8) & 255) * ratio)
  const b = Math.round((n & 255) * ratio)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function lighten(hex: string, toward = 0.42): string {
  const n = parseInt(hex.slice(1), 16)
  const mix = (ch: number) => Math.round(ch + (255 - ch) * toward)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function toneFromGeneral(general: General): FaceTone {
  const hash = hashName(general.id)
  return {
    skin: SKINS[hash % SKINS.length]!,
    blush: BLUSHES[(hash >>> 8) % BLUSHES.length]!,
    hair: HAIRS[(hash >>> 16) % HAIRS.length]!,
    hat: general.color,
    hatDeep: mixHex(general.color, 0.68),
    cloth: lighten(general.color, 0.36),
    ring: lighten(general.color, 0.18),
    kind: HAT_BY_ID[general.id] ?? hatByTag(general.tag),
  }
}

export function faceTone(name: string, generalId?: string): FaceTone {
  const general = (generalId ? getGeneral(generalId) : undefined) ?? getGeneralByName(name)
  if (general) return toneFromGeneral(general)
  const named = Object.hasOwn(NAMED_FACES, name)
    ? NAMED_FACES[name as keyof typeof NAMED_FACES]
    : undefined
  return named ?? PALETTE[hashName(name) % PALETTE.length]!
}

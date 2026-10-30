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

export function hashName(name: string): number {
  let hash = 2166136261
  for (let i = 0; i < name.length; i += 1) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function faceTone(name: string): FaceTone {
  const named = Object.hasOwn(NAMED_FACES, name)
    ? NAMED_FACES[name as keyof typeof NAMED_FACES]
    : undefined
  return named ?? PALETTE[hashName(name) % PALETTE.length]!
}

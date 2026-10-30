export type UnitLocation = 'camp' | 'hospital_bed' | 'hospital_queue'

export type Unit = {
  id: string
  name: string
  hp: number
  maxHp: number
  location: UnitLocation
  /** 占床用药后回血 ×3，满血离院清除。 */
  potionBoost: boolean
}

export type GameState = {
  units: Unit[]
  beds: (string | null)[]
  queue: string[]
  potionCount: number
  supply: number
  nextUnitId: number
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
}

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

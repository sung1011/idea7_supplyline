import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './gameStore'

describe('营地队首出征', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('队首是营地待命列表第一人', () => {
    const store = useGameStore()
    expect(store.campLeader?.id).toBe(store.campUnits[0]?.id)
    expect(store.campLeaderReady).toBe(true)

    store.game.units[0]!.hp = store.game.units[0]!.maxHp - 1
    expect(store.campLeader?.id).toBe(store.campUnits[0]?.id)
    expect(store.campLeaderReady).toBe(false)
    expect(store.marchReady(store.campUnits[1]!.id)).toBe(true)
  })

  it('队首满血满体时点 FAB → location marching', () => {
    const store = useGameStore()
    const leader = store.campLeader
    expect(leader).toBeTruthy()
    expect(leader!.hp).toBe(leader!.maxHp)
    expect(leader!.stamina).toBe(leader!.maxStamina)
    expect(store.marchCampLeader()).toBe(true)
    expect(store.game.units.find((unit) => unit.id === leader!.id)?.location).toBe('marching')
    expect(store.campLeader?.id).not.toBe(leader!.id)
  })

  it('队首不可出征或无人待命时 FAB 不出征', () => {
    const store = useGameStore()
    const leader = store.campLeader!
    leader.stamina = leader.maxStamina - 1
    expect(store.marchCampLeader()).toBe(false)
    expect(leader.location).toBe('camp')

    for (const unit of store.game.units) unit.location = 'hospital_bed'
    expect(store.campLeader).toBeNull()
    expect(store.campLeaderReady).toBe(false)
    expect(store.marchCampLeader()).toBe(false)
  })

  it('营地卡逐人出征仍可用', () => {
    const store = useGameStore()
    store.game.units[0]!.hp = 1
    const second = store.campUnits[1]!
    expect(store.marchUnit(second.id)).toBe(true)
    expect(second.location).toBe('marching')
    expect(store.campLeader?.id).toBe(store.game.units[0]!.id)
  })
})

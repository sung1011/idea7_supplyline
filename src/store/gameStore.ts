import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { OFFLINE_TICK_CAP_SEC } from '../sim/config'
import {
  applyPotion,
  canExpandBed,
  canExpandTable,
  canInjure,
  canStarve,
  expandBed,
  expandTable,
  injureAndSendToHospital,
  restockShelf,
  serveDish,
  starveAndSendToRestaurant,
  tick,
} from '../sim/game'
import {
  boostChefWeight,
  cookByChefPreference,
  cookIngredient,
  grantCoarse,
  mergeIngredients,
  reservedOrderCounts,
} from '../sim/kitchen'
import { loadGame, saveGame } from '../sim/save'
import type { DishKind, Unit } from '../sim/types'

export type MainTab = 'camp' | 'hospital' | 'restaurant'

export const useGameStore = defineStore('game', () => {
  const game = reactive(loadGame())
  const tab = ref<MainTab>('camp')

  const campUnits = computed(() => game.units.filter((unit) => unit.location === 'camp'))
  const queueUnits = computed(() =>
    game.queue
      .map((id) => game.units.find((unit) => unit.id === id))
      .filter((unit): unit is Unit => !!unit),
  )
  const bedUnits = computed(() =>
    game.beds.map((id) => (id ? (game.units.find((unit) => unit.id === id) ?? null) : null)),
  )
  const tableUnits = computed(() =>
    game.restaurant.tables.map((id) => (id ? (game.units.find((unit) => unit.id === id) ?? null) : null)),
  )
  const restaurantQueueUnits = computed(() =>
    game.restaurant.queue
      .map((id) => game.units.find((unit) => unit.id === id))
      .filter((unit): unit is Unit => !!unit),
  )
  const injureReady = computed(() => canInjure(game))
  const starveReady = computed(() => canStarve(game))
  const expandReady = computed(() => canExpandBed(game))
  const expandTableReady = computed(() => canExpandTable(game))
  const reservedOrders = computed(() => reservedOrderCounts(game))

  function persist(): void {
    saveGame(game)
  }

  function sendInjured(): boolean {
    const ok = injureAndSendToHospital(game)
    if (ok) persist()
    return ok
  }

  function sendHungry(): boolean {
    const ok = starveAndSendToRestaurant(game)
    if (ok) persist()
    return ok
  }

  function usePotion(unitId: string): boolean {
    const ok = applyPotion(game, unitId)
    if (ok) persist()
    return ok
  }

  function serveMeal(unitId: string): boolean {
    const ok = serveDish(game, unitId)
    if (ok) persist()
    return ok
  }

  function buyBed(): boolean {
    const ok = expandBed(game)
    if (ok) persist()
    return ok
  }

  function buyTable(): boolean {
    const ok = expandTable(game)
    if (ok) persist()
    return ok
  }

  function restock(): void {
    restockShelf(game)
    persist()
  }

  function mergeKitchen(idA: string, idB: string): boolean {
    const ok = mergeIngredients(game, idA, idB)
    if (ok) persist()
    return ok
  }

  function cookItem(id: string): boolean {
    const ok = cookIngredient(game, id)
    if (ok) persist()
    return ok
  }

  function cookPreferred(): boolean {
    const ok = cookByChefPreference(game)
    if (ok) persist()
    return ok
  }

  function giveCoarse(): boolean {
    const ok = grantCoarse(game)
    if (ok) persist()
    return ok
  }

  function preferDish(kind: DishKind): void {
    boostChefWeight(game, kind)
    persist()
  }

  let lastTs = Date.now()
  let raf = 0
  let persistTimer = 0
  let running = false

  function step(now: number, capSec: number): void {
    const dt = Math.min(Math.max(0, (now - lastTs) / 1000), capSec)
    lastTs = now
    if (dt > 0) tick(game, dt)
  }

  function frame(): void {
    step(Date.now(), 0.25)
    raf = requestAnimationFrame(frame)
  }

  function onVisibility(): void {
    if (document.visibilityState === 'hidden') {
      cancelAnimationFrame(raf)
      raf = 0
      step(Date.now(), 0.25)
      persist()
      return
    }
    step(Date.now(), OFFLINE_TICK_CAP_SEC)
    if (running) raf = requestAnimationFrame(frame)
  }

  function onPageHide(): void {
    persist()
  }

  function startClock(): void {
    if (running) return
    running = true
    lastTs = Date.now()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    persistTimer = window.setInterval(() => persist(), 5000)
    raf = requestAnimationFrame(frame)
  }

  function stopClock(): void {
    if (!running) return
    running = false
    cancelAnimationFrame(raf)
    raf = 0
    window.clearInterval(persistTimer)
    persistTimer = 0
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
    persist()
  }

  return {
    game,
    tab,
    campUnits,
    queueUnits,
    bedUnits,
    tableUnits,
    restaurantQueueUnits,
    injureReady,
    starveReady,
    expandReady,
    expandTableReady,
    reservedOrders,
    sendInjured,
    sendHungry,
    usePotion,
    serveMeal,
    buyBed,
    buyTable,
    restock,
    mergeKitchen,
    cookItem,
    cookPreferred,
    giveCoarse,
    preferDish,
    persist,
    startClock,
    stopClock,
  }
})

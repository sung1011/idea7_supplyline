import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { OFFLINE_TICK_CAP_SEC } from '../sim/config'
import {
  applyPotion,
  canExpandBed,
  canExpandTable,
  canInjure,
  canMarchUnit,
  canPersuadeUnit,
  canStarve,
  expandBed,
  expandTable,
  injureAndSendToHospital,
  restockShelf,
  serveDish,
  startMarch,
  startPersuade,
  starveAndSendToRestaurant,
  tick,
} from '../sim/game'
import {
  gmAddPotion,
  gmAddShelfEach,
  gmAddSupply,
  gmGrantCoarse,
  gmRecallAll,
  gmResetState,
} from '../sim/gm'
import {
  boostChefWeight,
  cookByChefPreference,
  cookIngredient,
  grantCoarse,
  mergeIngredients,
  reservedOrderCounts,
} from '../sim/kitchen'
import { clearGameSave, loadGame, saveGame } from '../sim/save'
import { pushFloatTip } from '../ui/floatTips'
import type { DishKind, Unit } from '../sim/types'

export type MainTab = 'camp' | 'hospital' | 'restaurant'

export const useGameStore = defineStore('game', () => {
  const game = reactive(loadGame())
  const tab = ref<MainTab>('camp')

  const campUnits = computed(() => game.units.filter((unit) => unit.location === 'camp'))
  const marchingUnits = computed(() => game.units.filter((unit) => unit.location === 'marching'))
  const captiveUnits = computed(() =>
    game.units.filter((unit) => unit.location === 'captive' || unit.location === 'persuading'),
  )
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

  function marchUnit(unitId: string): boolean {
    const ok = startMarch(game, unitId)
    if (ok) {
      persist()
      const unit = game.units.find((item) => item.id === unitId)
      if (unit) pushFloatTip(`${unit.name} 出征`, 'ok')
    }
    return ok
  }

  function persuadeUnit(unitId: string): boolean {
    const ok = startPersuade(game, unitId)
    if (ok) {
      persist()
      const unit = game.units.find((item) => item.id === unitId)
      if (unit) pushFloatTip(`劝降 ${unit.name}`, 'ok')
    }
    return ok
  }

  function marchReady(unitId: string): boolean {
    return canMarchUnit(game, unitId)
  }

  function persuadeReady(unitId: string): boolean {
    return canPersuadeUnit(game, unitId)
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

  function gmReset(): void {
    clearGameSave()
    gmResetState(game)
    tab.value = 'camp'
    persist()
    pushFloatTip('已初始化', 'ok')
  }

  function runGm(fn: () => void, okText?: string): void {
    fn()
    persist()
    if (okText) pushFloatTip(okText, 'ok')
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
    marchingUnits,
    captiveUnits,
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
    marchUnit,
    persuadeUnit,
    marchReady,
    persuadeReady,
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
    gmReset,
    gmAddSupply: () => runGm(() => gmAddSupply(game), '补给 +50'),
    gmAddPotion: () => runGm(() => gmAddPotion(game), '药剂 +5'),
    gmAddShelf: () => runGm(() => gmAddShelfEach(game), '货架各 +5'),
    gmRecallAll: () => runGm(() => gmRecallAll(game), '全员回营'),
    gmGrantCoarse: () => {
      const granted = gmGrantCoarse(game)
      persist()
      pushFloatTip(granted > 0 ? `粗料 +${granted}` : '材料栏已满', granted > 0 ? 'ok' : 'err')
    },
    persist,
    startClock,
    stopClock,
  }
})

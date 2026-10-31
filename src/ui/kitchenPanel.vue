<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { DISH_KINDS, KITCHEN_SLOT_MAX, QUALITY_STAR_COUNT } from '../sim/config'
import { canCookIngredient, canGrantCoarse, canMerge } from '../sim/kitchen'
import { useGameStore } from '../store/gameStore'
import type { Ingredient, IngredientQuality } from '../sim/types'
import CrIcon from './crIcon.vue'
import DishMark from './dishMark.vue'

const store = useGameStore()
const { game } = storeToRefs(store)
const selected = ref<string[]>([])

const slots = computed(() => {
  const items: (Ingredient | null)[] = [...game.value.restaurant.kitchen]
  while (items.length < KITCHEN_SLOT_MAX) items.push(null)
  return items
})

const selectedPair = computed(() => {
  const [a, b] = selected.value
  return a && b ? ([a, b] as const) : null
})

const selectedOne = computed(() => (selected.value.length === 1 ? selected.value[0] : null))

const mergeReady = computed(() => {
  const pair = selectedPair.value
  return !!pair && canMerge(store.game, pair[0], pair[1])
})

const cookReady = computed(() => {
  const id = selectedOne.value
  return !!id && canCookIngredient(store.game, id)
})

const grantReady = computed(() => canGrantCoarse(store.game))
const preferCookReady = computed(() => game.value.restaurant.kitchen.length > 0)

function starCount(quality: IngredientQuality): number {
  return QUALITY_STAR_COUNT[quality] + 1
}

function qualityClass(quality: IngredientQuality): string {
  if (quality === '精品') return 'premium'
  if (quality === '好料') return 'fine'
  return 'coarse'
}

function toggleSlot(id: string): void {
  const at = selected.value.indexOf(id)
  if (at >= 0) {
    selected.value = selected.value.filter((item) => item !== id)
    return
  }
  if (selected.value.length >= 2) selected.value = [...selected.value.slice(1), id]
  else selected.value = [...selected.value, id]
}

function clearSelection(): void {
  selected.value = []
}

function doMerge(): void {
  const pair = selectedPair.value
  if (!pair) return
  if (store.mergeKitchen(pair[0], pair[1])) clearSelection()
}

function doCook(): void {
  const id = selectedOne.value
  if (!id) return
  if (store.cookItem(id)) clearSelection()
}

function doPreferCook(): void {
  if (store.cookPreferred()) clearSelection()
}
</script>

<template>
  <section class="kitchen" aria-label="后厨">
    <header class="scene-head">
      <span class="scene-mark rest-mark"><CrIcon name="crate" /></span>
      <div>
        <h3 class="rest-ink">后厨</h3>
        <p class="rest-mute">点选同档两件 merge，或点一件做成菜进货架。不消耗货架成品。</p>
      </div>
    </header>

    <p class="count">材料 {{ game.restaurant.kitchen.length }}/{{ KITCHEN_SLOT_MAX }}</p>
    <ul class="grid">
      <li v-for="(item, index) in slots" :key="item?.id ?? `empty-${index}`">
        <button
          v-if="item"
          type="button"
          class="slot"
          :class="[qualityClass(item.quality), { on: selected.includes(item.id) }]"
          @click="toggleSlot(item.id)"
        >
          <DishMark :kind="item.kind" :stars="starCount(item.quality)" />
          <strong>{{ item.kind }}</strong>
          <small>{{ item.quality }}</small>
        </button>
        <div v-else class="slot empty">空</div>
      </li>
    </ul>

    <div class="actions">
      <button type="button" class="cr-btn gold sm act" :disabled="!mergeReady" @click="doMerge">
        Merge
      </button>
      <button type="button" class="cr-btn gold sm act" :disabled="!cookReady" @click="doCook">做成菜</button>
      <button type="button" class="cr-btn cream sm act" :disabled="!preferCookReady" @click="doPreferCook">
        按偏好做成菜
      </button>
    </div>

    <section class="bias" aria-label="厨师偏好">
      <h4>厨师偏好</h4>
      <div class="bias-row">
        <button
          v-for="kind in DISH_KINDS"
          :key="kind"
          type="button"
          class="bias-btn"
          @click="store.preferDish(kind)"
        >
          <DishMark :kind="kind" />
          {{ kind }}
          <strong>{{ game.restaurant.chefWeight[kind] }}</strong>
        </button>
      </div>
    </section>

    <button type="button" class="cr-btn cream" :disabled="!grantReady" @click="store.giveCoarse()">
      发粗料
    </button>
  </section>
</template>

<style scoped>
.kitchen {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius-card);
  background: var(--gloss), var(--tint-restaurant);
  box-shadow: 0 6px 0 var(--stroke-deep), var(--plastic);
}

.rest-mark {
  background: var(--gloss), #fff3c4;
}

.rest-ink,
.bias h4,
.count {
  margin: 0;
  color: var(--restaurant-ink);
  font-weight: 900;
}

.rest-ink {
  font-size: 18px;
}

.rest-mute {
  margin: 4px 0 0;
  color: #a36a12;
  font-size: 12px;
  line-height: 1.45;
  font-weight: 700;
}

.count {
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 92px;
  width: 100%;
  min-width: 0;
  padding: 6px 4px;
  border: var(--border) solid var(--stroke);
  border-radius: 16px;
  background: var(--gloss), linear-gradient(180deg, #fffdf2 0%, #ffe7a8 100%);
  box-shadow: 0 var(--lift) 0 #c97800, var(--plastic);
  color: var(--ink);
  font-weight: 800;
}

.slot :deep(.dish svg) {
  width: 32px;
  height: 32px;
}

.slot :deep(.stars) {
  font-size: 9px;
}

.slot.coarse {
  background: var(--gloss), linear-gradient(180deg, #fffdf2 0%, #f0d9a0 100%);
}

.slot.fine {
  background: var(--gloss), linear-gradient(180deg, #fff4c4 0%, #ffc85a 100%);
}

.slot.premium {
  background: var(--gloss), linear-gradient(180deg, #ffe9a0 0%, #ff9f3a 100%);
}

.slot.on {
  outline: 3px solid #ff7a00;
  outline-offset: -1px;
  background: var(--gloss), linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
}

.slot.empty {
  background: repeating-linear-gradient(135deg, #fff8e8 0 8px, #ffe9c4 8px 16px);
  box-shadow: none;
  color: #c9a36a;
  font-size: 12px;
}

.slot strong {
  font-size: 12px;
}

.slot small {
  font-size: 10px;
  font-weight: 800;
}

.actions,
.bias-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.act {
  flex: 1 1 96px;
}

.bias h4 {
  margin-bottom: 8px;
  font-size: 14px;
}

.bias-btn {
  flex: 1 1 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  padding: 6px 8px;
  border: var(--border) solid var(--stroke);
  border-radius: 14px;
  background: var(--gloss), #fffdf2;
  box-shadow: 0 var(--lift) 0 #d7b36a, inset 0 1px 0 var(--glint);
  font-size: 13px;
  font-weight: 800;
}

.bias-btn :deep(.dish svg) {
  width: 22px;
  height: 22px;
}

.bias-btn :deep(.stars) {
  display: none;
}
</style>

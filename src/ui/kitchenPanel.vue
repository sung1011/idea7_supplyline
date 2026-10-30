<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  DISH_EMOJI,
  DISH_KINDS,
  KITCHEN_SLOT_MAX,
  QUALITY_STAR_COUNT,
} from '../sim/config'
import { canCookIngredient, canGrantCoarse, canMerge } from '../sim/kitchen'
import { useGameStore } from '../store/gameStore'
import type { Ingredient, IngredientQuality } from '../sim/types'

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

function stars(quality: IngredientQuality): string {
  return '★'.repeat(QUALITY_STAR_COUNT[quality])
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
    <header class="head">
      <h3>🍳 后厨</h3>
      <p>点选同档两件 merge，或点一件做成菜进货架。不消耗货架成品。</p>
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
          <span class="emoji">{{ DISH_EMOJI[item.kind] }}</span>
          <strong>{{ item.kind }}</strong>
          <small>{{ item.quality }}{{ stars(item.quality) }}</small>
        </button>
        <div v-else class="slot empty">空</div>
      </li>
    </ul>

    <div class="actions">
      <button type="button" class="act merge" :disabled="!mergeReady" @click="doMerge">
        Merge
      </button>
      <button type="button" class="act cook" :disabled="!cookReady" @click="doCook">做成菜</button>
      <button type="button" class="act prefer" :disabled="!preferCookReady" @click="doPreferCook">
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
          {{ DISH_EMOJI[kind] }} {{ kind }}
          <strong>{{ game.restaurant.chefWeight[kind] }}</strong>
        </button>
      </div>
    </section>

    <button type="button" class="grant" :disabled="!grantReady" @click="store.giveCoarse()">
      发粗料
    </button>
  </section>
</template>

<style scoped>
.kitchen {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 3px solid var(--stroke);
  border-radius: var(--radius-card);
  background: #fff6dc;
  box-shadow: 0 4px 0 #d7b36a;
}

.head h3,
.head p,
.bias h4,
.count {
  margin: 0;
}

.head h3,
.bias h4,
.count {
  color: #9a5a00;
  font-weight: 900;
}

.head h3 {
  font-size: 16px;
}

.head p {
  margin-top: 4px;
  color: #a36a12;
  font-size: 12px;
  line-height: 1.45;
}

.count {
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  min-height: 78px;
  width: 100%;
  padding: 6px 4px;
  border: 3px solid var(--stroke);
  border-radius: 14px;
  background: linear-gradient(180deg, #fffdf2 0%, #ffe7a8 100%);
  box-shadow: 0 3px 0 #c97800;
  color: var(--ink);
  font-weight: 800;
}

.slot.coarse {
  background: linear-gradient(180deg, #fffdf2 0%, #f0d9a0 100%);
}

.slot.fine {
  background: linear-gradient(180deg, #fff4c4 0%, #ffc85a 100%);
}

.slot.premium {
  background: linear-gradient(180deg, #ffe9a0 0%, #ff9f3a 100%);
}

.slot.on {
  outline: 3px solid #ff7a00;
  outline-offset: -1px;
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
}

.slot.empty {
  background: repeating-linear-gradient(135deg, #fff8e8 0 8px, #ffe9c4 8px 16px);
  box-shadow: none;
  color: #c9a36a;
  font-size: 12px;
}

.emoji {
  font-size: 18px;
  line-height: 1;
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

.act,
.grant,
.bias-btn {
  border: 3px solid var(--stroke);
  font-weight: 900;
}

.act {
  flex: 1 1 96px;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
  box-shadow: 0 3px 0 #c97800;
  color: var(--ink);
  font-size: 13px;
}

.act.prefer {
  background: linear-gradient(180deg, #fff8dc 0%, #ffd36a 100%);
  box-shadow: 0 3px 0 #c9a227;
}

.act:disabled,
.grant:disabled {
  background: #d5d0c4;
  box-shadow: 0 3px 0 #8c8678;
  color: #6b665c;
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
  gap: 6px;
  min-height: 40px;
  padding: 6px 8px;
  border-radius: 12px;
  background: #fffdf2;
  box-shadow: 0 3px 0 #d7b36a;
  font-size: 13px;
}

.grant {
  padding: 12px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fff8dc 0%, #ffd36a 100%);
  box-shadow: 0 4px 0 #c9a227;
  color: var(--ink);
  font-size: 15px;
}
</style>

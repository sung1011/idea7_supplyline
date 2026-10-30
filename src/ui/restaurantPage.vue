<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { DISH_EMOJI, DISH_KINDS, EXPAND_TABLE_COST } from '../sim/config'
import { canServeDish } from '../sim/game'
import { useGameStore } from '../store/gameStore'
import StaminaBar from './staminaBar.vue'

const store = useGameStore()
const { tableUnits, restaurantQueueUnits, expandTableReady, game } = storeToRefs(store)

function serveReady(unitId: string): boolean {
  return canServeDish(store.game, unitId)
}
</script>

<template>
  <section class="restaurant" aria-label="餐厅">
    <header class="head">
      <h2>🍽️ 餐厅</h2>
      <p>占座点餐，货架有菜才能上桌。吃完回营地，没座就排队。</p>
    </header>

    <ul class="tables">
      <li v-for="(unit, index) in tableUnits" :key="index" class="table" :class="{ empty: !unit }">
        <p class="table-title">🪑 桌 {{ index + 1 }}</p>
        <template v-if="unit">
          <div class="who">
            <strong>{{ unit.name }}</strong>
            <span v-if="unit.order" class="order">
              {{ DISH_EMOJI[unit.order] }} {{ unit.order }}
            </span>
            <span v-if="unit.served" class="eating">用餐中</span>
          </div>
          <StaminaBar :stamina="unit.stamina" :max-stamina="unit.maxStamina" />
          <button
            class="serve"
            type="button"
            :disabled="!serveReady(unit.id)"
            @click="store.serveMeal(unit.id)"
          >
            上菜
          </button>
        </template>
        <p v-else class="idle">空座等客人</p>
      </li>
    </ul>

    <section class="queue" aria-label="排队">
      <h3>排队</h3>
      <ol v-if="restaurantQueueUnits.length">
        <li v-for="unit in restaurantQueueUnits" :key="unit.id">
          <span>{{ unit.name }}</span>
          <span class="wait">等座 · {{ Math.round(unit.stamina) }}/{{ unit.maxStamina }}</span>
        </li>
      </ol>
      <p v-else class="idle">没有人排队</p>
    </section>

    <section class="shelf" aria-label="货架">
      <h3>货架</h3>
      <ul>
        <li v-for="kind in DISH_KINDS" :key="kind">
          <span>{{ DISH_EMOJI[kind] }} {{ kind }}</span>
          <strong>×{{ game.restaurant.shelf[kind] }}</strong>
        </li>
      </ul>
    </section>

    <button class="expand" type="button" :disabled="!expandTableReady" @click="store.buyTable()">
      ➕ 扩桌（{{ EXPAND_TABLE_COST }} 补给）
    </button>
    <button class="restock" type="button" @click="store.restock()">货架补货</button>
  </section>
</template>

<style scoped>
.restaurant {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.head h2,
.head p,
.queue h3,
.shelf h3 {
  margin: 0;
}

.head h2,
.queue h3,
.shelf h3 {
  color: #9a5a00;
  font-weight: 900;
}

.head h2 {
  font-size: 22px;
}

.head p {
  margin-top: 6px;
  color: #a36a12;
  font-size: 13px;
  line-height: 1.5;
}

.tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 148px;
  padding: 12px;
  border: 3px solid var(--stroke);
  border-radius: var(--radius-card);
  background: linear-gradient(180deg, #fffdf2 0%, #ffe7a8 100%);
  box-shadow: 0 4px 0 var(--restaurant-deep);
}

.table.empty {
  background: linear-gradient(180deg, #fffaf0 0%, #ffd98a 100%);
}

.table-title,
.idle,
.queue h3,
.shelf h3 {
  font-size: 14px;
}

.table-title,
.idle {
  margin: 0;
  color: #9a5a00;
  font-weight: 800;
}

.idle {
  margin-top: auto;
}

.who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.order,
.eating {
  padding: 2px 8px;
  border: 2px solid var(--stroke);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.order {
  background: #fff8dc;
}

.eating {
  background: #ffe56a;
}

.serve,
.expand,
.restock {
  border: 3px solid var(--stroke);
  font-weight: 900;
}

.serve {
  margin-top: auto;
  padding: 8px 10px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
  box-shadow: 0 3px 0 #c97800;
  color: var(--ink);
  font-size: 14px;
}

.serve:disabled,
.expand:disabled {
  background: #d5d0c4;
  box-shadow: 0 3px 0 #8c8678;
  color: #6b665c;
}

.queue,
.shelf {
  padding: 12px;
  border: 3px solid var(--stroke);
  border-radius: var(--radius-card);
  background: #fff8e8;
  box-shadow: 0 4px 0 #d7b36a;
}

.queue ol,
.shelf ul {
  margin: 8px 0 0;
  padding: 0;
}

.queue ol {
  padding-left: 1.2em;
}

.shelf ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
}

.queue li,
.shelf li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-weight: 700;
}

.queue li {
  margin: 6px 0;
}

.shelf li {
  min-width: 92px;
  padding: 6px 10px;
  border: 2px solid var(--stroke);
  border-radius: 12px;
  background: #fffdf2;
}

.wait {
  color: #a36a12;
  font-size: 12px;
}

.expand,
.restock {
  padding: 14px 16px;
  border-radius: 18px;
  font-size: 17px;
}

.expand {
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
  box-shadow: 0 5px 0 #c97800;
  color: var(--ink);
}

.restock {
  background: linear-gradient(180deg, #fff8dc 0%, #ffd36a 100%);
  box-shadow: 0 5px 0 #c9a227;
  color: var(--ink);
}
</style>

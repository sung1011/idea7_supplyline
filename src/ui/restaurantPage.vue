<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { DISH_KINDS, EXPAND_TABLE_COST } from '../sim/config'
import { canServeDish } from '../sim/game'
import { useGameStore } from '../store/gameStore'
import CrIcon from './crIcon.vue'
import DishMark from './dishMark.vue'
import KitchenPanel from './kitchenPanel.vue'
import StaminaBar from './staminaBar.vue'
import UnitFace from './unitFace.vue'

const store = useGameStore()
const { tableUnits, restaurantQueueUnits, expandTableReady, game, reservedOrders } = storeToRefs(store)

function serveReady(unitId: string): boolean {
  return canServeDish(store.game, unitId)
}
</script>

<template>
  <section class="restaurant" aria-label="餐厅">
    <div class="cr-board">
      <header class="scene-head">
        <span class="scene-mark rest-mark"><CrIcon name="plate" /></span>
        <div>
          <h2 class="rest-ink">餐厅</h2>
          <p class="rest-mute">占座点餐，货架有菜才能上桌。吃完回营地，没座就排队。</p>
        </div>
      </header>

      <ul class="tables">
        <li v-for="(unit, index) in tableUnits" :key="index" class="table" :class="{ empty: !unit }">
          <p class="table-title">
            <CrIcon name="chair" />
            桌 {{ index + 1 }}
          </p>
          <template v-if="unit">
            <div class="who">
              <UnitFace :name="unit.name" size="sm" />
              <div>
                <strong>{{ unit.name }}</strong>
                <span v-if="unit.served" class="eating">用餐中</span>
              </div>
            </div>
            <span v-if="unit.order" class="order">
              <DishMark :kind="unit.order" />
              {{ unit.order }}
            </span>
            <StaminaBar :stamina="unit.stamina" :max-stamina="unit.maxStamina" />
            <button
              class="cr-btn gold sm"
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
            <UnitFace :name="unit.name" size="sm" />
            <span>{{ unit.name }}</span>
            <span class="wait">等座 · {{ Math.round(unit.stamina) }}/{{ unit.maxStamina }}</span>
          </li>
        </ol>
        <p v-else class="idle">没有人排队</p>
      </section>

      <section class="shelf" aria-label="货架">
        <h3>货架</h3>
        <ul class="slots">
          <li v-for="kind in DISH_KINDS" :key="kind" class="slot">
            <DishMark :kind="kind" :stars="Math.max(1, game.restaurant.shelfStar[kind] || 1)" />
            <strong>{{ kind }}</strong>
            <b class="count">×{{ game.restaurant.shelf[kind] }}</b>
            <small v-if="reservedOrders[kind] > 0" class="hold">订单预留 {{ reservedOrders[kind] }}</small>
          </li>
        </ul>
      </section>

      <button class="cr-btn gold" type="button" :disabled="!expandTableReady" @click="store.buyTable()">
        扩桌（{{ EXPAND_TABLE_COST }} 补给）
      </button>
      <button class="cr-btn cream" type="button" @click="store.restock()">货架补货</button>
    </div>

    <KitchenPanel />
  </section>
</template>

<style scoped>
.restaurant {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: auto;
}

.rest-mark {
  background: #fff3c4;
}

.rest-ink,
.queue h3,
.shelf h3 {
  color: var(--restaurant-ink);
  font-weight: 900;
}

.rest-mute,
.wait,
.table-title,
.idle {
  color: #a36a12;
}

.tables {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.table {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 176px;
  padding: 12px;
  border: var(--border) solid var(--stroke);
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

.table-title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-weight: 800;
}

.table-title :deep(.cr-icon) {
  width: 18px;
  height: 18px;
}

.idle {
  margin: 0;
  margin-top: auto;
  font-weight: 800;
}

.who {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order,
.eating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 3px solid var(--stroke);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.order {
  background: #fff8dc;
}

.order :deep(.dish svg) {
  width: 22px;
  height: 22px;
}

.order :deep(.stars) {
  display: none;
}

.eating {
  background: #ffe56a;
}

.queue,
.shelf {
  padding: 12px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius-card);
  background: var(--restaurant-soft);
  box-shadow: 0 4px 0 #d7b36a;
}

.queue h3,
.shelf h3 {
  margin: 0;
}

.queue ol {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.queue li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  font-weight: 700;
}

.wait {
  margin-left: auto;
  font-size: 12px;
}

.slots {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 8px 4px 10px;
  border: var(--border) solid var(--stroke);
  border-radius: 18px;
  background: var(--slot);
  box-shadow: 0 4px 0 #c9a227;
}

.slot strong {
  font-size: 13px;
}

.count,
.hold {
  min-width: 36px;
  padding: 2px 8px;
  border: 3px solid var(--stroke);
  border-radius: 999px;
  background: #ffe56a;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
}

.hold {
  background: #ffd0a0;
  font-size: 10px;
}
</style>

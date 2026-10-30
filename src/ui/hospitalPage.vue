<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { EXPAND_BED_COST } from '../sim/config'
import { canApplyPotion } from '../sim/game'
import { useGameStore } from '../store/gameStore'
import HpBar from './hpBar.vue'

const store = useGameStore()
const { bedUnits, queueUnits, expandReady } = storeToRefs(store)

function potionReady(unitId: string): boolean {
  return canApplyPotion(store.game, unitId)
}
</script>

<template>
  <section class="hospital" aria-label="医院">
    <header class="head">
      <h2>🏥 医院</h2>
      <p>占床才回血，没床排队。药剂 ×3，扩床花补给。</p>
    </header>

    <ul class="beds">
      <li v-for="(unit, index) in bedUnits" :key="index" class="bed" :class="{ empty: !unit }">
        <p class="bed-title">🛏️ 床 {{ index + 1 }}</p>
        <template v-if="unit">
          <div class="who">
            <strong>{{ unit.name }}</strong>
            <span v-if="unit.potionBoost" class="boost">💊 用药中</span>
          </div>
          <HpBar :hp="unit.hp" :max-hp="unit.maxHp" />
          <button
            class="dose"
            type="button"
            :disabled="!potionReady(unit.id)"
            @click="store.usePotion(unit.id)"
          >
            用药
          </button>
        </template>
        <p v-else class="idle">空床等伤员</p>
      </li>
    </ul>

    <section class="queue" aria-label="排队">
      <h3>排队</h3>
      <ol v-if="queueUnits.length">
        <li v-for="unit in queueUnits" :key="unit.id">
          <span>{{ unit.name }}</span>
          <span class="wait">等床 · {{ Math.round(unit.hp) }}/{{ unit.maxHp }}</span>
        </li>
      </ol>
      <p v-else class="idle">没有人排队</p>
    </section>

    <button class="expand" type="button" :disabled="!expandReady" @click="store.buyBed()">
      ➕ 扩床（{{ EXPAND_BED_COST }} 补给）
    </button>
  </section>
</template>

<style scoped>
.hospital {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.head h2,
.head p,
.queue h3 {
  margin: 0;
}

.head h2,
.queue h3 {
  color: #9b1d2e;
  font-weight: 900;
}

.head h2 {
  font-size: 22px;
}

.head p {
  margin-top: 6px;
  color: #a13a3a;
  font-size: 13px;
  line-height: 1.5;
}

.beds {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bed {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 148px;
  padding: 12px;
  border: 3px solid var(--stroke);
  border-radius: var(--radius-card);
  background: linear-gradient(180deg, #fffdfa 0%, #ffe1dc 100%);
  box-shadow: 0 4px 0 var(--hospital-deep);
}

.bed.empty {
  background: linear-gradient(180deg, #fff8f6 0%, #ffd0c8 100%);
}

.bed-title,
.idle,
.queue h3 {
  font-size: 14px;
}

.bed-title,
.idle {
  margin: 0;
  color: #9b1d2e;
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

.boost {
  padding: 2px 8px;
  border: 2px solid var(--stroke);
  border-radius: 999px;
  background: #ffe56a;
  font-size: 11px;
  font-weight: 800;
}

.dose,
.expand {
  border: 3px solid var(--stroke);
  color: #fff;
  font-weight: 900;
}

.dose {
  margin-top: auto;
  padding: 8px 10px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ff8a8a 0%, #e04848 100%);
  box-shadow: 0 3px 0 #9b1d2e;
  font-size: 14px;
}

.dose:disabled,
.expand:disabled {
  background: #d5d0c4;
  box-shadow: 0 3px 0 #8c8678;
  color: #6b665c;
}

.queue {
  padding: 12px;
  border: 3px solid var(--stroke);
  border-radius: var(--radius-card);
  background: #fff6f4;
  box-shadow: 0 4px 0 #d7a39c;
}

.queue ol {
  margin: 8px 0 0;
  padding: 0 0 0 1.2em;
}

.queue li {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 6px 0;
  font-weight: 700;
}

.wait {
  color: #a13a3a;
  font-size: 12px;
}

.expand {
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #ff8a8a 0%, #e04848 100%);
  box-shadow: 0 5px 0 #9b1d2e;
  font-size: 17px;
}
</style>

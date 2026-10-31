<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { EXPAND_BED_COST } from '../sim/config'
import { canApplyPotion } from '../sim/game'
import { useGameStore } from '../store/gameStore'
import CrIcon from './crIcon.vue'
import HpBar from './hpBar.vue'
import UnitFace from './unitFace.vue'

const store = useGameStore()
const { bedUnits, queueUnits, expandReady } = storeToRefs(store)

function potionReady(unitId: string): boolean {
  return canApplyPotion(store.game, unitId)
}
</script>

<template>
  <section class="hospital" aria-label="医院">
    <div class="cr-board tint-hospital">
      <header class="scene-head">
        <span class="scene-mark hosp-mark"><CrIcon name="cross" /></span>
        <div>
          <h2 class="hosp-ink">医院</h2>
          <p class="hosp-mute">占床才回血，没床排队。药剂 ×3，扩床花补给。</p>
        </div>
      </header>

      <ul class="beds">
        <li v-for="(unit, index) in bedUnits" :key="index" class="bed" :class="{ empty: !unit }">
          <p class="bed-title">
            <CrIcon name="bed" />
            床 {{ index + 1 }}
          </p>
          <template v-if="unit">
            <div class="who">
              <UnitFace :name="unit.name" size="sm" />
              <div>
                <strong>{{ unit.name }}</strong>
                <span v-if="unit.potionBoost" class="boost">用药中</span>
              </div>
            </div>
            <HpBar :hp="unit.hp" :max-hp="unit.maxHp" />
            <button
              class="cr-btn red sm"
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
            <UnitFace :name="unit.name" size="sm" />
            <span>{{ unit.name }}</span>
            <span class="wait">等床 · {{ Math.round(unit.hp) }}/{{ unit.maxHp }}</span>
          </li>
        </ol>
        <p v-else class="idle">没有人排队</p>
      </section>

      <button class="cr-btn red" type="button" :disabled="!expandReady" @click="store.buyBed()">
        扩床（{{ EXPAND_BED_COST }} 补给）
      </button>
    </div>
  </section>
</template>

<style scoped>
.hospital {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.hosp-mark {
  background: var(--gloss), #fff0ee;
}

.hosp-ink,
.queue h3 {
  color: var(--hospital-ink);
  font-weight: 900;
}

.hosp-mute,
.wait,
.bed-title,
.idle {
  color: #a13a3a;
}

.hospital :deep(.cr-board) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.hospital :deep(.cr-btn.red:not(.sm)) {
  flex: 0 0 auto;
  margin-top: auto;
}

.beds {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.bed {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 168px;
  padding: 12px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius-card);
  background: var(--gloss), linear-gradient(180deg, #fffdfa 0%, #ffe1dc 100%);
  box-shadow: 0 4px 0 var(--hospital-deep), var(--plastic);
}

.bed.empty {
  background: var(--gloss), linear-gradient(180deg, #fff8f6 0%, #ffd0c8 100%);
}

.bed-title,
.idle,
.queue h3 {
  font-size: 14px;
}

.bed-title {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-weight: 800;
}

.bed-title :deep(.cr-icon) {
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

.boost {
  display: inline-block;
  margin-left: 4px;
  padding: 2px 8px;
  border: 3px solid var(--stroke);
  border-radius: 999px;
  background: #ffe56a;
  font-size: 11px;
  font-weight: 800;
}

.queue {
  padding: 12px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius-card);
  background: var(--gloss), var(--hospital-soft);
  box-shadow: 0 4px 0 #d7a39c, var(--plastic);
}

.queue h3 {
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
</style>

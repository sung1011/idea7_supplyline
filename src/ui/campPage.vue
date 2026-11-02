<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { getGeneral } from '../sim/generals'
import { useGameStore } from '../store/gameStore'
import CrIcon from './crIcon.vue'
import HpBar from './hpBar.vue'
import StaminaBar from './staminaBar.vue'
import UnitFace from './unitFace.vue'
import type { Unit } from '../sim/types'

const store = useGameStore()
const { campUnits, marchingUnits, captiveUnits, injureReady, starveReady } = storeToRefs(store)

function tagOf(unit: Unit): string {
  return getGeneral(unit.generalId)?.tag ?? ''
}

function jobLabel(unit: Unit): string {
  if (unit.location === 'marching') return '出征中'
  if (unit.location === 'persuading') return '劝降中'
  return '押回'
}

function jobPct(unit: Unit): number {
  if (unit.jobTotal <= 0) return 0
  return Math.min(100, Math.max(0, (1 - unit.jobRemain / unit.jobTotal) * 100))
}

const hasAnyone = () => campUnits.value.length + marchingUnits.value.length + captiveUnits.value.length > 0
</script>

<template>
  <section class="camp" aria-label="营地">
    <div class="cr-board tint-camp">
      <header class="scene-head">
        <span class="scene-mark camp-mark"><CrIcon name="tent" /></span>
        <div>
          <h2 class="camp-ink">营地待命</h2>
          <p class="camp-mute">满血满体可出征。胜可押回敌将，劝降成功入编制，失败则释放。</p>
        </div>
      </header>

      <section class="group" aria-label="待命">
        <h3>待命</h3>
        <ul v-if="campUnits.length" class="list">
          <li v-for="unit in campUnits" :key="unit.id" class="card">
            <UnitFace :name="unit.name" :general-id="unit.generalId" />
            <div class="meta">
              <strong>{{ unit.name }}<span v-if="tagOf(unit)" class="tag">{{ tagOf(unit) }}</span></strong>
              <HpBar :hp="unit.hp" :max-hp="unit.maxHp" />
              <StaminaBar :stamina="unit.stamina" :max-stamina="unit.maxStamina" />
            </div>
            <button
              class="cr-btn gold sm"
              type="button"
              :disabled="!store.marchReady(unit.id)"
              @click="store.marchUnit(unit.id)"
            >
              出征
            </button>
          </li>
        </ul>
        <p v-else class="empty sm">没有人待命。</p>
      </section>

      <section v-if="marchingUnits.length" class="group" aria-label="出征中">
        <h3>出征中</h3>
        <ul class="list">
          <li v-for="unit in marchingUnits" :key="unit.id" class="card">
            <UnitFace :name="unit.name" :general-id="unit.generalId" />
            <div class="meta">
              <strong>{{ unit.name }}<span class="tag">{{ jobLabel(unit) }}</span></strong>
              <div class="job" role="progressbar" :aria-valuenow="Math.round(jobPct(unit))">
                <div class="job-fill march" :style="{ width: `${jobPct(unit)}%` }" />
                <span>{{ Math.max(0, Math.ceil(unit.jobRemain)) }}s</span>
              </div>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="captiveUnits.length" class="group" aria-label="押回">
        <h3>押回</h3>
        <ul class="list">
          <li v-for="unit in captiveUnits" :key="unit.id" class="card captive">
            <UnitFace :name="unit.name" :general-id="unit.generalId" />
            <div class="meta">
              <strong>{{ unit.name }}<span class="tag">{{ tagOf(unit) }} · {{ jobLabel(unit) }}</span></strong>
              <div v-if="unit.location === 'persuading'" class="job" role="progressbar" :aria-valuenow="Math.round(jobPct(unit))">
                <div class="job-fill persuade" :style="{ width: `${jobPct(unit)}%` }" />
                <span>{{ Math.max(0, Math.ceil(unit.jobRemain)) }}s</span>
              </div>
              <p v-else class="hint">劝降成功入编制，失败则释放。</p>
            </div>
            <button
              v-if="unit.location === 'captive'"
              class="cr-btn orange sm"
              type="button"
              :disabled="!store.persuadeReady(unit.id)"
              @click="store.persuadeUnit(unit.id)"
            >
              劝降
            </button>
          </li>
        </ul>
      </section>

      <p v-if="!hasAnyone()" class="empty">营地点名空空，人都在医院或餐厅。</p>
    </div>
    <div class="actions">
      <button class="cr-btn gold" type="button" :disabled="!injureReady" @click="store.sendInjured()">
        造伤送医
      </button>
      <button class="cr-btn orange" type="button" :disabled="!starveReady" @click="store.sendHungry()">
        饿了送餐
      </button>
    </div>
  </section>
</template>

<style scoped>
.camp {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.camp :deep(.cr-board) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.camp-mark {
  background: var(--gloss), #e8ffc8;
}

.camp-ink {
  color: var(--camp-ink);
}

.camp-mute {
  color: #3d6b32;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group + .group {
  margin-top: 8px;
}

.group h3 {
  margin: 0;
  color: var(--camp-ink);
  font-size: 15px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius-card);
  background: var(--gloss), linear-gradient(180deg, #fffdf2 0%, #e8ffc8 100%);
  box-shadow: 0 4px 0 var(--camp-deep), var(--plastic);
}

.card.captive {
  background: var(--gloss), linear-gradient(180deg, #fff8ee 0%, #ffe0b0 100%);
}

.meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.meta strong {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 17px;
}

.tag {
  color: #3d6b32;
  font-size: 12px;
  font-weight: 800;
}

.hint {
  margin: 0;
  color: #3d6b32;
  font-size: 12px;
  font-weight: 700;
}

.job {
  position: relative;
  overflow: hidden;
  height: 22px;
  border: 3px solid var(--stroke);
  border-radius: 999px;
  background: var(--gloss), #fff7e6;
}

.job-fill {
  height: 100%;
  box-shadow: inset 0 4px 0 rgba(255, 255, 255, 0.42), inset 0 -2px 0 rgba(0, 0, 0, 0.18);
}

.job-fill.march {
  background: linear-gradient(180deg, #ffe99a 0%, #ffb020 52%, #e07a00 100%);
}

.job-fill.persuade {
  background: linear-gradient(180deg, #e4c8ff 0%, #b44dff 52%, #6e1cb8 100%);
}

.job span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
}

.empty {
  margin: 0;
  padding: 18px;
  border: 4px dashed var(--camp-deep);
  border-radius: var(--radius-card);
  background: rgba(255, 255, 255, 0.45);
  color: #3d6b32;
  text-align: center;
  font-weight: 700;
}

.empty.sm {
  padding: 10px;
  font-size: 13px;
}

.actions {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  gap: 10px;
}
</style>

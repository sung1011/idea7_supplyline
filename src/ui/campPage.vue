<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGameStore } from '../store/gameStore'
import CrIcon from './crIcon.vue'
import HpBar from './hpBar.vue'
import StaminaBar from './staminaBar.vue'
import UnitFace from './unitFace.vue'

const store = useGameStore()
const { campUnits, injureReady, starveReady } = storeToRefs(store)
</script>

<template>
  <section class="camp" aria-label="营地">
    <div class="cr-board tint-camp">
      <header class="scene-head">
        <span class="scene-mark camp-mark"><CrIcon name="tent" /></span>
        <div>
          <h2 class="camp-ink">营地待命</h2>
          <p class="camp-mute">满血可送医院，满体力可送餐厅。补给完成的人会回到这里。</p>
        </div>
      </header>
      <ul v-if="campUnits.length" class="list">
        <li v-for="unit in campUnits" :key="unit.id" class="card">
          <UnitFace :name="unit.name" />
          <div class="meta">
            <strong>{{ unit.name }}</strong>
            <HpBar :hp="unit.hp" :max-hp="unit.maxHp" />
            <StaminaBar :stamina="unit.stamina" :max-stamina="unit.maxStamina" />
          </div>
        </li>
      </ul>
      <p v-else class="empty">营地点名空空，人都在医院或餐厅。</p>
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

.meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.meta strong {
  font-size: 17px;
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

.actions {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  gap: 10px;
}
</style>

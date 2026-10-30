<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useGameStore } from '../store/gameStore'
import HpBar from './hpBar.vue'

const store = useGameStore()
const { campUnits, injureReady } = storeToRefs(store)
</script>

<template>
  <section class="camp" aria-label="营地">
    <header class="head">
      <h2>🏕️ 营地待命</h2>
      <p>满血的人才能送去医院练手。补给完成的人会回到这里。</p>
    </header>
    <ul v-if="campUnits.length" class="list">
      <li v-for="unit in campUnits" :key="unit.id" class="card">
        <div class="who">
          <span class="emoji" aria-hidden="true">🛡️</span>
          <strong>{{ unit.name }}</strong>
        </div>
        <HpBar :hp="unit.hp" :max-hp="unit.maxHp" />
      </li>
    </ul>
    <p v-else class="empty">营地点名空空，人都在医院。</p>
    <button class="action" type="button" :disabled="!injureReady" @click="store.sendInjured()">
      造伤送医
    </button>
  </section>
</template>

<style scoped>
.camp {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.head h2,
.head p {
  margin: 0;
}

.head h2 {
  color: #1f5d22;
  font-size: 22px;
  font-weight: 900;
}

.head p {
  margin-top: 6px;
  color: #3d6b32;
  font-size: 13px;
  line-height: 1.5;
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
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 3px solid var(--stroke);
  border-radius: var(--radius-card);
  background: linear-gradient(180deg, #fffdf2 0%, #e8ffc8 100%);
  box-shadow: 0 4px 0 var(--camp-deep);
}

.who {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji {
  font-size: 22px;
}

.who strong {
  font-size: 17px;
}

.empty {
  margin: 0;
  padding: 18px;
  border: 3px dashed var(--camp-deep);
  border-radius: var(--radius-card);
  background: rgba(255, 255, 255, 0.45);
  color: #3d6b32;
  text-align: center;
  font-weight: 700;
}

.action {
  margin-top: 4px;
  padding: 14px 16px;
  border: 3px solid var(--stroke);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
  color: var(--ink);
  font-size: 18px;
  font-weight: 900;
  box-shadow: 0 5px 0 #c97800;
}

.action:disabled {
  background: #d5d0c4;
  box-shadow: 0 5px 0 #8c8678;
  color: #6b665c;
}
</style>

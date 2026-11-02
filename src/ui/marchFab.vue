<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../store/gameStore'
import UnitFace from './unitFace.vue'

const store = useGameStore()
const { campLeader, campLeaderReady } = storeToRefs(store)

const label = computed(() => {
  const leader = campLeader.value
  if (!leader) return '没有人待命'
  if (!campLeaderReady.value) return `${leader.name} 未满血满体，不能出征`
  return `出征 ${leader.name}`
})
</script>

<template>
  <button
    type="button"
    class="march-fab"
    :disabled="!campLeaderReady"
    :aria-label="label"
    @click="store.marchCampLeader()"
  >
    <UnitFace
      v-if="campLeader"
      :name="campLeader.name"
      :general-id="campLeader.generalId"
    />
    <span v-else class="empty-face" aria-hidden="true" />
  </button>
</template>

<style scoped>
.march-fab {
  position: absolute;
  left: 50%;
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: var(--z-fab);
  display: grid;
  place-items: center;
  width: var(--march-fab-size);
  height: var(--march-fab-size);
  padding: 0;
  overflow: hidden;
  transform: translateX(-50%);
  border: 5px solid var(--stroke);
  border-radius: 50%;
  background: var(--gloss), linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
  box-shadow: 0 6px 0 var(--stroke-deep), var(--plastic);
  color: var(--ink);
}

.march-fab::after {
  content: '';
  position: absolute;
  left: 16%;
  right: 16%;
  top: 7px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.march-fab :deep(.face) {
  width: 100%;
  height: 100%;
  border: 0;
  box-shadow: none;
  background: transparent;
}

.march-fab:disabled {
  background: var(--gloss), linear-gradient(180deg, #efece3 0%, #d8d2c4 100%);
  box-shadow: 0 6px 0 #8c8678, inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.march-fab:disabled :deep(.face) {
  filter: grayscale(0.7);
  opacity: 0.72;
}

.march-fab:disabled::after {
  opacity: 0.35;
}

.march-fab:not(:disabled):active {
  transform: translate(-50%, var(--lift));
  box-shadow: 0 0 0 var(--stroke-deep), inset 0 1px 0 var(--glint);
}

.empty-face {
  display: block;
  width: 68%;
  height: 68%;
  border: 4px dashed var(--stroke);
  border-radius: 50%;
  background: rgba(255, 253, 246, 0.45);
  opacity: 0.55;
}

@media (prefers-reduced-motion: reduce) {
  .march-fab:not(:disabled):active {
    transform: translateX(-50%);
  }
}
</style>

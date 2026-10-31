<script setup lang="ts">
defineProps<{
  hp: number
  maxHp: number
}>()
</script>

<template>
  <div
    class="hp"
    role="progressbar"
    :aria-valuenow="Math.round(hp)"
    :aria-valuemin="0"
    :aria-valuemax="maxHp"
  >
    <div class="fill" :style="{ width: `${Math.min(100, Math.max(0, (hp / maxHp) * 100))}%` }" />
    <span class="label">{{ Math.round(hp) }}/{{ maxHp }}</span>
  </div>
</template>

<style scoped>
.hp {
  position: relative;
  overflow: hidden;
  height: 26px;
  border: 4px solid var(--stroke);
  border-radius: 999px;
  background: var(--gloss), #fff7e6;
  box-shadow: 0 4px 0 var(--stroke-deep), inset 0 1px 0 var(--glint);
}

.fill {
  height: 100%;
  background: linear-gradient(180deg, #d8ff9a 0%, #3ecf3a 52%, #1f9a28 100%);
  box-shadow: inset 0 5px 0 rgba(255, 255, 255, 0.42), inset 0 -3px 0 rgba(0, 0, 0, 0.18);
}

.label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  font-size: 12px;
  font-weight: 800;
}
</style>

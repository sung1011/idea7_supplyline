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
  height: 22px;
  border: 3px solid var(--stroke);
  border-radius: 999px;
  background: #fff7e6;
  box-shadow: 0 3px 0 var(--stroke-deep);
}

.fill {
  height: 100%;
  background: linear-gradient(180deg, #8dff6a 0%, #3ecf3a 70%, #2aaa28 100%);
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

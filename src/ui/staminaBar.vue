<script setup lang="ts">
defineProps<{
  stamina: number
  maxStamina: number
}>()
</script>

<template>
  <div
    class="stamina"
    role="progressbar"
    :aria-valuenow="Math.round(stamina)"
    :aria-valuemin="0"
    :aria-valuemax="maxStamina"
    aria-label="体力"
  >
    <div
      class="fill"
      :style="{ width: `${Math.min(100, Math.max(0, (stamina / maxStamina) * 100))}%` }"
    />
    <span class="label">{{ Math.round(stamina) }}/{{ maxStamina }}</span>
  </div>
</template>

<style scoped>
.stamina {
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
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 70%, #e88900 100%);
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

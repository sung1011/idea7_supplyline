<script setup lang="ts">
import type { DishKind } from '../sim/types'
import CrIcon from './crIcon.vue'

defineProps<{
  kind: DishKind
  stars?: number
}>()
</script>

<template>
  <span class="dish">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g v-if="kind === '粥'" stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="32" cy="42" rx="22" ry="10" fill="#fff8dc" />
        <path fill="#f0c878" d="M12 36c2 14 40 14 42 0 0-8-10-12-21-12S12 28 12 36Z" />
        <path fill="#ffe9a8" stroke="none" d="M20 34c4 8 20 8 24 0-4 4-20 4-24 0Z" />
        <path fill="none" stroke-linecap="round" d="M24 16c0 6 4 6 4 0M32 14c0 7 5 7 5 0" />
      </g>
      <g v-else-if="kind === '炒饭'" stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="32" cy="44" rx="22" ry="9" fill="#fff8dc" />
        <path fill="#ffd24a" d="M14 38c1 14 35 14 38 0V30c-6-8-32-8-38 0v8Z" />
        <circle cx="26" cy="34" r="3" fill="#fff8dc" stroke="none" />
        <circle cx="36" cy="31" r="2.4" fill="#5fd13a" stroke="none" />
        <circle cx="40" cy="37" r="2.2" fill="#ff3b4d" stroke="none" />
      </g>
      <g v-else stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="30" cy="36" rx="18" ry="14" fill="#ff7a3a" />
        <path fill="#fff8dc" d="M44 30c8 2 14 10 8 16-8 2-12-4-14-10 2-4 4-6 6-6Z" />
        <path fill="#c45c00" stroke="none" d="M22 34c6 6 16 4 20-2-8 2-16 0-20 2Z" />
      </g>
    </svg>
    <span v-if="stars" class="stars" :aria-label="`品质 ${stars}`">
      <CrIcon v-for="n in 3" :key="n" name="star" :on="n <= stars" />
    </span>
  </span>
</template>

<style scoped>
.dish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.dish svg {
  display: block;
  width: 40px;
  height: 40px;
}

.stars {
  display: flex;
  gap: 0;
  font-size: 11px;
}
</style>

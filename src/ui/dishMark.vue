<script setup lang="ts">
import { computed } from 'vue'
import { dishIdOfMark } from '../sim/menu'
import type { DishId, MenuCat } from '../sim/types'
import CrIcon from './crIcon.vue'

const props = defineProps<{
  mark: MenuCat | DishId
  stars?: number
}>()

const dishId = computed(() => dishIdOfMark(props.mark))
</script>

<template>
  <span class="dish">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g v-if="dishId === 'zhou'" stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="32" cy="42" rx="22" ry="10" fill="#fff8dc" />
        <path fill="#f0c878" d="M12 36c2 14 40 14 42 0 0-8-10-12-21-12S12 28 12 36Z" />
        <path fill="#ffe9a8" stroke="none" d="M20 34c4 8 20 8 24 0-4 4-20 4-24 0Z" />
        <path fill="none" stroke-linecap="round" d="M24 16c0 6 4 6 4 0M32 14c0 7 5 7 5 0" />
      </g>
      <g v-else-if="dishId === 'baiFan'" stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="32" cy="44" rx="22" ry="9" fill="#fff8dc" />
        <path fill="#fff4e0" d="M14 38c1 14 35 14 38 0V30c-6-8-32-8-38 0v8Z" />
        <path fill="#fff" opacity="0.55" stroke="none" d="M22 30c4-6 16-6 20 0-6 4-16 4-20 0Z" />
        <path fill="none" stroke-linecap="round" d="M26 28c2-3 10-3 12 0" />
      </g>
      <g v-else-if="dishId === 'chaoQingCai'" stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="32" cy="44" rx="22" ry="9" fill="#fff8dc" />
        <path fill="#7ed957" d="M14 38c1 12 35 12 38 0-2-10-10-16-19-16s-17 6-19 16Z" />
        <path fill="#3aa82a" stroke="none" d="M24 30c6 8 16 8 20 2-8 2-16 0-20-2Z" />
        <path fill="#fff" opacity="0.35" stroke="none" d="M22 28c4-4 14-4 18 0-6 2-12 2-18 0Z" />
      </g>
      <g v-else-if="dishId === 'huiGuoRou'" stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="32" cy="44" rx="22" ry="9" fill="#fff8dc" />
        <ellipse cx="32" cy="34" rx="16" ry="12" fill="#ff7a3a" />
        <path fill="#fff8dc" d="M44 30c8 2 14 10 8 16-8 2-12-4-14-10 2-4 4-6 6-6Z" />
        <path fill="#c45c00" stroke="none" d="M22 34c6 6 16 4 20-2-8 2-16 0-20 2Z" />
      </g>
      <g v-else-if="dishId === 'qingJiu'" stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="32" cy="50" rx="14" ry="5" fill="#fff8dc" />
        <path fill="#e7f4ff" d="M22 22h20l-3 24H25Z" />
        <path fill="#cfe8ff" stroke="none" d="M24 28h16l-2 16H26Z" />
        <path fill="#fff" opacity="0.45" stroke="none" d="M26 24h6v18h-3Z" />
        <path fill="none" stroke-linecap="round" d="M20 22h24" />
      </g>
      <g v-else stroke="#2a1408" stroke-width="3" stroke-linejoin="round">
        <ellipse cx="32" cy="50" rx="16" ry="6" fill="#fff8dc" />
        <path fill="#d7b36a" d="M20 22c0-4 5-8 12-8s12 4 12 8v20c0 6-5 10-12 10s-12-4-12-10V22Z" />
        <path fill="#f0c878" d="M22 24c0-3 4-6 10-6s10 3 10 6v16c0 5-4 8-10 8s-10-3-10-8V24Z" />
        <ellipse cx="32" cy="24" rx="10" ry="4" fill="#ffe9a8" />
        <path fill="#fff" opacity="0.35" stroke="none" d="M26 22c2-2 10-2 12 0-4 2-8 2-12 0Z" />
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

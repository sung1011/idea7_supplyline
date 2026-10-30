<script setup lang="ts">
import { computed } from 'vue'
import { faceTone } from './faceTone'

const props = defineProps<{
  name: string
  size?: 'sm' | 'md'
}>()

const tone = computed(() => faceTone(props.name))
</script>

<template>
  <span class="face" :class="size ?? 'md'" :title="name" :aria-label="name">
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="32" :fill="tone.ring" stroke="#2a1408" stroke-width="4" />
      <ellipse cx="36" cy="58" rx="22" ry="11" :fill="tone.cloth" stroke="#2a1408" stroke-width="3" />
      <circle cx="36" cy="38" r="18" :fill="tone.skin" stroke="#2a1408" stroke-width="3" />
      <path :fill="tone.hair" d="M20 34c2-11 9-16 16-16s14 5 16 16c-4-5-10-7-16-7s-12 2-16 7Z" />
      <g v-if="tone.kind === 'spike'" stroke="#2a1408" stroke-width="2.5" stroke-linejoin="round">
        <path :fill="tone.hat" d="M22 26c2-8 26-8 28 0-6 3.2-22 3.2-28 0Z" />
        <path :fill="tone.hatDeep" d="M33 8h6l3.5 16h-13L33 8Z" />
      </g>
      <g v-else-if="tone.kind === 'dome'" stroke="#2a1408" stroke-width="2.5" stroke-linejoin="round">
        <path :fill="tone.hat" d="M20 26c2-12 30-12 32 0-7 4-25 4-32 0Z" />
        <rect x="33" y="10" width="6" height="7" rx="2" :fill="tone.hatDeep" />
      </g>
      <g v-else-if="tone.kind === 'horn'" stroke="#2a1408" stroke-width="2.5" stroke-linejoin="round">
        <path :fill="tone.hat" d="M21 26c2-9 28-9 30 0-6 3.2-24 3.2-30 0Z" />
        <path :fill="tone.hatDeep" d="M20 18 15 10l8 7h6L20 18Z" />
        <path :fill="tone.hatDeep" d="M52 18 57 10l-8 7h-6L52 18Z" />
      </g>
      <g v-else stroke="#2a1408" stroke-width="2.5" stroke-linejoin="round">
        <path :fill="tone.hat" d="M18 26c4-10 18-14 28-8v9c-7 2.5-21 2.5-28-1Z" />
        <path :fill="tone.hatDeep" d="M46 14v11c3.4 0 7-1.6 8.5-5-1.6-3.4-5-6-8.5-6Z" />
      </g>
      <ellipse cx="27" cy="42" rx="3.6" ry="2.2" :fill="tone.blush" opacity="0.75" />
      <ellipse cx="45" cy="42" rx="3.6" ry="2.2" :fill="tone.blush" opacity="0.75" />
      <circle cx="29" cy="38" r="2.4" fill="#2a1408" />
      <circle cx="43" cy="38" r="2.4" fill="#2a1408" />
      <path
        fill="none"
        stroke="#2a1408"
        stroke-width="2.3"
        stroke-linecap="round"
        d="M30 46c2.2 3.4 9.8 3.4 12 0"
      />
    </svg>
  </span>
</template>

<style scoped>
.face {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  overflow: hidden;
  border: 4px solid var(--stroke);
  border-radius: 50%;
  background: #fffdf6;
  box-shadow: 0 4px 0 var(--stroke-deep);
}

.face.md {
  width: 56px;
  height: 56px;
}

.face.sm {
  width: 40px;
  height: 40px;
}

.face svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>

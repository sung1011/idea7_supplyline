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
      <circle cx="36" cy="36" r="36" :fill="tone.ring" />
      <ellipse cx="36" cy="60" rx="26" ry="14" fill="#2a1408" opacity="0.12" />
      <path
        :fill="tone.cloth"
        stroke="#2a1408"
        stroke-width="2.4"
        stroke-linejoin="round"
        d="M7 72c5-18 17-24 29-24s24 6 29 24v4H7z"
      />
      <path fill="#fff" opacity="0.3" d="M16 64c6-8 13-10 20-10s14 2 20 10c-6-3-13-5-20-5s-14 2-20 5z" />
      <path
        :fill="tone.skin"
        stroke="#2a1408"
        stroke-width="2"
        d="M30 49h12v7c0 2.2-2.6 3.6-6 3.6s-6-1.4-6-3.6z"
      />
      <circle cx="36" cy="39" r="18.5" :fill="tone.skin" stroke="#2a1408" stroke-width="2.6" />
      <ellipse cx="30" cy="33" rx="8.5" ry="6.5" fill="#fff" opacity="0.32" />
      <path
        fill="none"
        stroke="#2a1408"
        stroke-width="1.5"
        stroke-linecap="round"
        opacity="0.38"
        d="M27 49.5c5 4.6 13 4.6 18 0"
      />
      <path :fill="tone.hair" d="M20 36c2-12 10-17 16-17s14 5 16 17c-4-6-10-8-16-8s-12 2-16 8Z" />
      <g v-if="tone.kind === 'spike'" stroke="#2a1408" stroke-width="2.4" stroke-linejoin="round">
        <path :fill="tone.hat" d="M17 29c1.2-15 11.6-21 19-21s17.8 6 19 21c-5 4.6-33 4.6-38 0Z" />
        <path :fill="tone.hatDeep" d="M17 28.6c5.6 3.4 32.4 3.4 38 0-1 2.4-7 4.4-19 4.4s-18-2-19-4.4Z" />
        <ellipse cx="27" cy="18" rx="9" ry="5.2" fill="#fff" opacity="0.4" stroke="none" />
        <path :fill="tone.hatDeep" d="M33 4h6.2l3.8 18H29.4L33 4Z" />
        <path fill="#fff" opacity="0.38" stroke="none" d="M35 6.4h2.8l1.8 12h-4.2z" />
      </g>
      <g v-else-if="tone.kind === 'dome'" stroke="#2a1408" stroke-width="2.4" stroke-linejoin="round">
        <path :fill="tone.hat" d="M16.5 28.5c1-17 12.5-24 19.5-24s18.5 7 19.5 24c-5.6 5-33.4 5-39 0Z" />
        <path :fill="tone.hatDeep" d="M16.5 28c6 3.6 33 3.6 39 0-1 2.6-7.4 4.6-19.5 4.6S17.5 30.6 16.5 28Z" />
        <ellipse cx="27" cy="16" rx="10" ry="6.5" fill="#fff" opacity="0.38" stroke="none" />
        <rect x="32.4" y="6.2" width="7.2" height="7" rx="2.2" :fill="tone.hatDeep" />
        <path fill="#fff" opacity="0.35" stroke="none" d="M34 7.4h4v2.2h-4z" />
      </g>
      <g v-else-if="tone.kind === 'horn'" stroke="#2a1408" stroke-width="2.4" stroke-linejoin="round">
        <path :fill="tone.hat" d="M17.5 29c1.4-14 11.6-20 18.5-20s17.1 6 18.5 20c-5 4.5-32 4.5-37 0Z" />
        <path :fill="tone.hatDeep" d="M17.5 28.5c5.5 3.2 31.5 3.2 37 0-1 2.4-7 4.3-18.5 4.3S18.5 30.9 17.5 28.5Z" />
        <ellipse cx="28" cy="18.5" rx="8.2" ry="4.8" fill="#fff" opacity="0.38" stroke="none" />
        <path :fill="tone.hatDeep" d="M20.5 18 14 6.5 24.5 16.5h6.5L20.5 18Z" />
        <path :fill="tone.hatDeep" d="M51.5 18 58 6.5 47.5 16.5H41L51.5 18Z" />
        <path fill="#fff" opacity="0.4" stroke="none" d="M21.8 14.5 17.4 9l5.4 6.2z" />
        <path fill="#fff" opacity="0.28" stroke="none" d="M50.2 14.5 54.6 9l-5.4 6.2z" />
      </g>
      <g v-else stroke="#2a1408" stroke-width="2.4" stroke-linejoin="round">
        <path :fill="tone.hat" d="M16 28.5c3.4-13 16-19 27.5-13.2V28c-8 2.8-21 2.8-27.5-1.2Z" />
        <path :fill="tone.hatDeep" d="M43.5 12.2v16.4c4-.2 8.2-2 10-5.8-1.8-4.2-5.6-8-10-10.6Z" />
        <ellipse cx="28" cy="18.5" rx="8" ry="4.4" fill="#fff" opacity="0.38" stroke="none" />
        <path :fill="tone.hatDeep" d="M15 29c4 2.8 22 4.2 38 1.2v3.6c-16 3-36 1.6-40-2.2L15 29Z" />
      </g>
      <path fill="none" stroke="#2a1408" stroke-width="2.2" stroke-linecap="round" d="M24 35.4c2.6-2.5 7.2-2.7 9.4-.3" />
      <path fill="none" stroke="#2a1408" stroke-width="2.2" stroke-linecap="round" d="M38.6 35.1c2.4-2.4 7-2.6 9.4-.2" />
      <ellipse cx="29" cy="39.4" rx="3.3" ry="3.7" fill="#2a1408" />
      <ellipse cx="43" cy="39.4" rx="3.3" ry="3.7" fill="#2a1408" />
      <circle cx="30.2" cy="38" r="1.15" fill="#fff" />
      <circle cx="44.2" cy="38" r="1.15" fill="#fff" />
      <ellipse cx="23.2" cy="44.6" rx="4.3" ry="2.5" :fill="tone.blush" opacity="0.82" />
      <ellipse cx="48.8" cy="44.6" rx="4.3" ry="2.5" :fill="tone.blush" opacity="0.82" />
      <path
        fill="none"
        stroke="#2a1408"
        stroke-width="2.3"
        stroke-linecap="round"
        d="M31 47.4c2.3 3.5 7.7 3.5 10 0"
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
  background: var(--gloss), #fffdf6;
  box-shadow: 0 4px 0 var(--stroke-deep), var(--plastic);
}

.face.md {
  width: 64px;
  height: 64px;
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

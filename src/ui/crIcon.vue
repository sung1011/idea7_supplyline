<script setup lang="ts">
export type CrIconName =
  | 'tent'
  | 'cross'
  | 'plate'
  | 'crate'
  | 'potion'
  | 'gear'
  | 'bed'
  | 'chair'
  | 'star'
  | 'close'

defineProps<{
  name: CrIconName
  on?: boolean
}>()
</script>

<template>
  <svg class="cr-icon" viewBox="0 0 32 32" aria-hidden="true">
    <g v-if="name === 'tent'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <path fill="#e8f6a8" d="M5 26 16 7l11 19H5Z" />
      <path fill="#5fd13a" d="M16 7v19" />
      <path fill="#ff3b4d" d="M16 7h8l-8 6V7Z" />
    </g>
    <g v-else-if="name === 'cross'" stroke="#2a1408" stroke-width="2.2">
      <circle cx="16" cy="16" r="13" fill="#fff7f4" />
      <path fill="#ff3b4d" stroke-linejoin="round" d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6V7Z" />
    </g>
    <g v-else-if="name === 'plate'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <ellipse cx="16" cy="22" rx="12" ry="5" fill="#fff8dc" />
      <path fill="#ffd24a" d="M8 18c0-7 4-12 8-12s8 5 8 12H8Z" />
      <path fill="none" d="M12 10c1.2-2 6.8-2 8 0" />
    </g>
    <g v-else-if="name === 'crate'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <rect x="6" y="9" width="20" height="16" rx="3" fill="#ffb020" />
      <path fill="#ffe56a" d="M6 14h20" />
      <path fill="none" d="M16 9v16M10 9v16M22 9v16" />
    </g>
    <g v-else-if="name === 'potion'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <path fill="#ff5a62" d="M11 13h10v11a5 5 0 0 1-10 0V13Z" />
      <rect x="13" y="5" width="6" height="8" rx="2" fill="#fff8dc" />
      <circle cx="16" cy="20" r="2" fill="#fff8dc" stroke="none" />
    </g>
    <g v-else-if="name === 'gear'" stroke="#2a1408" stroke-width="2.2">
      <circle cx="16" cy="16" r="8" fill="#ffd24a" />
      <circle cx="16" cy="16" r="3.2" fill="#fff8e4" />
      <g fill="#ffd24a">
        <rect x="13.2" y="2.2" width="5.6" height="5.2" rx="1.2" />
        <rect x="13.2" y="24.6" width="5.6" height="5.2" rx="1.2" />
        <rect x="2.2" y="13.2" width="5.2" height="5.6" rx="1.2" />
        <rect x="24.6" y="13.2" width="5.2" height="5.6" rx="1.2" />
      </g>
    </g>
    <g v-else-if="name === 'bed'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <rect x="4" y="14" width="24" height="10" rx="3" fill="#fff7f4" />
      <path fill="#ff8a8a" d="M4 14h10v10H4z" />
      <path fill="none" d="M6 24v3M26 24v3" />
    </g>
    <g v-else-if="name === 'chair'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <rect x="8" y="13" width="16" height="8" rx="3" fill="#ffd24a" />
      <path fill="#ffe56a" d="M10 6h12v8H10z" />
      <path fill="none" d="M10 21v5M22 21v5" />
    </g>
    <g v-else-if="name === 'star'">
      <path
        :fill="on ? '#ffc01e' : '#fff4cc'"
        stroke="#2a1408"
        stroke-width="2"
        stroke-linejoin="round"
        d="M16 4.2 18.7 12h8l-6.4 4.7 2.4 7.8L16 19.6l-6.7 4.9 2.4-7.8L5.3 12h8L16 4.2Z"
      />
    </g>
    <g v-else-if="name === 'close'" stroke="#2a1408" stroke-width="3.2" stroke-linecap="round">
      <circle cx="16" cy="16" r="13" fill="#fff8dc" />
      <path fill="none" d="m11 11 10 10M21 11 11 21" />
    </g>
  </svg>
</template>

<style scoped>
.cr-icon {
  display: block;
  width: 1em;
  height: 1em;
  overflow: visible;
}
</style>

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
      <ellipse cx="16" cy="26.6" rx="11" ry="2.1" fill="#2a1408" opacity="0.18" stroke="none" />
      <path fill="#7ed957" d="M5 26 16 6.5l11 19.5H5Z" />
      <path fill="#3aa82a" d="M5 26 16 6.5v19.5H5Z" />
      <path fill="#fff" opacity="0.35" stroke="none" d="M16 9 11 19h3.2L16 12z" />
      <path fill="#ff3b4d" d="M16 6.5h8.2l-8.2 6.2V6.5Z" />
      <path fill="#fff" opacity="0.4" stroke="none" d="M17 8h4.2l-4.2 3.2z" />
    </g>
    <g v-else-if="name === 'cross'" stroke="#2a1408" stroke-width="2.2">
      <circle cx="16" cy="16" r="13" fill="#fff4f0" />
      <circle cx="16" cy="17.2" r="10" fill="#ffd4ce" opacity="0.55" stroke="none" />
      <ellipse cx="12" cy="11" rx="6" ry="4.2" fill="#fff" opacity="0.5" stroke="none" />
      <path fill="#c4142c" stroke="none" d="M13.2 8h5.6v5.2h5.2v5.6h-5.2v5.2h-5.6v-5.2H8v-5.6h5.2V8Z" />
      <path fill="#ff3b4d" stroke-linejoin="round" d="M13 7h6v6h6v6h-6v6h-6v-6H7v-6h6V7Z" />
      <path fill="#fff" opacity="0.38" stroke="none" d="M14 8.2h4v5h5v2.2h-5v.6h-4v-.6H9.2v-2.2H14z" />
    </g>
    <g v-else-if="name === 'plate'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <ellipse cx="16" cy="24" rx="12" ry="5.2" fill="#d7b36a" />
      <ellipse cx="16" cy="21.6" rx="12" ry="5.2" fill="#fff8dc" />
      <ellipse cx="16" cy="21" rx="8" ry="3" fill="#fff" opacity="0.4" stroke="none" />
      <path fill="#e07a00" d="M8 18.4c0-7 4-12 8-12s8 5 8 12H8Z" />
      <path fill="#ffd24a" d="M8 17.2c0-7 4-12 8-12s8 5 8 12H8Z" />
      <ellipse cx="16" cy="11.2" rx="5" ry="2.1" fill="#fff" opacity="0.42" stroke="none" />
      <path fill="none" stroke-linecap="round" d="M12 10c1.2-2 6.8-2 8 0" />
    </g>
    <g v-else-if="name === 'crate'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <path fill="#c45e00" d="M6 13 16 8l10 5v13.5c0 1.4-1 2.5-2.4 2.5H8.4C7 24 6 22.9 6 21.5V13Z" />
      <path fill="#ffb020" d="M6 14.2 16 9.4l10 4.8v10.6c0 1.2-1 2.2-2.3 2.2H8.3C7 22 6 21 6 19.8V14.2Z" />
      <path fill="#ffe56a" d="M6 14.2 16 9.4l10 4.8-10 4.6L6 14.2Z" />
      <path fill="#fff" opacity="0.35" stroke="none" d="M8 14.6 16 11l8 3.6-8 3.6z" />
      <path fill="none" d="M16 9.4v14.8M10.2 12v12.6M21.8 12v12.6" />
    </g>
    <g v-else-if="name === 'potion'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <path fill="#9b1230" d="M11 14h10v10.2a5 5 0 0 1-10 0V14Z" />
      <path fill="#ff5a62" d="M11 13h10v10.5a5 5 0 0 1-10 0V13Z" />
      <rect x="13" y="4.6" width="6" height="8.4" rx="2" fill="#fff8dc" />
      <path fill="#fff" opacity="0.45" stroke="none" d="M14.2 15.2c0 4 1.2 7.4 3.2 7.4V15.2z" />
      <circle cx="16" cy="20.2" r="2" fill="#fff8dc" stroke="none" />
    </g>
    <g v-else-if="name === 'gear'" stroke="#2a1408" stroke-width="2.2">
      <g fill="#c45e00">
        <rect x="13.1" y="2" width="5.8" height="5.4" rx="1.2" />
        <rect x="13.1" y="24.6" width="5.8" height="5.4" rx="1.2" />
        <rect x="2" y="13.1" width="5.4" height="5.8" rx="1.2" />
        <rect x="24.6" y="13.1" width="5.4" height="5.8" rx="1.2" />
      </g>
      <g fill="#ffd24a">
        <rect x="13.2" y="2.2" width="5.6" height="5.2" rx="1.2" />
        <rect x="13.2" y="24.6" width="5.6" height="5.2" rx="1.2" />
        <rect x="2.2" y="13.2" width="5.2" height="5.6" rx="1.2" />
        <rect x="24.6" y="13.2" width="5.2" height="5.6" rx="1.2" />
      </g>
      <circle cx="16" cy="16" r="8.2" fill="#ffd24a" />
      <ellipse cx="13" cy="13" rx="4.2" ry="3" fill="#fff" opacity="0.4" stroke="none" />
      <circle cx="16" cy="16" r="3.2" fill="#fff8e4" />
    </g>
    <g v-else-if="name === 'bed'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <rect x="4" y="15" width="24" height="10" rx="3" fill="#e7c4be" />
      <rect x="4" y="14" width="24" height="10" rx="3" fill="#fff7f4" />
      <path fill="#c4142c" d="M4 14h10v10H4z" />
      <path fill="#ff8a8a" d="M4 14h10v9H4z" />
      <path fill="#fff" opacity="0.35" stroke="none" d="M6 15.2h6v3.2H6z" />
      <path fill="none" d="M6 24v3M26 24v3" />
    </g>
    <g v-else-if="name === 'chair'" stroke="#2a1408" stroke-width="2.2" stroke-linejoin="round">
      <rect x="8" y="14" width="16" height="8" rx="3" fill="#c45e00" />
      <rect x="8" y="13" width="16" height="8" rx="3" fill="#ffd24a" />
      <path fill="#e07a00" d="M10 6h12v8H10z" />
      <path fill="#ffe56a" d="M10 6h12v7.2H10z" />
      <path fill="#fff" opacity="0.35" stroke="none" d="M12 7h8v2.4h-8z" />
      <path fill="none" d="M10 21v5M22 21v5" />
    </g>
    <g v-else-if="name === 'star'">
      <path
        :fill="on ? '#c45e00' : '#e8d090'"
        stroke="none"
        d="M16 5.1 18.6 12.6h8l-6.4 4.6 2.4 7.6L16 20.4l-6.6 4.4 2.4-7.6-6.4-4.6h8L16 5.1Z"
      />
      <path
        :fill="on ? '#ffc01e' : '#fff4cc'"
        stroke="#2a1408"
        stroke-width="2"
        stroke-linejoin="round"
        d="M16 4.2 18.7 12h8l-6.4 4.7 2.4 7.8L16 19.6l-6.7 4.9 2.4-7.8L5.3 12h8L16 4.2Z"
      />
      <path v-if="on" fill="#fff" opacity="0.4" stroke="none" d="M16 6.4 17.4 11h-2.8z" />
    </g>
    <g v-else-if="name === 'close'" stroke="#2a1408" stroke-width="3.2" stroke-linecap="round">
      <circle cx="16" cy="16" r="13" fill="#fff3c4" />
      <ellipse cx="12.5" cy="11.5" rx="6" ry="4" fill="#fff" opacity="0.45" stroke="none" />
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

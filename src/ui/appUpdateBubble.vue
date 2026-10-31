<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { updateBubbleArrowLeft, updateBubbleFrame, updateBubbleTitle } from './appUpdateBubble'
import { formatBeijingDateTime, updateBehindLabel, updateEarlierLabel, type UpdateGap } from './appVersion'

const props = defineProps<{
  version: string
  lines: string[]
  gap: UpdateGap | null
  anchor: HTMLElement | null
}>()

const emit = defineEmits<{ close: []; refresh: [] }>()

const placed = ref(false)
const frame = ref({ left: 8, top: 48, width: 272 })
const arrowLeft = ref(240)
let observer: ResizeObserver | null = null

function place() {
  const anchor = props.anchor
  if (!anchor || typeof window === 'undefined') return
  const rect = anchor.getBoundingClientRect()
  const next = updateBubbleFrame({
    viewportWidth: window.innerWidth,
    anchorRight: rect.right,
    anchorBottom: rect.bottom,
  })
  frame.value = next
  arrowLeft.value = updateBubbleArrowLeft(next.left, rect.left, rect.right, next.width)
  placed.value = true
}

function watchAnchor() {
  observer?.disconnect()
  observer = null
  place()
  const anchor = props.anchor
  if (!anchor || typeof ResizeObserver === 'undefined') return
  observer = new ResizeObserver(() => place())
  observer.observe(anchor)
}

onMounted(() => {
  watchAnchor()
  window.addEventListener('resize', place)
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('resize', place)
})

watch(
  () => props.anchor,
  () => watchAnchor(),
)
</script>

<template>
  <Teleport to="body">
    <aside
      v-show="placed"
      class="bubble"
      role="status"
      :aria-label="updateBubbleTitle(version)"
      :style="{ left: `${frame.left}px`, top: `${frame.top}px`, width: `${frame.width}px` }"
    >
      <i class="arrow" aria-hidden="true" :style="{ left: `${arrowLeft}px` }" />
      <button type="button" class="x" aria-label="关闭" @click="emit('close')">×</button>
      <p class="head">{{ updateBubbleTitle(version) }}</p>
      <div v-if="gap && gap.behind > 0" class="diff">
        <p class="behind">{{ updateBehindLabel(gap.behind) }}</p>
        <ul v-if="gap.notes.length" class="lines">
          <li v-for="note in gap.notes" :key="`${note.at}-${note.title}`">
            <time>{{ formatBeijingDateTime(note.at) }}</time>
            <span>{{ note.title }}</span>
          </li>
        </ul>
        <p v-if="updateEarlierLabel(gap.earlier)" class="earlier">{{ updateEarlierLabel(gap.earlier) }}</p>
      </div>
      <ul v-else-if="lines.length" class="lines">
        <li v-for="(line, index) in lines" :key="`${index}-${line}`">{{ line }}</li>
      </ul>
      <button type="button" class="refresh" @click="emit('refresh')">立即更新</button>
    </aside>
  </Teleport>
</template>

<style scoped>
.bubble {
  position: fixed;
  z-index: var(--z-hud);
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  padding: 10px 12px 12px;
  border: 3px solid var(--stroke);
  border-radius: 16px;
  background: var(--gloss), linear-gradient(180deg, #fffdf2 0%, #ffe9a0 100%);
  box-shadow: 0 4px 0 var(--stroke-deep), var(--plastic);
  color: var(--ink);
}

.arrow {
  position: absolute;
  top: -9px;
  width: 0;
  height: 0;
  margin-left: -9px;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-bottom: 9px solid var(--stroke);
  pointer-events: none;
}

.arrow::after {
  content: '';
  position: absolute;
  top: 3px;
  left: -7px;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 7px solid #fff6d0;
}

.x {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
  width: 28px;
  min-width: 28px;
  height: 28px;
  min-height: 28px;
  padding: 0;
  border: 3px solid #8d241c;
  border-radius: 999px;
  background: linear-gradient(#e85a4c, #c43228);
  box-shadow: 0 3px 0 #7a1c16;
  color: #fff8f4;
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
}

.head {
  margin: 0;
  padding-right: 40px;
  font-size: 16px;
  font-weight: 900;
  line-height: 1.35;
}

.diff {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: min(46vh, 280px);
  overflow: auto;
}

.behind,
.earlier {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.4;
}

.earlier {
  color: var(--muted);
  font-weight: 700;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0 0 0 1.1em;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.lines time {
  display: block;
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
}

.lines li {
  overflow-wrap: anywhere;
}

.refresh {
  min-height: 40px;
  border: 3px solid var(--stroke);
  border-radius: 14px;
  background: var(--gloss), linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
  box-shadow: 0 3px 0 #c97800, inset 0 1px 0 var(--glint);
  color: var(--ink);
  font-weight: 900;
}
</style>

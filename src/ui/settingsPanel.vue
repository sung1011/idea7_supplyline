<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { APP_VERSION } from '../generated/appVersion'
import { snapshotStats } from '../sim/gm'
import {
  ADD_TO_HOME_EXTERNAL_TIP,
  ADD_TO_HOME_EXTERNAL_TITLE,
  ADD_TO_HOME_IOS_STEPS,
  ADD_TO_HOME_IOS_TITLE,
  ADD_TO_HOME_LABEL,
  ADD_TO_HOME_WAIT_TIP,
  ADD_TO_HOME_WAIT_TITLE,
} from './addToHome'
import { addToHomeChoiceNow, markAddToHomeDismissed, requestAddToHome } from './addToHomeState'
import {
  checkForAppUpdate,
  refreshToNewVersion,
  updateChecking,
  updateDiffPending,
  updateGap,
  updateLatestNote,
  updateReady,
} from './appUpdateState'
import { formatBeijingDateTime, updateBehindLabel, updateEarlierLabel } from './appVersion'
import { loadPrefs, savePrefs, type Prefs } from './prefs'
import { useGameStore } from '../store/gameStore'

const PAGES = [
  { id: 'stats', label: '统计' },
  { id: 'general', label: '常规' },
  { id: 'version', label: '版本' },
  { id: 'gm', label: 'GM' },
] as const

type PageId = (typeof PAGES)[number]['id']

const emit = defineEmits<{ close: [] }>()
const store = useGameStore()
const page = ref<PageId>('stats')
const prefs = ref<Prefs>(loadPrefs())
const installGuide = ref<'ios' | 'external' | 'wait' | null>(null)
const resetAsk = ref(false)

const installGuideTitle = computed(() => {
  if (installGuide.value === 'ios') return ADD_TO_HOME_IOS_TITLE
  if (installGuide.value === 'external') return ADD_TO_HOME_EXTERNAL_TITLE
  return ADD_TO_HOME_WAIT_TITLE
})

const stats = computed(() => snapshotStats(store.game))
const releasedAt = computed(() => formatBeijingDateTime(APP_VERSION.releasedAt) || '—')
const notes = computed(() =>
  APP_VERSION.notes.map((note) => ({
    at: formatBeijingDateTime(note.at) || '—',
    title: note.title,
  })),
)

function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  prefs.value = savePrefs({ ...prefs.value, [key]: value })
}

function onKey(ev: KeyboardEvent) {
  if (ev.key !== 'Escape') return
  if (resetAsk.value) {
    resetAsk.value = false
    return
  }
  if (installGuide.value) {
    installGuide.value = null
    return
  }
  emit('close')
}

function confirmReset() {
  resetAsk.value = false
  store.gmReset()
}

async function onAddToHome() {
  markAddToHomeDismissed()
  const result = await requestAddToHome()
  if (result === 'ios' || result === 'external' || result === 'wait') installGuide.value = result
}

watch(addToHomeChoiceNow, (choice) => {
  if (choice === 'hidden') installGuide.value = null
})

onMounted(() => {
  window.addEventListener('keydown', onKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="mask" @click.self="emit('close')">
    <section class="panel box" role="dialog" aria-modal="true" aria-labelledby="set-title">
      <header>
        <h2 id="set-title" class="title">设置</h2>
        <button type="button" class="close" aria-label="关闭" @click="emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <nav class="sub" role="tablist" aria-label="设置分页">
        <button
          v-for="p in PAGES"
          :key="p.id"
          type="button"
          role="tab"
          :aria-selected="page === p.id"
          :class="{ on: page === p.id }"
          @click="page = p.id"
        >
          {{ p.label }}
          <i v-if="p.id === 'version' && updateReady" class="dot" />
        </button>
      </nav>

      <div v-if="page === 'stats'" class="body">
        <ul class="stats">
          <li>待命 {{ stats.camp }}</li>
          <li>医院占床 {{ stats.hospitalBeds }}</li>
          <li>医院排队 {{ stats.hospitalQueue }}</li>
          <li>餐厅占座 {{ stats.restaurantSeats }}</li>
          <li>餐厅排队 {{ stats.restaurantQueue }}</li>
          <li>床数 {{ stats.bedCount }}</li>
          <li>桌数 {{ stats.tableCount }}</li>
          <li>补给 {{ stats.supply }}</li>
          <li>药剂 {{ stats.potionCount }}</li>
          <li>货架合计 {{ stats.shelfTotal }}</li>
          <li>材料栏 {{ stats.kitchenCount }}</li>
        </ul>
      </div>

      <div v-else-if="page === 'general'" class="body">
        <div v-if="addToHomeChoiceNow !== 'hidden'" class="install-card">
          <span class="house" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 3.4 3.5 11h2.2v8.6h4.4V14h3.8v5.6h4.4V11H20.5L12 3.4z" />
            </svg>
          </span>
          <span class="install-copy">
            <strong>{{ ADD_TO_HOME_LABEL }}</strong>
            <small>像 App 一样全屏打开</small>
          </span>
          <button type="button" class="add" @click="onAddToHome">添加</button>
        </div>
        <div v-if="installGuide" class="guide" role="dialog" aria-labelledby="install-title">
          <h3 id="install-title" class="guide-title">{{ installGuideTitle }}</h3>
          <div v-if="installGuide === 'ios'" class="ios-art" aria-hidden="true">
            <div class="ios-row">
              <svg class="glyph" viewBox="0 0 24 24">
                <path d="M12 3v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path
                  d="M8 7l4-4 4 4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M6 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <span>分享</span>
            </div>
            <span class="ios-then">然后</span>
            <div class="ios-row">
              <svg class="glyph" viewBox="0 0 24 24">
                <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2" />
                <path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
              <span>添加到主屏幕</span>
            </div>
          </div>
          <ol v-if="installGuide === 'ios'" class="steps">
            <li v-for="step in ADD_TO_HOME_IOS_STEPS" :key="step">{{ step }}</li>
          </ol>
          <p v-else-if="installGuide === 'external'" class="hint">{{ ADD_TO_HOME_EXTERNAL_TIP }}</p>
          <p v-else class="hint">{{ ADD_TO_HOME_WAIT_TIP }}</p>
          <button type="button" @click="installGuide = null">知道了</button>
        </div>
        <div class="switches">
          <label class="switch-row">
            <span>音乐</span>
            <input
              type="checkbox"
              :checked="prefs.music"
              @change="setPref('music', ($event.target as HTMLInputElement).checked)"
            />
          </label>
          <label class="switch-row">
            <span>音效</span>
            <input
              type="checkbox"
              :checked="prefs.sfx"
              @change="setPref('sfx', ($event.target as HTMLInputElement).checked)"
            />
          </label>
        </div>
        <p class="hint">开关先记在本地，音频资源占位。</p>
      </div>

      <div v-else-if="page === 'version'" class="body">
        <div class="ver-card">
          <p class="ver">当前版本 {{ APP_VERSION.version }}</p>
          <p class="hint">发布时间 {{ releasedAt }}（北京时间）</p>
        </div>
        <button v-if="updateReady" type="button" class="refresh wide" @click="refreshToNewVersion()">
          有新版本，点击刷新
        </button>
        <button v-else type="button" class="wide" :disabled="updateChecking" @click="checkForAppUpdate(true)">
          {{ updateChecking ? '检查中' : '检查更新' }}
        </button>
        <template v-if="updateReady && updateGap && updateGap.behind > 0">
          <p class="notes-title">{{ updateBehindLabel(updateGap.behind) }}</p>
          <ol v-if="updateGap.notes.length" class="notes">
            <li v-for="note in updateGap.notes" :key="`${note.at}-${note.title}`">
              <time>{{ formatBeijingDateTime(note.at) }}</time>
              <span>{{ note.title }}</span>
            </li>
          </ol>
          <p v-if="updateEarlierLabel(updateGap.earlier)" class="hint">{{ updateEarlierLabel(updateGap.earlier) }}</p>
        </template>
        <template v-else-if="updateReady && !updateDiffPending && updateLatestNote">
          <ol class="notes">
            <li>
              <time v-if="formatBeijingDateTime(updateLatestNote.at)">
                {{ formatBeijingDateTime(updateLatestNote.at) }}
              </time>
              <span>{{ updateLatestNote.title }}</span>
            </li>
          </ol>
        </template>
        <template v-else-if="!updateReady">
          <p v-if="notes.length" class="notes-title">更新记录</p>
          <ol v-if="notes.length" class="notes">
            <li v-for="note in notes" :key="`${note.at}-${note.title}`">
              <time>{{ note.at }}</time>
              <span>{{ note.title }}</span>
            </li>
          </ol>
          <p v-else class="hint">暂时没有更新记录。</p>
        </template>
        <p class="hint">
          打开游戏、每 30 分钟、回到前台时会自动检查。自动发现新版本时，设置按钮旁会弹出提示，关掉后红点还在。不会自动刷新，存档不受影响。
        </p>
      </div>

      <div v-else-if="page === 'gm'" class="body">
        <section class="gm-group">
          <h3 class="gm-title">存档</h3>
          <div class="gm-grid">
            <button type="button" class="danger" @click="resetAsk = true">初始化</button>
          </div>
        </section>
        <section class="gm-group">
          <h3 class="gm-title">资源</h3>
          <div class="gm-grid">
            <button type="button" @click="store.gmAddSupply()">加补给 +50</button>
            <button type="button" @click="store.gmAddPotion()">加药 +5</button>
            <button type="button" @click="store.gmAddShelf()">货架三种各 +5</button>
            <button type="button" @click="store.gmGrantCoarse()">发粗料</button>
          </div>
        </section>
        <section class="gm-group">
          <h3 class="gm-title">单位</h3>
          <div class="gm-grid">
            <button type="button" @click="store.gmRecallAll()">全员回营</button>
          </div>
        </section>
        <p class="hint">「初始化」只清补给线存档，音乐音效等设置会留下。点了先弹确认框。</p>
      </div>
    </section>
  </div>
  <Teleport to="body">
    <div v-if="resetAsk" class="ask-mask" @click.self="resetAsk = false">
      <div class="ask" role="alertdialog" aria-modal="true" aria-labelledby="reset-ask">
        <p id="reset-ask">初始化会重开存档。</p>
        <div class="ask-actions">
          <button type="button" @click="resetAsk = false">取消</button>
          <button type="button" class="danger" @click="confirmReset">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: var(--z-settings);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 72px 16px 24px;
  background: rgba(42, 24, 12, 0.52);
}

.box {
  width: min(440px, 100%);
  max-height: min(76dvh, 620px);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 10px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius-card);
  background: linear-gradient(180deg, #fffdf2 0%, #ffe9a8 100%);
  box-shadow: 0 var(--lift) 0 var(--stroke-deep);
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

header .title,
.hint {
  margin: 0;
  line-height: 1.5;
}

.hint {
  color: var(--muted);
  font-size: 13px;
}

.box button {
  border: var(--border) solid var(--stroke);
  border-radius: 14px;
  background: linear-gradient(180deg, #fff8dc 0%, #ffe56a 100%);
  box-shadow: 0 var(--lift) 0 var(--stroke-deep);
  color: var(--ink);
  font-weight: 800;
}

.close {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  margin-left: auto;
  padding: 0;
  border-radius: 50%;
  line-height: 1;
  color: #fff8f4;
  border-color: #8d241c;
  background: linear-gradient(#e85a4c, #c43228);
  box-shadow: 0 3px 0 #7a1c16;
}

.close svg {
  display: block;
  width: 16px;
  height: 16px;
  margin: 0 auto;
}

.sub {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sub button {
  position: relative;
  flex: 1 1 72px;
  min-height: 36px;
  border-radius: 999px;
}

.dot {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  box-shadow: 0 0 0 2px var(--plate);
}

.sub button.on {
  color: var(--ink);
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
}

.body,
.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats {
  margin: 0;
  padding: 0;
  list-style: none;
  font-family: var(--font-mono);
  color: var(--muted);
  font-weight: 700;
}

.switches {
  display: flex;
  flex-direction: column;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 6px 2px;
  cursor: pointer;
}

.switch-row + .switch-row {
  border-top: 1px solid rgba(58, 36, 20, 0.22);
}

.switch-row input {
  appearance: none;
  -webkit-appearance: none;
  width: 46px;
  height: 26px;
  margin: 0;
  flex: none;
  border: 2px solid var(--stroke);
  border-radius: 999px;
  background: #c8bba4;
  position: relative;
  cursor: pointer;
}

.switch-row input::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff8f4;
  box-shadow: 0 1px 0 rgba(36, 22, 14, 0.28);
  transition: transform var(--motion) ease;
}

.switch-row input:checked {
  background: linear-gradient(#6fbe4a, #3d8a34);
  border-color: #246b22;
}

.switch-row input:checked::after {
  transform: translateX(20px);
}

.install-card,
.ver-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius);
  background: #fffdf2;
}

.ver-card {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.house {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border: 3px solid #246b22;
  border-radius: 12px;
  color: #f4fff0;
  background: linear-gradient(#8fd96a, #3d8a34);
}

.house svg {
  width: 26px;
  height: 26px;
}

.install-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.install-copy strong {
  font-size: 16px;
  line-height: 1.2;
}

.install-copy small,
.notes-title {
  color: var(--muted);
  font-size: 12px;
}

.notes-title {
  margin: 4px 0 0;
}

.add {
  flex: none;
  min-height: 36px;
  padding: 4px 14px;
}

.wide {
  width: 100%;
  min-height: 40px;
}

.ver {
  margin: 0;
  font-family: var(--font-mono);
  color: var(--muted);
  font-weight: 800;
}

.refresh {
  color: var(--ink);
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
}

.gm-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.gm-title {
  margin: 2px 0 0;
  font-family: var(--font-body);
  font-size: 13px;
  letter-spacing: 0;
  color: var(--muted);
}

.gm-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.gm-grid button {
  width: 100%;
  min-height: 44px;
  padding: 6px 8px;
  font-size: 14px;
  line-height: 1.2;
}

.danger {
  color: #fff8f4;
  border-color: #8d241c;
  background: linear-gradient(#e85a4c, #c43228);
  box-shadow: 0 3px 0 #7a1c16;
}

.ask-mask {
  position: fixed;
  inset: 0;
  z-index: var(--z-confirm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(42, 24, 12, 0.45);
}

.ask {
  width: min(280px, 100%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius-card);
  background: var(--plate);
  box-shadow: 0 var(--lift) 0 var(--stroke-deep);
}

.ask p {
  margin: 0;
  font-weight: 800;
}

.ask-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ask-actions button {
  width: 100%;
  min-height: 40px;
  border: var(--border) solid var(--stroke);
  border-radius: 14px;
  background: linear-gradient(180deg, #fff8dc 0%, #ffe56a 100%);
  box-shadow: 0 var(--lift) 0 var(--stroke-deep);
  color: var(--ink);
  font-weight: 800;
}

.ask-actions .danger {
  color: #fff8f4;
  border-color: #8d241c;
  background: linear-gradient(#e85a4c, #c43228);
  box-shadow: 0 3px 0 #7a1c16;
}

.guide {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: var(--border) solid var(--stroke);
  border-radius: var(--radius);
  background: var(--slot);
}

.guide-title {
  margin: 0;
  font-size: 16px;
}

.ios-art {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 2px solid var(--stroke);
  border-radius: 18px;
  background: #fffdf2;
}

.ios-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 4px 8px;
  border-radius: 10px;
  background: #fff8dc;
  color: var(--ink);
  font-size: 14px;
}

.glyph {
  width: 22px;
  height: 22px;
  flex: none;
}

.ios-then {
  align-self: center;
  color: var(--muted);
  font-size: 12px;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding-left: 1.2em;
}

.notes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notes li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notes time {
  color: var(--muted);
  font-size: 12px;
}
</style>

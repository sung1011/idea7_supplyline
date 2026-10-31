<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'
import { APP_VERSION } from '../generated/appVersion'
import { GAME_NAME } from '../sim/placeholder'
import { useGameStore } from '../store/gameStore'
import { startAddToHomeWatch } from './addToHomeState'
import AppUpdateBubble from './appUpdateBubble.vue'
import {
  dismissUpdateBubble,
  refreshToNewVersion,
  startAppUpdateSchedule,
  updateBubble,
  updateReady,
} from './appUpdateState'
import CampPage from './campPage.vue'
import CrIcon from './crIcon.vue'
import FloatTips from './floatTips.vue'
import HospitalPage from './hospitalPage.vue'
import RestaurantPage from './restaurantPage.vue'
import SettingsPanel from './settingsPanel.vue'

const store = useGameStore()
const { tab, game } = storeToRefs(store)
const settingsOpen = ref(false)
const settingsBtn = ref<HTMLButtonElement | null>(null)
let stopAppUpdate: (() => void) | null = null
let stopAddToHome: (() => void) | null = null

onMounted(() => {
  store.startClock()
  stopAppUpdate = startAppUpdateSchedule()
  stopAddToHome = startAddToHomeWatch()
})

onUnmounted(() => {
  store.stopClock()
  stopAppUpdate?.()
  stopAddToHome?.()
})
</script>

<template>
  <div class="shell" :class="tab">
    <header class="hud">
      <div class="brand">
        <p class="mark">{{ GAME_NAME }}</p>
        <p class="ver">{{ APP_VERSION.version }}</p>
      </div>
      <div class="hud-right">
        <div class="res" aria-label="资源">
          <span class="cr-pill supply" title="补给">
            <CrIcon name="crate" />
            {{ Math.floor(game.supply) }}
          </span>
          <span class="cr-pill potion" title="药剂">
            <CrIcon name="potion" />
            {{ Math.floor(game.potionCount) }}
          </span>
        </div>
        <button
          ref="settingsBtn"
          type="button"
          class="gear"
          :class="{ unread: updateReady }"
          :aria-label="updateReady ? '设置，有新版本' : '设置'"
          @click="settingsOpen = true"
        >
          <CrIcon name="gear" />
          <i v-if="updateReady" class="dot" />
        </button>
      </div>
    </header>

    <main class="page">
      <CampPage v-if="tab === 'camp'" />
      <HospitalPage v-else-if="tab === 'hospital'" />
      <RestaurantPage v-else />
    </main>

    <nav class="tabs" aria-label="区域">
      <button
        type="button"
        class="cr-tab"
        :class="{ on: tab === 'camp' }"
        :aria-current="tab === 'camp' ? 'page' : undefined"
        @click="tab = 'camp'"
      >
        <CrIcon name="tent" />
        营地
      </button>
      <button
        type="button"
        class="cr-tab"
        :class="{ on: tab === 'hospital' }"
        :aria-current="tab === 'hospital' ? 'page' : undefined"
        @click="tab = 'hospital'"
      >
        <CrIcon name="cross" />
        医院
      </button>
      <button
        type="button"
        class="cr-tab"
        :class="{ on: tab === 'restaurant' }"
        :aria-current="tab === 'restaurant' ? 'page' : undefined"
        @click="tab = 'restaurant'"
      >
        <CrIcon name="plate" />
        餐厅
      </button>
    </nav>

    <AppUpdateBubble
      v-if="updateBubble && !settingsOpen"
      :version="updateBubble.version"
      :lines="updateBubble.lines"
      :gap="updateBubble.gap"
      :anchor="settingsBtn"
      @close="dismissUpdateBubble"
      @refresh="refreshToNewVersion"
    />
    <SettingsPanel v-if="settingsOpen" @close="settingsOpen = false" />
    <FloatTips />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  height: 100dvh;
  margin: 0 auto;
  overflow: hidden;
  padding-top: env(safe-area-inset-top);
  background:
    radial-gradient(ellipse at 50% -8%, rgba(255, 240, 120, 0.45), transparent 42%),
    linear-gradient(180deg, #7ad4ff 0%, #8dff4a 40%, #2f9e28 100%);
  box-shadow: 0 0 0 4px var(--stroke-deep);
}

.shell.hospital {
  background:
    radial-gradient(ellipse at 50% -8%, rgba(255, 255, 255, 0.7), transparent 46%),
    linear-gradient(180deg, #fff7f4 0%, #ff8a84 48%, #e03a40 100%);
}

.shell.restaurant {
  background:
    radial-gradient(ellipse at 50% -8%, rgba(255, 255, 220, 0.7), transparent 46%),
    linear-gradient(180deg, #fff6c4 0%, #ffd24a 48%, #f08a14 100%);
}

.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px 8px;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mark,
.ver {
  margin: 0;
}

.mark {
  color: var(--ink);
  font-size: 18px;
  font-weight: 900;
}

.ver {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
}

.hud-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.res {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cr-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--gloss), linear-gradient(180deg, #fffdf2 0%, #ffe08a 100%);
  font-size: 14px;
}

.cr-pill.potion {
  background: var(--gloss), linear-gradient(180deg, #fff4f0 0%, #ffb8b0 100%);
}

.cr-pill :deep(.cr-icon) {
  width: 18px;
  height: 18px;
}

.gear {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  min-width: 40px;
  height: 40px;
  min-height: 40px;
  padding: 0;
  border: var(--border) solid var(--stroke);
  border-radius: 14px;
  background: var(--gloss), linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
  box-shadow: 0 var(--lift) 0 var(--stroke-deep), inset 0 1px 0 var(--glint);
  font-size: 22px;
  color: var(--ink);
}

.gear::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 4px;
  height: 1px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.72);
  pointer-events: none;
}

.gear:not(:disabled):active {
  transform: translateY(var(--lift));
  box-shadow: 0 0 0 var(--stroke-deep), inset 0 1px 0 var(--glint);
}

.gear :deep(.cr-icon) {
  width: 22px;
  height: 22px;
}

.dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  box-shadow: 0 0 0 2px #fff8dc;
}

.page {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px 14px 12px;
  overflow: auto;
}

.page > :deep(section) {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
  border-top: 4px solid var(--stroke);
  background: var(--gloss), #ffe08a;
}

.cr-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 68px;
  padding: 6px 4px;
  border-radius: 18px;
  background: var(--gloss), linear-gradient(180deg, #fffdf2 0%, #ffe7a4 100%);
  font-size: 14px;
}

.cr-tab :deep(.cr-icon) {
  width: 26px;
  height: 26px;
}

.cr-tab.on {
  background: var(--gloss), linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
  box-shadow: 0 6px 0 #c45e00, inset 0 1px 0 var(--glint);
  transform: translateY(-2px);
}

.cr-tab.on:not(:disabled):active {
  transform: translateY(var(--lift));
  box-shadow: 0 0 0 #c45e00, inset 0 1px 0 var(--glint);
}

@media (prefers-reduced-motion: reduce) {
  .cr-tab.on {
    transform: none;
  }
}
</style>

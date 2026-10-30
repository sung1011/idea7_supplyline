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
          <span class="pill supply" title="补给">📦 {{ Math.floor(game.supply) }}</span>
          <span class="pill potion" title="药剂">💊 {{ Math.floor(game.potionCount) }}</span>
        </div>
        <button
          ref="settingsBtn"
          type="button"
          class="gear"
          :class="{ unread: updateReady }"
          :aria-label="updateReady ? '设置，有新版本' : '设置'"
          @click="settingsOpen = true"
        >
          <svg class="glyph" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19.1 12.7a7.4 7.4 0 0 0 .1-1.4 7.4 7.4 0 0 0-.1-1.4l2-1.6a.5.5 0 0 0 .1-.6l-1.9-3.3a.5.5 0 0 0-.6-.2l-2.4 1a7 7 0 0 0-2.4-1.4l-.4-2.5a.5.5 0 0 0-.5-.4h-3.8a.5.5 0 0 0-.5.4l-.4 2.5a7 7 0 0 0-2.4 1.4l-2.4-1a.5.5 0 0 0-.6.2L2.7 7.7a.5.5 0 0 0 .1.6l2 1.6a7.4 7.4 0 0 0-.1 1.4 7.4 7.4 0 0 0 .1 1.4l-2 1.6a.5.5 0 0 0-.1.6l1.9 3.3a.5.5 0 0 0 .6.2l2.4-1a7 7 0 0 0 2.4 1.4l.4 2.5a.5.5 0 0 0 .5.4h3.8a.5.5 0 0 0 .5-.4l.4-2.5a7 7 0 0 0 2.4-1.4l2.4 1a.5.5 0 0 0 .6-.2l1.9-3.3a.5.5 0 0 0-.1-.6Zm-7.1 2.1A2.8 2.8 0 1 1 14.8 12 2.8 2.8 0 0 1 12 14.8Z"
            />
          </svg>
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
        class="tab"
        :class="{ on: tab === 'camp' }"
        :aria-current="tab === 'camp' ? 'page' : undefined"
        @click="tab = 'camp'"
      >
        <span aria-hidden="true">🏕️</span>
        营地
      </button>
      <button
        type="button"
        class="tab"
        :class="{ on: tab === 'hospital' }"
        :aria-current="tab === 'hospital' ? 'page' : undefined"
        @click="tab = 'hospital'"
      >
        <span aria-hidden="true">🏥</span>
        医院
      </button>
      <button
        type="button"
        class="tab"
        :class="{ on: tab === 'restaurant' }"
        :aria-current="tab === 'restaurant' ? 'page' : undefined"
        @click="tab = 'restaurant'"
      >
        <span aria-hidden="true">🍽️</span>
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
  background: linear-gradient(180deg, #b8f07a 0%, #6fcf4a 42%, #4eae36 100%);
  box-shadow: 0 0 0 3px var(--stroke-deep);
}

.shell.hospital {
  background: linear-gradient(180deg, #ffe4df 0%, #ff9b8f 46%, #ef6b62 100%);
}

.shell.restaurant {
  background: linear-gradient(180deg, #fff3c4 0%, #ffcc4d 46%, #f0a020 100%);
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
  gap: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 4px 10px;
  border: 3px solid var(--stroke);
  border-radius: 999px;
  background: #fff8dc;
  box-shadow: 0 3px 0 var(--stroke-deep);
  font-size: 14px;
  font-weight: 800;
}

.gear {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  min-width: 34px;
  height: 34px;
  min-height: 34px;
  padding: 0;
  border: 3px solid var(--stroke);
  border-radius: 50%;
  background: #fff8dc;
  box-shadow: 0 3px 0 var(--stroke-deep);
  color: var(--ink);
}

.gear .glyph {
  width: 18px;
  height: 18px;
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

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  padding: 10px 12px calc(12px + env(safe-area-inset-bottom));
  border-top: 3px solid var(--stroke);
  background: #ffe9a0;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 64px;
  padding: 6px 4px;
  border: 3px solid var(--stroke);
  border-radius: 16px;
  background: #fff8dc;
  box-shadow: 0 4px 0 var(--stroke-deep);
  color: var(--ink);
  font-size: 14px;
  font-weight: 900;
}

.tab span {
  font-size: 20px;
  line-height: 1;
}

.tab.on {
  background: linear-gradient(180deg, #ffe56a 0%, #ffb020 100%);
}
</style>

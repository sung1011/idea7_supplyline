<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted } from 'vue'
import { APP_VERSION } from '../generated/appVersion'
import { GAME_NAME } from '../sim/placeholder'
import { useGameStore } from '../store/gameStore'
import CampPage from './campPage.vue'
import HospitalPage from './hospitalPage.vue'

const store = useGameStore()
const { tab, game } = storeToRefs(store)

onMounted(() => {
  store.startClock()
})

onUnmounted(() => {
  store.stopClock()
})
</script>

<template>
  <div class="shell" :class="tab">
    <header class="hud">
      <div class="brand">
        <p class="mark">{{ GAME_NAME }}</p>
        <p class="ver">{{ APP_VERSION.version }}</p>
      </div>
      <div class="res" aria-label="资源">
        <span class="pill supply" title="补给">📦 {{ Math.floor(game.supply) }}</span>
        <span class="pill potion" title="药剂">💊 {{ Math.floor(game.potionCount) }}</span>
      </div>
    </header>

    <main class="page">
      <CampPage v-if="tab === 'camp'" />
      <HospitalPage v-else />
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
      <button type="button" class="tab locked" disabled>
        <span aria-hidden="true">🍽️</span>
        餐厅
        <small>未开放</small>
      </button>
    </nav>
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

.tab.locked {
  background: #d8d2c6;
  box-shadow: 0 4px 0 #8c8678;
  color: #6b665c;
}

.tab small {
  font-size: 10px;
  font-weight: 800;
}
</style>

<script setup lang="ts">
import { APP_VERSION } from '../generated/appVersion'
import { GAME_NAME, GAME_TAGLINE } from '../sim/placeholder'
</script>

<template>
  <div class="shell">
    <header class="hud">
      <p class="mark">后勤</p>
      <p class="ver">{{ APP_VERSION.version }}</p>
    </header>
    <main class="page">
      <h1 class="title">{{ GAME_NAME }}</h1>
      <p class="lead">{{ GAME_TAGLINE }}</p>
      <p class="note">医院收治伤员，餐厅供应伙食。玩法尚未落地，当前只是竖屏骨架。</p>
    </main>
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
    linear-gradient(180deg, rgba(27, 40, 48, 0.35), transparent 28%),
    linear-gradient(180deg, #162026 0%, #12181c 100%);
  box-shadow: 0 0 0 1px var(--stroke-deep);
}

.hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 16px 8px;
}

.mark,
.ver {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.16em;
}

.ver {
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}

.page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1 1 auto;
  min-height: 0;
  padding: 24px 28px calc(32px + env(safe-area-inset-bottom));
}

.title {
  margin: 0 0 12px;
  color: var(--brass);
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 400;
  letter-spacing: 0.22em;
}

.lead,
.note {
  margin: 0;
  line-height: 1.7;
}

.lead {
  color: var(--ink);
  font-size: 16px;
}

.note {
  margin-top: 16px;
  color: var(--muted);
  font-size: 13px;
}
</style>

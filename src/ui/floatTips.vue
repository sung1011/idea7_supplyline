<script setup lang="ts">
import { useFloatTips } from './floatTips'

const { tips } = useFloatTips()
</script>

<template>
  <Teleport to="body">
    <div class="layer" aria-live="polite">
      <p
        v-for="tip in tips"
        :key="tip.id"
        class="tip"
        :class="tip.kind"
        :style="{ left: `${tip.x}px`, top: `${tip.y}px` }"
      >
        {{ tip.text }}
      </p>
    </div>
  </Teleport>
</template>

<style scoped>
.layer {
  position: fixed;
  inset: 0;
  z-index: var(--z-tips);
  pointer-events: none;
}

.tip {
  position: absolute;
  margin: 0;
  max-width: min(280px, 70vw);
  padding: 4px 10px;
  border: 3px solid var(--stroke);
  border-radius: 12px;
  background: rgba(255, 248, 220, 0.96);
  color: var(--ink);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
  transform: translate(-50%, -120%);
  animation: float-tip 1.4s ease-out forwards;
  box-shadow: 0 3px 0 var(--stroke-deep);
}

.tip.err {
  border-color: #9b1d2e;
  color: #9b1d2e;
  background: rgba(255, 236, 230, 0.95);
}

.tip.ok {
  border-color: #246b22;
  color: #246b22;
  background: rgba(232, 248, 220, 0.95);
}

@keyframes float-tip {
  0% {
    opacity: 0;
    transform: translate(-50%, -80%);
  }
  12% {
    opacity: 1;
    transform: translate(-50%, -120%);
  }
  70% {
    opacity: 1;
    transform: translate(-50%, -160%);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -190%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tip {
    animation: float-tip-static 1.4s linear forwards;
  }
}

@keyframes float-tip-static {
  0%,
  70% {
    opacity: 1;
    transform: translate(-50%, -120%);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -120%);
  }
}
</style>

<script setup>
defineProps({
  isPlaying: Boolean,
  hasPlayed: Boolean,
  autoPlayFailed: Boolean,
})

defineEmits(['retry'])
</script>

<template>
  <div
    class="audio-status-banner"
    :class="{
      'status-playing': isPlaying,
      'status-ended': hasPlayed,
      'status-failed': autoPlayFailed && !isPlaying && !hasPlayed,
    }"
  >
    <div class="banner-main">
      <span class="banner-icon">
        <template v-if="isPlaying">🔊</template>
        <template v-else-if="hasPlayed">✓</template>
        <template v-else-if="autoPlayFailed">⚠</template>
        <template v-else>🔊</template>
      </span>
      <span class="banner-text">
        <template v-if="isPlaying">音频播放中...</template>
        <template v-else-if="hasPlayed">音频已播放完毕</template>
        <template v-else-if="autoPlayFailed">音频无法自动播放，请点击播放按钮</template>
        <template v-else>准备播放音频...</template>
      </span>
      <span class="banner-once-rule">音频仅可播放一次</span>
    </div>
    <button
      v-if="autoPlayFailed && !isPlaying && !hasPlayed"
      class="banner-play-btn"
      @click="$emit('retry')"
    >
      播放
    </button>
  </div>
</template>

<style scoped>
.audio-status-banner {
  position: sticky;
  top: 56px;
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-radius: var(--r-input);
  background: rgba(37, 99, 235, 0.06);
  border: 1px solid rgba(37, 99, 235, 0.15);
  transition:
    background 0.3s,
    border-color 0.3s;
}

.audio-status-banner.status-playing {
  background: rgba(37, 99, 235, 0.08);
  border-color: rgba(37, 99, 235, 0.2);
}

.audio-status-banner.status-ended {
  background: rgba(0, 0, 0, 0.03);
  border-color: var(--c-border);
}

.audio-status-banner.status-failed {
  background: rgba(230, 162, 60, 0.08);
  border-color: rgba(230, 162, 60, 0.25);
}

.banner-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.banner-icon {
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1;
}

.banner-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-primary);
  white-space: nowrap;
}

.status-playing .banner-text {
  color: var(--c-accent);
}

.status-ended .banner-text {
  color: var(--c-text-secondary);
}

.status-failed .banner-text {
  color: #b8860b;
}

.banner-once-rule {
  font-size: 12px;
  font-weight: 700;
  color: var(--c-danger);
  white-space: nowrap;
  padding: 1px 6px;
  border-radius: var(--r-button);
  background: rgba(245, 63, 63, 0.06);
}

.banner-play-btn {
  flex-shrink: 0;
  padding: 4px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  background: var(--c-accent);
  border: none;
  border-radius: var(--r-button);
  cursor: pointer;
  transition: opacity 0.15s;
}

.banner-play-btn:hover {
  opacity: 0.85;
}

@media (max-width: 480px) {
  .audio-status-banner {
    flex-wrap: wrap;
    padding: 8px 12px;
    top: 48px;
  }

  .banner-main {
    flex-wrap: wrap;
    gap: 4px 8px;
  }

  .banner-text {
    font-size: 13px;
    white-space: normal;
  }

  .banner-once-rule {
    font-size: 11px;
  }

  .banner-play-btn {
    width: 100%;
    text-align: center;
    padding: 6px 16px;
  }
}
</style>

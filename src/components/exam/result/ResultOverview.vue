<script setup>
import { EXAM_TOTAL_SCORE } from '@/constants/exam'

defineProps({
  submitTimeText: {
    type: String,
    default: '--',
  },
  durationText: {
    type: String,
    default: '--:--:--',
  },
  statusText: {
    type: String,
    default: '--',
  },
  score: {
    type: [Number, String],
    default: 0,
  },
})
</script>

<template>
  <section class="overview-card">
    <div class="overview-meta">
      <span>{{ submitTimeText }}</span>
      <span class="meta-sep">·</span>
      <span>用时 {{ durationText }}</span>
      <span class="meta-sep">·</span>
      <span>{{ statusText }}</span>
    </div>
    <div class="overview-score">
      <span class="score-value">{{ score }}</span>
    </div>
    <div class="score-total-label">总分 {{ EXAM_TOTAL_SCORE }}</div>
  </section>
</template>

<style scoped>
.overview-card {
  background: var(--c-bg);
  border-radius: var(--r-card);
  padding: 32px;
  margin-bottom: 16px;
}

.overview-meta {
  font-size: 14px;
  color: var(--c-text-secondary);
  margin-bottom: 24px;
}

.meta-sep {
  margin: 0 8px;
  color: var(--c-text-tertiary);
}

.overview-score {
  margin-bottom: 4px;
}

.score-value {
  font-size: 48px;
  font-weight: 700;
  color: var(--c-text-primary);
  line-height: 1.1;
}

.score-total-label {
  font-size: 14px;
  color: var(--c-text-tertiary);
}

@media (max-width: 768px) {
  .overview-card {
    padding: 24px 20px;
  }

  .score-value {
    font-size: 36px;
  }
}

@media (max-width: 480px) {
  .overview-card {
    padding: 20px 16px;
  }
}
</style>

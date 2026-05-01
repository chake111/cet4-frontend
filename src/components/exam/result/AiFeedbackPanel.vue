<script setup>
import { computed } from 'vue'
import { isStructuredFeedback, parseAiFeedback } from '@/domain/exam'

const props = defineProps({
  feedback: {
    type: [String, Object],
    default: null,
  },
})

const parsedFeedback = computed(() => parseAiFeedback(props.feedback))
const structured = computed(() => isStructuredFeedback(props.feedback))
</script>

<template>
  <div v-if="feedback && structured" class="ai-feedback-panel">
    <div v-if="parsedFeedback?.overall" class="feedback-section">
      <div class="feedback-label">总体评价</div>
      <div class="feedback-content">{{ parsedFeedback.overall }}</div>
    </div>

    <div v-if="parsedFeedback?.strengths?.length" class="feedback-section">
      <div class="feedback-label">优点</div>
      <ul class="feedback-list">
        <li v-for="(item, idx) in parsedFeedback.strengths" :key="'s' + idx">{{ item }}</li>
      </ul>
    </div>

    <div v-if="parsedFeedback?.accuracy" class="feedback-section">
      <div class="feedback-label">准确性</div>
      <div class="feedback-content">{{ parsedFeedback.accuracy }}</div>
    </div>

    <div v-if="parsedFeedback?.expression" class="feedback-section">
      <div class="feedback-label">语言表达</div>
      <div class="feedback-content">{{ parsedFeedback.expression }}</div>
    </div>

    <div v-if="parsedFeedback?.weaknesses?.length" class="feedback-section">
      <div class="feedback-label">存在问题</div>
      <ul class="feedback-list">
        <li v-for="(item, idx) in parsedFeedback.weaknesses" :key="'w' + idx">{{ item }}</li>
      </ul>
    </div>

    <div v-if="parsedFeedback?.suggestions?.length" class="feedback-section">
      <div class="feedback-label">改进建议</div>
      <ul class="feedback-list">
        <li v-for="(item, idx) in parsedFeedback.suggestions" :key="'g' + idx">{{ item }}</li>
      </ul>
    </div>
  </div>

  <div v-else-if="feedback" class="ai-feedback-plain">
    {{ feedback }}
  </div>
</template>

<style scoped>
.ai-feedback-panel,
.ai-feedback-plain {
  margin-top: 12px;
  padding: 16px;
  background: var(--c-bg-weak);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
}

.feedback-section {
  margin-bottom: 12px;
}

.feedback-section:last-child {
  margin-bottom: 0;
}

.feedback-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text-primary);
  margin-bottom: 4px;
}

.feedback-content,
.feedback-list,
.ai-feedback-plain {
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.6;
}

.feedback-list {
  margin: 0;
  padding-left: 20px;
}

.feedback-list li {
  list-style-type: disc;
  margin-bottom: 2px;
}

.ai-feedback-plain {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

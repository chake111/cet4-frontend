<script setup>
import { useExamStore } from '@/stores/exam'

defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
})

const examStore = useExamStore()

const updateAnswer = (questionId, value) => {
  examStore.saveAnswer('translation', questionId, value)
}
</script>

<template>
  <section class="stage-wrap">
    <article v-for="(question, index) in questions" :key="question.id" class="question-card">
      <div class="question-no">Q{{ index + 1 }}</div>
      <p class="source-text">{{ question.content?.source }}</p>

      <el-input :model-value="examStore.answersByStage.translation[question.id] || ''" type="textarea" :rows="8"
        placeholder="输入英文译文" class="translation-textarea" @update:model-value="updateAnswer(question.id, $event)" />
    </article>
  </section>
</template>

<style scoped>
.stage-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-no {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  margin-bottom: 8px;
}

.source-box {
  background: var(--c-bg-weak);
  border-radius: var(--r-card);
  padding: 16px;
  border: 1px solid var(--c-border);
}

.source-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--c-text-primary);
  white-space: pre-wrap;
}

.translation-textarea :deep(.el-textarea__inner) {
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  box-shadow: none;
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.8;
  padding: 12px;
  resize: vertical;
}

.translation-textarea :deep(.el-textarea__inner:focus) {
  border-color: var(--c-accent);
  box-shadow: none;
}
</style>

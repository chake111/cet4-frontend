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
  examStore.saveAnswer('writing', questionId, value)
}
</script>

<template>
  <section class="stage-wrap">
    <article v-for="(question, index) in questions" :key="question.id" class="question-card">
      <div class="question-no">Q{{ index + 1 }}</div>
      <h3 class="question-title">{{ question.content?.title }}</h3>
      <p v-if="question.content?.background" class="question-desc">{{ question.content.background }}</p>
      <el-input
        :model-value="examStore.answersByStage.writing[question.id] || ''"
        type="textarea"
        :rows="10"
        placeholder="输入作文内容"
        class="writing-textarea"
        @update:model-value="updateAnswer(question.id, $event)"
      />
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

.question-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.8;
  color: var(--c-text-primary);
}

.question-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--c-text-primary);
  white-space: pre-wrap;
}

.writing-textarea :deep(.el-textarea__inner) {
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  box-shadow: none;
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.8;
  padding: 12px;
  resize: vertical;
}

.writing-textarea :deep(.el-textarea__inner:focus) {
  border-color: var(--c-accent);
  box-shadow: none;
}
</style>

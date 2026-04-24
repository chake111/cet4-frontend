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
    <article v-for="question in questions" :key="question.id" class="question-card">
      <h3 class="question-title">{{ question.content?.title }}</h3>
      <p v-if="question.content?.background" class="question-desc">{{ question.content.background }}</p>
      <el-input
        :model-value="examStore.answersByStage.writing[question.id] || ''"
        type="textarea"
        :rows="10"
        placeholder="请输入作文"
        @update:model-value="updateAnswer(question.id, $event)"
      />
    </article>
  </section>
</template>

<style scoped>
.stage-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.question-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
}

.question-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.question-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #606266;
  white-space: pre-wrap;
}
</style>

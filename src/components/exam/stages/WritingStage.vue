<script setup>
import { useExamAnswerStore } from '@/stores/examAnswer'
import TextAnswerQuestion from './TextAnswerQuestion.vue'

defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
})

const answerStore = useExamAnswerStore()

const updateAnswer = (questionId, value) => {
  answerStore.saveAnswer({ stage: 'writing', questionId, value })
}
</script>

<template>
  <section class="stage-wrap">
    <TextAnswerQuestion
      v-for="(question, index) in questions"
      :key="question.id"
      :question-no="index + 1"
      :title="question.content?.title"
      :description="question.content?.background"
      :model-value="answerStore.answersByStage.writing[question.id] || ''"
      :rows="10"
      placeholder="输入作文内容"
      @update:model-value="updateAnswer(question.id, $event)"
    />
  </section>
</template>

<style scoped>
.stage-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>

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
  answerStore.saveAnswer({ stage: 'translation', questionId, value })
}
</script>

<template>
  <section class="stage-wrap">
    <TextAnswerQuestion
      v-for="(question, index) in questions"
      :key="question.id"
      :question-no="index + 1"
      :description="question.content?.source"
      :model-value="answerStore.answersByStage.translation[question.id] || ''"
      :rows="8"
      placeholder="输入英文译文"
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

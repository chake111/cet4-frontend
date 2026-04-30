<script setup>
import { useExamStore } from '@/stores/exam'
import TextAnswerQuestion from './TextAnswerQuestion.vue'

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
    <TextAnswerQuestion
      v-for="(question, index) in questions"
      :key="question.id"
      :question-no="index + 1"
      :description="question.content?.source"
      :model-value="examStore.answersByStage.translation[question.id] || ''"
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

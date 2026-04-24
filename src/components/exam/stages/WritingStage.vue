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
      <p>{{ question.content?.title }}</p>
      <el-input
        :model-value="examStore.currentAnswers[question.id] || ''"
        type="textarea"
        :rows="10"
        placeholder="请输入作文"
        @update:model-value="updateAnswer(question.id, $event)"
      />
    </article>
  </section>
</template>

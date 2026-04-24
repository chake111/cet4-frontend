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
  examStore.saveAnswer('listening', questionId, value)
}
</script>

<template>
  <section class="stage-wrap">
    <!-- TODO 任务 1.4：ListeningAudio 组件 -->
    <article v-for="question in questions" :key="question.id" class="question-card">
      <h3 class="question-title">{{ question.content?.stem }}</h3>
      <el-radio-group
        :model-value="examStore.answersByStage.listening[question.id] || ''"
        class="option-group"
        @update:model-value="updateAnswer(question.id, $event)"
      >
        <el-radio v-for="option in question.content?.options?.slice(0, 4) || []" :key="option" :value="option">
          {{ option }}
        </el-radio>
      </el-radio-group>
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

.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>

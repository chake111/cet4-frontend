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
  examStore.saveAnswer('reading', questionId, value)
}
</script>

<template>
  <section class="stage-wrap">
    <article v-for="question in questions" :key="question.id" class="question-card">
      <div v-if="question.content?.passage" class="passage-box">
        <h4 class="passage-title">阅读原文</h4>
        <p class="passage-text">{{ question.content.passage }}</p>
      </div>
      <h3 class="question-title">{{ question.content?.stem }}</h3>
      <el-radio-group
        :model-value="examStore.answersByStage.reading[question.id] || ''"
        class="option-group"
        @update:model-value="updateAnswer(question.id, $event)"
      >
        <el-radio v-for="option in question.content?.options || []" :key="option" :value="option">
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

.passage-box {
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
}

.passage-title {
  margin: 0 0 6px;
  font-size: 14px;
  color: #409eff;
}

.passage-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #606266;
  white-space: pre-wrap;
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

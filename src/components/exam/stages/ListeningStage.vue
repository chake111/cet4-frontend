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
    <!-- TODO 任务 1.4：ListeningAudio 组件插槽 -->
    <article v-for="question in questions" :key="question.id" class="question-card">
      <p>{{ question.content?.stem }}</p>
      <el-radio-group
        :model-value="examStore.currentAnswers[question.id] || ''"
        @update:model-value="updateAnswer(question.id, $event)"
      >
        <el-radio
          v-for="option in question.content?.options || []"
          :key="option"
          :value="option.charAt(0)"
        >
          {{ option }}
        </el-radio>
      </el-radio-group>
    </article>
  </section>
</template>

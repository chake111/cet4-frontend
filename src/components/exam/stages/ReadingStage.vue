<script setup>
import { computed } from 'vue'
import { useExamStore } from '@/stores/exam'

const props = defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
})

const examStore = useExamStore()

const tfOptions = ['T', 'F', 'NG']

const normalizedOptions = computed(() =>
  props.questions.map((question) => {
    if (question.subType === 'judge') {
      return tfOptions
    }

    return (question.content?.options || []).map((option) => option.charAt(0))
  }),
)

const optionLabel = (question, option) => {
  if (question.subType === 'judge') {
    if (option === 'T') return 'True'
    if (option === 'F') return 'False'
    return 'Not Given'
  }

  const found = (question.content?.options || []).find((item) => item.startsWith(option))
  return found || option
}

const updateAnswer = (questionId, value) => {
  examStore.saveAnswer('reading', questionId, value)
}
</script>

<template>
  <section class="stage-wrap">
    <article v-for="(question, index) in questions" :key="question.id" class="question-card">
      <p>{{ question.content?.stem }}</p>
      <el-radio-group
        :model-value="examStore.currentAnswers[question.id] || ''"
        @update:model-value="updateAnswer(question.id, $event)"
      >
        <el-radio v-for="option in normalizedOptions[index]" :key="option" :value="option">
          {{ optionLabel(question, option) }}
        </el-radio>
      </el-radio-group>
    </article>
  </section>
</template>

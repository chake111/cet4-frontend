<script setup>
import QuestionOptionList from './QuestionOptionList.vue'

defineProps({
  questions: {
    type: Array,
    default: () => [],
  },
  answers: {
    type: Object,
    default: () => ({}),
  },
  passage: {
    type: String,
    default: '',
  },
})

defineEmits(['update-answer'])
</script>

<template>
  <template v-if="passage">
    <div class="passage-box">
      <p class="passage-text">{{ passage }}</p>
    </div>
  </template>
  <div class="question-list">
    <div v-for="question in questions" :key="question.id" class="question-block">
      <div class="question-no">Q{{ question.questionNo }}</div>
      <QuestionOptionList
        :model-value="answers[question.id] || ''"
        :options="question.content?.options || []"
        @update:model-value="$emit('update-answer', question.id, $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.passage-box {
  max-width: 680px;
  margin: 0 auto 20px;
  padding: 20px 24px;
  border-radius: var(--r-input);
  background: transparent;
  border: none;
  box-shadow: none;
}

.passage-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--c-text-primary);
  white-space: pre-wrap;
}

.question-list {
  display: flex;
  flex-direction: column;
}

.question-block {
  padding: 20px 0;
  border-top: 1px solid var(--c-border);
}

.question-block:first-child {
  padding-top: 0;
  border-top: none;
}

.question-no {
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
  color: var(--c-accent);
}

@media (max-width: 720px) {
  .passage-box {
    max-width: 100%;
    padding: 16px;
  }

  .passage-text {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .passage-box {
    max-width: 100%;
    padding: 12px;
  }

  .passage-text {
    font-size: 13px;
    line-height: 1.7;
  }
}
</style>

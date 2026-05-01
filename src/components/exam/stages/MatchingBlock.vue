<script setup>
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
      <div class="matching-select-row">
        <span class="matching-label">匹配段落：</span>
        <el-input
          :model-value="answers[question.id] || ''"
          placeholder="输入段落字母（如 A、B、C...）"
          clearable
          @update:model-value="$emit('update-answer', question.id, $event)"
        />
      </div>
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

.matching-select-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.matching-label {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--c-text-secondary);
  white-space: nowrap;
}

.matching-select-row .el-input {
  max-width: 240px;
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

  .matching-select-row {
    flex-wrap: wrap;
  }

  .matching-select-row .el-input {
    max-width: 100%;
  }
}
</style>

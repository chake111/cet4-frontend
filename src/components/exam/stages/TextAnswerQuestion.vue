<script setup>
defineProps({
  questionNo: {
    type: [Number, String],
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: '',
  },
  rows: {
    type: Number,
    default: 8,
  },
  placeholder: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <article class="question-card">
    <div class="question-no">Q{{ questionNo }}</div>
    <h3 v-if="title" class="question-title">{{ title }}</h3>
    <p v-if="description" class="question-desc">{{ description }}</p>
    <el-input
      :model-value="modelValue"
      type="textarea"
      :rows="rows"
      :placeholder="placeholder"
      class="answer-textarea"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </article>
</template>

<style scoped>
.question-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-no {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  margin-bottom: 8px;
}

.question-title,
.question-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--c-text-primary);
}

.question-title {
  font-weight: 600;
}

.question-desc {
  white-space: pre-wrap;
}

.answer-textarea :deep(.el-textarea__inner) {
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  box-shadow: none;
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.8;
  padding: 12px;
  resize: vertical;
}

.answer-textarea :deep(.el-textarea__inner:focus) {
  border-color: var(--c-accent);
  box-shadow: none;
}
</style>

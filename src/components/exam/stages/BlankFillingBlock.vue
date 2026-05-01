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
  wordBank: {
    type: Array,
    default: () => [],
  },
  passage: {
    type: String,
    default: '',
  },
})

defineEmits(['update-answer'])

/** 将文章中的 {26} 占位符替换为带编号的空格标记 */
const renderBlankArticle = (article) => {
  if (!article) return ''
  return article.replace(/\{(\d+)\}/g, '____($1)')
}
</script>

<template>
  <!-- 选词填空词库：sticky 定位 -->
  <div v-if="wordBank.length" class="word-bank">
    <span class="word-bank-label">词库：</span>
    <span v-for="(word, wi) in wordBank" :key="wi" class="word-chip">
      {{ word }}
    </span>
  </div>
  <div v-if="passage" class="passage-box">
    <p class="passage-text">{{ renderBlankArticle(passage) }}</p>
  </div>
  <div class="question-list">
    <div v-for="question in questions" :key="question.id" class="question-block">
      <div class="question-no">Q{{ question.questionNo }}</div>
      <div class="blank-input-row">
        <span class="blank-label">第 {{ question.questionNo }} 空：</span>
        <el-input
          :model-value="answers[question.id] || ''"
          placeholder="输入所选单词"
          clearable
          @update:model-value="$emit('update-answer', question.id, $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.word-bank {
  position: sticky;
  top: 64px;
  z-index: 10;
  margin-bottom: 12px;
  padding: 10px 16px;
  border-radius: var(--r-input);
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-height: 160px;
  overflow-y: auto;
}

.word-bank-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
}

.word-chip {
  display: inline-block;
  margin: 4px 6px 4px 0;
  padding: 2px 10px;
  border-radius: var(--r-button);
  background: var(--c-bg-weak);
  border: 1px solid var(--c-border);
  font-size: 13px;
  color: var(--c-text-primary);
  transition: background 0.15s;
}

.word-chip:hover {
  background: var(--c-bg-hover);
}

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

.blank-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blank-label {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--c-text-secondary);
  white-space: nowrap;
}

.blank-input-row .el-input {
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

  .word-bank {
    top: 60px;
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

  .word-bank {
    top: 48px;
    padding: 8px 12px;
    max-height: 120px;
  }

  .word-chip {
    font-size: 12px;
    padding: 2px 8px;
  }

  .blank-input-row {
    flex-wrap: wrap;
  }

  .blank-input-row .el-input {
    max-width: 100%;
  }
}
</style>

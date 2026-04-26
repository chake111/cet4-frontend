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

const updateAnswer = (questionId, value) => {
  examStore.saveAnswer('reading', questionId, value)
}

/**
 * 按题型分组：同一组题共享 passage，按 passageGroupId 聚合。
 * blank_filling 整组只渲染一次文章+词库，matching 整组只渲染一次文章+所有题目。
 * single_choice 每组渲染一次文章+该组所有题目。
 */
const groupedQuestions = computed(() => {
  const groups = []
  let currentGroup = null

  for (const q of props.questions) {
    const gid = q.passageGroupId
    if (!currentGroup || currentGroup.groupId !== gid) {
      currentGroup = {
        groupId: gid,
        type: q.content?.type || 'single_choice',
        passage: q.content?.passage || '',
        wordBank: q.content?.wordBank || [],
        questions: [],
      }
      groups.push(currentGroup)
    }
    currentGroup.questions.push(q)
  }
  return groups
})

/** 选词填空：将文章中的 {26} 占位符替换为带编号的空格标记 */
function renderBlankArticle(article) {
  if (!article) return ''
  return article.replace(/\{(\d+)\}/g, '____($1)')
}
</script>

<template>
  <section class="stage-wrap">
    <div v-for="group in groupedQuestions" :key="group.groupId" class="question-group">
      <!-- 文章区域：每组只显示一次 -->
      <div v-if="group.passage" class="passage-box">
        <div class="passage-label">阅读原文</div>
        <!-- 选词填空：显示词库 + 带空位的文章 -->
        <template v-if="group.type === 'blank_filling'">
          <div v-if="group.wordBank.length" class="word-bank">
            <span class="word-bank-label">词库：</span>
            <span v-for="(word, wi) in group.wordBank" :key="wi" class="word-chip">
              {{ word }}
            </span>
          </div>
          <p class="passage-text">{{ renderBlankArticle(group.passage) }}</p>
        </template>
        <!-- 匹配题 / 单选题：直接显示文章 -->
        <template v-else>
          <p class="passage-text">{{ group.passage }}</p>
        </template>
      </div>

      <!-- 题目区域 -->
      <article
        v-for="question in group.questions"
        :key="question.id"
        class="question-card"
      >
        <div class="question-no">Q{{ question.questionNo }}</div>
        <div class="question-stem">{{ question.content?.stem }}</div>

        <!-- 单选题 -->
        <el-radio-group
          v-if="group.type === 'single_choice'"
          :model-value="examStore.answersByStage.reading[question.id] || ''"
          class="option-group"
          @update:model-value="updateAnswer(question.id, $event)"
        >
          <label
            v-for="(option, oi) in question.content?.options || []"
            :key="oi"
            class="option-item"
            :class="{ 'option-item--active': examStore.answersByStage.reading[question.id] === String.fromCharCode(65 + oi) }"
            @click="updateAnswer(question.id, String.fromCharCode(65 + oi))"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + oi) }}</span>
            <span class="option-text">{{ option }}</span>
          </label>
        </el-radio-group>

        <!-- 选词填空：输入框 -->
        <div v-else-if="group.type === 'blank_filling'" class="blank-input-row">
          <span class="blank-label">第 {{ question.questionNo }} 空：</span>
          <el-input
            :model-value="examStore.answersByStage.reading[question.id] || ''"
            placeholder="输入所选单词"
            clearable
            @update:model-value="updateAnswer(question.id, $event)"
          />
        </div>

        <!-- 匹配题：下拉选择段落编号 -->
        <div v-else-if="group.type === 'matching'" class="matching-select-row">
          <span class="matching-label">匹配段落：</span>
          <el-input
            :model-value="examStore.answersByStage.reading[question.id] || ''"
            placeholder="输入段落字母（如 A、B、C...）"
            clearable
            @update:model-value="updateAnswer(question.id, $event)"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.stage-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.question-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 文章区域 */
.passage-box {
  padding: 20px;
  border-radius: var(--r-card);
  background: var(--c-bg-weak);
  border: 1px solid var(--c-border);
  margin-bottom: 20px;
}

.passage-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  margin-bottom: 8px;
}

.passage-text {
  margin: 0;
  font-size: 14px;
  line-height: 2;
  color: var(--c-text-primary);
  white-space: pre-wrap;
}

.word-bank {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: var(--r-input);
  background: var(--c-bg);
  border: 1px solid var(--c-border);
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
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  font-size: 13px;
  color: var(--c-text-primary);
}

/* 题号 */
.question-no {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-accent);
  margin-bottom: 4px;
}

.question-stem {
  font-size: 14px;
  line-height: 1.8;
  color: var(--c-text-primary);
}

/* 选项 */
.option-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  padding: 10px 14px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-input);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 14px;
  line-height: 1.5;
  color: var(--c-text-primary);
}

.option-item:hover {
  border-color: var(--c-accent);
  background: rgba(37, 99, 235, 0.04);
}

.option-item--active {
  border-color: var(--c-accent);
  background: rgba(37, 99, 235, 0.06);
  color: var(--c-accent);
}

.option-letter {
  font-weight: 600;
  margin-right: 8px;
  flex-shrink: 0;
}

.option-text {
  line-height: 1.5;
}

.blank-input-row,
.matching-select-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blank-label,
.matching-label {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--c-text-secondary);
  white-space: nowrap;
}

.blank-input-row .el-input,
.matching-select-row .el-input {
  max-width: 240px;
}
</style>

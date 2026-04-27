<script setup>
import { computed } from 'vue'
import { useExamStore, buildSessionGroups, buildSectionGroups } from '@/stores/exam'

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
 * 按 sessionId 分组，再按 section 聚合。
 */
const sessionGroups = computed(() => buildSessionGroups(props.questions, 'reading'))

const sectionGroups = computed(() => buildSectionGroups(sessionGroups.value))

/** 选词填空：将文章中的 {26} 占位符替换为带编号的空格标记 */
function renderBlankArticle(article) {
  if (!article) return ''
  return article.replace(/\{(\d+)\}/g, '____($1)')
}
</script>

<template>
  <section class="stage-wrap">
    <div v-if="questions.length === 0" class="empty-state">
      <el-empty description="暂无阅读题目" />
    </div>

    <template v-else>
      <section
        v-for="section in sectionGroups"
        :key="section.sectionLabel"
        class="exam-section"
      >
        <h2 class="section-title">{{ section.sectionLabel }} — {{ section.sectionTitle }}</h2>

        <div
          v-for="session in section.sessions"
          :key="session.sessionId"
          class="session-card"
        >
          <div class="session-header">
            <div class="session-title">{{ session.sessionTitle }}</div>
            <div class="session-meta">{{ session.questions.length }} questions</div>
          </div>

          <!-- 文章区域：每个 session 只显示一次 -->
          <div v-if="session.questions[0]?.content?.passage" class="passage-box">
            <!-- 选词填空：显示词库 + 带空位的文章 -->
            <template v-if="session.questions[0]?.content?.type === 'blank_filling'">
              <div v-if="session.questions[0]?.content?.wordBank?.length" class="word-bank">
                <span class="word-bank-label">词库：</span>
                <span v-for="(word, wi) in session.questions[0].content.wordBank" :key="wi" class="word-chip">
                  {{ word }}
                </span>
              </div>
              <p class="passage-text">{{ renderBlankArticle(session.questions[0].content.passage) }}</p>
            </template>
            <!-- 匹配题 / 单选题：直接显示文章 -->
            <template v-else>
              <p class="passage-text">{{ session.questions[0].content.passage }}</p>
            </template>
          </div>

          <!-- 题目列表 -->
          <div class="question-list">
            <div
              v-for="question in session.questions"
              :key="question.id"
              class="question-block"
            >
              <div class="question-no">Q{{ question.questionNo }}</div>

              <!-- 单选题 -->
              <div v-if="question.content?.type === 'single_choice'" class="option-list">
                <div
                  v-for="(option, oi) in question.content?.options || []"
                  :key="oi"
                  class="option-item"
                  :class="{ 'option-selected': examStore.answersByStage.reading[question.id] === String.fromCharCode(65 + oi) }"
                  @click="updateAnswer(question.id, String.fromCharCode(65 + oi))"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + oi) }}</span>
                  <span class="option-text">{{ option }}</span>
                </div>
              </div>

              <!-- 选词填空：输入框 -->
              <div v-else-if="question.content?.type === 'blank_filling'" class="blank-input-row">
                <span class="blank-label">第 {{ question.questionNo }} 空：</span>
                <el-input
                  :model-value="examStore.answersByStage.reading[question.id] || ''"
                  placeholder="输入所选单词"
                  clearable
                  @update:model-value="updateAnswer(question.id, $event)"
                />
              </div>

              <!-- 匹配题：输入段落字母 -->
              <div v-else-if="question.content?.type === 'matching'" class="matching-select-row">
                <span class="matching-label">匹配段落：</span>
                <el-input
                  :model-value="examStore.answersByStage.reading[question.id] || ''"
                  placeholder="输入段落字母（如 A、B、C...）"
                  clearable
                  @update:model-value="updateAnswer(question.id, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.stage-wrap {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

/* Section 分组 */
.exam-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  margin: 0 0 2px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  color: var(--c-accent);
}

/* Session 卡片 */
.session-card {
  background: #FFFFFF;
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  padding: 24px 30px;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.session-title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.session-meta {
  font-size: 13px;
  line-height: 20px;
  color: var(--c-text-secondary);
}

/* 文章区域 */
.passage-box {
  padding: 20px;
  border-radius: var(--r-input);
  background: var(--c-bg-weak);
  margin-bottom: 20px;
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

/* 题目列表 */
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

/* 选项 */
.option-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--c-text-primary);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: var(--r-input);
  transition: background-color 0.15s;
}

.option-item:hover {
  background-color: var(--c-bg-hover);
}

.option-item.option-selected {
  background-color: rgba(37, 99, 235, 0.06);
  border: 1px solid var(--c-accent);
}

.option-label {
  width: 24px;
  flex: 0 0 24px;
  font-weight: 700;
  color: var(--c-text-primary);
}

.option-text {
  flex: 1;
}

/* 填空 / 匹配 */
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

<script setup>
import { normalizeAnswer, UNANSWERED_TEXT, getScoreText } from '@/domain/exam'
import AiFeedbackPanel from './AiFeedbackPanel.vue'

defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
})
</script>

<template>
  <div class="detail-list">
    <section v-for="group in groups" :key="group.stage" class="detail-section">
      <h3 class="detail-section-title">{{ group.label }}</h3>

      <div v-for="session in group.sessions" :key="session.sessionId" class="session-card">
        <div v-if="session.sessionTitle" class="session-header">
          <span class="session-title">{{ session.sessionTitle }}</span>
          <span class="session-meta">{{ session.questions.length }} 题</span>
        </div>

        <div class="session-question-list">
          <div class="session-question-header">
            <span class="sq-col sq-col-no">题号</span>
            <span class="sq-col sq-col-my">我的答案</span>
            <span class="sq-col sq-col-correct">正确答案</span>
            <span class="sq-col sq-col-score">得分</span>
            <span class="sq-col sq-col-status">状态</span>
          </div>

          <div
            v-for="question in session.questions"
            :key="question.questionId"
            class="session-question-row"
            :class="{
              'row-wrong': question.correct === false,
              'row-unanswered': normalizeAnswer(question.userAnswer) === UNANSWERED_TEXT,
            }"
          >
            <span class="sq-col sq-col-no">Q{{ question.questionNo }}</span>
            <span
              class="sq-col sq-col-my"
              :class="{
                'text-danger': question.correct === false,
                'text-tertiary': normalizeAnswer(question.userAnswer) === UNANSWERED_TEXT,
              }"
            >
              {{ normalizeAnswer(question.userAnswer) }}
            </span>
            <span class="sq-col sq-col-correct">{{ normalizeAnswer(question.correctAnswer) }}</span>
            <span class="sq-col sq-col-score">{{ getScoreText(question) }}</span>
            <span class="sq-col sq-col-status">
              <span v-if="question.correct === true" class="status-tag tag-correct">正确</span>
              <span v-else-if="question.correct === false" class="status-tag tag-wrong">错误</span>
              <span v-else class="status-tag tag-unanswered">未作答</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="group.subjectiveQuestions.length > 0" class="subjective-list">
        <div
          v-for="question in group.subjectiveQuestions"
          :key="question.questionId"
          class="question-item"
        >
          <div class="question-header">
            <span class="question-no">Q{{ question.questionNo }}</span>
          </div>

          <div class="question-row subjective-row">
            <span class="row-label">我的答案</span>
            <div class="subjective-content">{{ normalizeAnswer(question.userAnswer) }}</div>
          </div>

          <AiFeedbackPanel :feedback="question.aiFeedback" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.detail-list {
  display: grid;
  gap: 32px;
}

.detail-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-primary);
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.session-card {
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--r-card);
  margin-bottom: 16px;
  overflow: hidden;
}

.session-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg-weak);
}

.session-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-primary);
}

.session-meta {
  font-size: 12px;
  color: var(--c-text-tertiary);
}

.session-question-header,
.session-question-row {
  display: grid;
  grid-template-columns: 56px 1fr 1fr 80px 72px;
  align-items: center;
  padding: 0 16px;
  min-width: 480px;
}

.session-question-header {
  background: var(--c-bg-weak);
  font-size: 12px;
  color: var(--c-text-tertiary);
  line-height: 32px;
  font-weight: 500;
  border-bottom: 1px solid var(--c-border);
}

.session-question-row {
  font-size: 13px;
  color: var(--c-text-primary);
  line-height: 40px;
  border-bottom: 1px solid var(--c-border);
  transition: background 0.15s;
}

.session-question-row:last-child {
  border-bottom: none;
}

.session-question-row.row-wrong {
  background: #fef2f2;
}

.session-question-row.row-unanswered {
  background: #f9fafb;
}

.sq-col-no {
  font-weight: 600;
  color: #6b7280;
}

.sq-col-my,
.sq-col-correct {
  word-break: break-all;
  padding-right: 8px;
}

.sq-col-correct {
  font-weight: 500;
}

.sq-col-score {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #6b7280;
}

.sq-col-status {
  text-align: center;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
}

.tag-correct {
  background: #f0fdf4;
  color: #16a34a;
}

.tag-wrong {
  background: #fef2f2;
  color: #dc2626;
}

.tag-unanswered {
  background: #f3f4f6;
  color: #6b7280;
}

.subjective-list {
  display: grid;
  gap: 0;
}

.question-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--c-border);
}

.question-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.question-no {
  font-weight: 600;
  color: #6b7280;
}

.question-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
  line-height: 1.7;
  font-size: 14px;
}

.row-label {
  flex-shrink: 0;
  width: 72px;
  color: var(--c-text-tertiary);
  font-size: 13px;
}

.subjective-content {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--c-text-primary);
  flex: 1;
  max-width: 100%;
  overflow-wrap: break-word;
  font-size: 14px;
  line-height: 1.7;
}

.text-danger {
  color: var(--c-danger);
  font-weight: 600;
}

.text-tertiary {
  color: var(--c-text-tertiary);
}

@media (max-width: 768px) {
  .session-question-header,
  .session-question-row {
    padding: 0 10px;
  }
}

@media (max-width: 480px) {
  .session-question-header,
  .session-question-row {
    padding: 0 8px;
    font-size: 12px;
  }
}
</style>

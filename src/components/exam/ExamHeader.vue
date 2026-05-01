<script setup>
import { computed } from 'vue'
import { useExamSessionStore } from '@/stores/examSession'
import { useExamAnswerStore } from '@/stores/examAnswer'
import { EXAM_TITLE, STAGE_LIST, STAGE_ORDER } from '@/constants/exam'
import { useExamTimer } from '@/composables/useExamTimer'

const sessionStore = useExamSessionStore()
const answerStore = useExamAnswerStore()

const isStageDone = (idx) => {
  const currentIdx = STAGE_ORDER.indexOf(sessionStore.currentStage)
  return idx < currentIdx
}

const isStageActive = (stageKey) => stageKey === sessionStore.currentStage

// #4: 计算当前阶段答题进度
const answeredProgress = computed(() => {
  const questions = sessionStore.currentQuestions
  const answers = answerStore.currentAnswers
  if (!questions || questions.length === 0) return { answered: 0, total: 0 }

  const answered = questions.filter((q) => {
    const answer = answers[q.id]
    return answer !== undefined && answer !== null && answer !== ''
  }).length

  return { answered, total: questions.length }
})

const { timeText, isDanger } = useExamTimer(sessionStore)
</script>

<template>
  <header class="exam-header">
    <div class="header-left">
      <span class="brand">{{ EXAM_TITLE }}</span>
    </div>

    <!-- #5: 步骤进度条 -->
    <div class="header-center">
      <div class="step-progress">
        <template v-for="(stage, idx) in STAGE_LIST" :key="stage.key">
          <div
            class="step-item"
            :class="{
              active: isStageActive(stage.key),
              done: isStageDone(idx),
            }"
          >
            <div class="step-circle">
              <span v-if="isStageDone(idx)" class="step-check">✓</span>
              <span v-else class="step-number">{{ idx + 1 }}</span>
            </div>
            <span class="step-label">{{ stage.label }}</span>
          </div>
          <div
            v-if="idx < STAGE_LIST.length - 1"
            class="step-connector"
            :class="{ done: isStageDone(idx) }"
          ></div>
        </template>
      </div>
    </div>

    <div class="header-right">
      <!-- #4: 答题进度 -->
      <span v-if="answeredProgress.total > 0" class="progress-badge">
        已答 {{ answeredProgress.answered }}/{{ answeredProgress.total }}
      </span>

      <!-- #11: 倒计时 + 危险提示 -->
      <span class="timer" :class="{ danger: isDanger }">{{ timeText }}</span>
      <span v-if="isDanger" class="danger-warning">⚠ 剩余不足5分钟</span>
    </div>
  </header>
</template>

<style scoped>
.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: var(--c-primary);
  color: #ffffff;
  border-bottom: none;
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.brand {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* ── #5: 步骤进度条 ── */
.header-center {
  display: flex;
  align-items: center;
}

.step-progress {
  display: flex;
  align-items: flex-start;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: default;
  user-select: none;
}

.step-circle {
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  box-sizing: border-box;
}

.step-number {
  line-height: 1;
}

.step-check {
  line-height: 1;
  font-size: 13px;
}

.step-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  transition: all 0.3s;
}

/* 当前阶段：高亮 */
.step-item.active .step-circle {
  background: #ffffff;
  border-color: #ffffff;
  color: var(--c-primary);
}

.step-item.active .step-label {
  color: #ffffff;
  font-weight: 600;
}

/* 已完成阶段：绿色 + 勾号 */
.step-item.done .step-circle {
  background: #67c23a;
  border-color: #67c23a;
  color: #ffffff;
}

.step-item.done .step-label {
  color: rgba(255, 255, 255, 0.7);
}

/* 阶段连接线 */
.step-connector {
  width: 28px;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  margin-top: 11px;
  margin-left: 4px;
  margin-right: 4px;
  border-radius: 1px;
  transition: background 0.3s;
  flex-shrink: 0;
}

.step-connector.done {
  background: #67c23a;
}

/* ── 右侧区域 ── */
.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* #4: 答题进度徽标 */
.progress-badge {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.12);
  padding: 2px 10px;
  border-radius: 10px;
  white-space: nowrap;
}

/* 倒计时 */
.timer {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #ffffff;
  letter-spacing: 0.05em;
}

/* #11: 危险状态 — 温和脉冲代替快速闪烁 */
.timer.danger {
  color: var(--c-danger);
  animation: timer-breathe 2s ease-in-out infinite;
}

@keyframes timer-breathe {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.75;
  }
}

/* #11: 危险文字提示 */
.danger-warning {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-danger);
  white-space: nowrap;
  animation: timer-breathe 2s ease-in-out infinite;
}

/* #12: 移动端适配 */
@media (max-width: 480px) {
  .exam-header {
    flex-wrap: wrap;
    height: auto;
    padding: 8px 12px;
    gap: 6px;
  }

  /* 第一行：品牌 + 倒计时/进度 */
  .header-left {
    order: 1;
  }

  .header-right {
    order: 2;
    margin-left: auto;
    gap: 8px;
  }

  .brand {
    font-size: 13px;
  }

  /* 第二行：步骤进度条（紧凑模式，只显示圆点不显示文字标签） */
  .header-center {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .step-progress {
    gap: 0;
  }

  .step-label {
    display: none;
  }

  .step-connector {
    width: 20px;
    margin-left: 2px;
    margin-right: 2px;
  }

  .step-circle {
    width: 22px;
    height: 22px;
    min-width: 22px;
    font-size: 11px;
  }

  .step-connector {
    margin-top: 10px;
  }

  .progress-badge {
    font-size: 12px;
    padding: 2px 8px;
  }

  .timer {
    font-size: 14px;
  }

  .danger-warning {
    font-size: 11px;
  }
}
</style>

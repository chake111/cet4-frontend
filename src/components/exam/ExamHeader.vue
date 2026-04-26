<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useExamStore } from '@/stores/exam'

const examStore = useExamStore()

const rerenderTick = ref(0)
let intervalId = null

const STAGE_LABEL_MAP = {
  writing: '写作',
  listening: '听力',
  reading: '阅读',
  translation: '翻译',
}

const STAGE_ORDER = ['writing', 'listening', 'reading', 'translation']

const stageList = [
  { key: 'writing', label: '写作' },
  { key: 'listening', label: '听力' },
  { key: 'reading', label: '阅读' },
  { key: 'translation', label: '翻译' },
]

const stageLabel = computed(() => STAGE_LABEL_MAP[examStore.currentStage] || '--')

const isStageDone = (idx) => {
  const currentIdx = STAGE_ORDER.indexOf(examStore.currentStage)
  return idx < currentIdx
}

const remainingSeconds = computed(() => {
  rerenderTick.value // 依赖 tick，确保每秒重算
  if (!examStore.stageStartedAt || !examStore.stageDuration) return 0
  const elapsed = Math.floor((Date.now() - examStore.stageStartedAt) / 1000)
  return Math.max(0, examStore.stageDuration - elapsed)
})


const timeText = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const isDanger = computed(() => remainingSeconds.value <= 300)

onMounted(() => {
  intervalId = setInterval(() => {
    rerenderTick.value += 1
  }, 1000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
})
</script>

<template>
  <header class="exam-header">
    <div class="header-left">
      <span class="brand">CET-4 模拟考试</span>
    </div>
    <div class="header-center">
      <span
        v-for="(stage, idx) in stageList"
        :key="stage.key"
        class="stage-step"
        :class="{ active: stage.key === examStore.currentStage, done: isStageDone(idx) }"
      >
        {{ stage.label }}
      </span>
    </div>
    <div class="header-right">
      <span class="timer" :class="{ danger: isDanger }">{{ timeText }}</span>
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
  color: #FFFFFF;
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

.stage-divider {
  color: rgba(255, 255, 255, 0.3);
}

.stage-name {
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
}

.header-center {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stage-step {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s;
}

.stage-step.active {
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  font-weight: 500;
}

.stage-step.done {
  color: rgba(255, 255, 255, 0.7);
}

.header-right {
  flex-shrink: 0;
}

.timer {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #FFFFFF;
  letter-spacing: 0.05em;
}

.timer.danger {
  color: var(--c-danger);
  animation: timer-pulse 1s ease-in-out infinite;
}

@keyframes timer-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>

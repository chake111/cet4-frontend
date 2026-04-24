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

const stageLabel = computed(() => STAGE_LABEL_MAP[examStore.currentStage] || '--')

const remainingSeconds = computed(() => {
  // 通过依赖本地 tick，确保每秒触发一次重新计算。
  rerenderTick.value
  return examStore.remainingSeconds
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
    <span class="stage-name">{{ stageLabel }}</span>
    <span class="timer" :class="{ danger: isDanger }">{{ timeText }}</span>
  </header>
</template>

<style scoped>
.exam-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.stage-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.timer {
  font-variant-numeric: tabular-nums;
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.timer.danger {
  color: #f56c6c;
}
</style>

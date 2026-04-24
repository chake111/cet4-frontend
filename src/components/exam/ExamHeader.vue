<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useExamStore } from '@/stores/exam'

const examStore = useExamStore()
const tick = ref(0)
let timer = null

const stageLabelMap = {
  writing: '写作',
  listening: '听力',
  reading: '阅读',
  translation: '翻译',
}

const stageLabel = computed(() => stageLabelMap[examStore.currentStage] || '--')

const remainingSeconds = computed(() => {
  tick.value
  return examStore.remainingSeconds
})

const remainText = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const isWarning = computed(() => remainingSeconds.value <= 300)

onMounted(() => {
  timer = setInterval(() => {
    tick.value += 1
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <header class="exam-header">
    <h2>{{ stageLabel }}阶段</h2>
    <div class="exam-timer" :class="{ warning: isWarning }">剩余 {{ remainText }}</div>
  </header>
</template>

<style scoped>
.exam-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.exam-timer {
  font-weight: 600;
  color: #303133;
}

.exam-timer.warning {
  color: #f56c6c;
}
</style>

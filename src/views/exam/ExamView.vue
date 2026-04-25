<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import WritingStage from '@/components/exam/stages/WritingStage.vue'
import ListeningStage from '@/components/exam/stages/ListeningStage.vue'
import ReadingStage from '@/components/exam/stages/ReadingStage.vue'
import TranslationStage from '@/components/exam/stages/TranslationStage.vue'
import { useExamStore, STAGE_DURATIONS } from '@/stores/exam'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()

const STAGE_ORDER = ['writing', 'listening', 'reading', 'translation']

const stageComponentMap = {
  writing: WritingStage,
  listening: ListeningStage,
  reading: ReadingStage,
  translation: TranslationStage,
}

const tick = ref(0)
const isAutoSwitching = ref(false)
let timer = null

const currentStageComponent = computed(() => stageComponentMap[examStore.currentStage] || WritingStage)

const isLastStage = computed(() => examStore.currentStage === STAGE_ORDER[STAGE_ORDER.length - 1])

const nextButtonText = computed(() => (isLastStage.value ? '提交' : '下一阶段'))

const currentQuestions = computed(() => {
  tick.value
  const stage = examStore.currentStage
  if (!stage) return []
  return examStore.questionsByStage[stage] || []
})

const goToNextStage = () => {
  examStore.advanceStage()
}

const submitExamAndExit = async () => {
  const result = await examStore.submitExam()
  const recordId = result?.data?.recordId
  await router.push('/exam/record/' + recordId + '/result')
}

const handleAutoSwitch = async () => {
  if (!examStore.hasActiveExam || examStore.remainingSeconds > 0 || isAutoSwitching.value) {
    return
  }

  isAutoSwitching.value = true
  try {
    if (isLastStage.value) {
      await submitExamAndExit()
      return
    }

    goToNextStage()
  } finally {
    isAutoSwitching.value = false
  }
}

const handleNext = async () => {
  if (isLastStage.value) {
    await submitExamAndExit()
    return
  }

  goToNextStage()
}

onMounted(async () => {
  await examStore.startExam(route.params.id)

  timer = setInterval(async () => {
    tick.value += 1
    await handleAutoSwitch()
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  // TODO: 任务 1.3 恢复离开页面时的答题草稿上报 API
})
</script>

<template>
  <div class="exam-view">
    <ExamHeader class="exam-header-fixed" />

    <main class="exam-body">
      <component :is="currentStageComponent" :questions="currentQuestions" />
    </main>

    <footer class="exam-footer">
      <el-button type="primary" @click="handleNext">{{ nextButtonText }}</el-button>
    </footer>
  </div>
</template>

<style scoped>
.exam-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.exam-header-fixed {
  position: sticky;
  top: 0;
  z-index: 20;
}

.exam-body {
  max-width: 980px;
  margin: 20px auto;
  padding: 0 20px;
}

.exam-footer {
  display: flex;
  justify-content: center;
  padding: 20px;
}

:deep(.stage-wrap) {
  display: grid;
  gap: 16px;
}

:deep(.question-card) {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}
</style>

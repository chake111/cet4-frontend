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

const nextButtonText = computed(() => (isLastStage.value ? '交卷' : '下一阶段'))

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

    <div class="exam-content">
      <main class="exam-body">
        <component :is="currentStageComponent" :questions="currentQuestions" />
      </main>

      <footer class="exam-footer">
        <el-button type="primary" size="default" @click="handleNext">{{ nextButtonText }}</el-button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.exam-view {
  min-height: 100vh;
  background: var(--c-bg-weak);
}

.exam-header-fixed {
  position: sticky;
  top: 0;
  z-index: 20;
}

.exam-content {
  max-width: 920px;
  margin: 0 auto;
  padding: 24px 20px;
}

.exam-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 0;
  border-top: 1px solid var(--c-border);
  margin-top: 24px;
}

:deep(.question-card) {
  background: var(--c-bg);
  border-radius: var(--r-card);
  padding: 20px;
  border: 1px solid var(--c-border);
}

:deep(.el-button--primary) {
  background-color: var(--c-accent);
  border-color: var(--c-accent);
}

:deep(.el-button--primary:hover) {
  background-color: var(--c-accent);
  border-color: var(--c-accent);
  opacity: 0.9;
}
</style>

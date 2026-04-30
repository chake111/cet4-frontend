<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ExamHeader from '@/components/exam/ExamHeader.vue'
import WritingStage from '@/components/exam/stages/WritingStage.vue'
import ListeningStage from '@/components/exam/stages/ListeningStage.vue'
import ReadingStage from '@/components/exam/stages/ReadingStage.vue'
import TranslationStage from '@/components/exam/stages/TranslationStage.vue'
import { useExamStore } from '@/stores/exam'
import { STAGE_ORDER } from '@/constants/exam'
import { useExamTimer } from '@/composables/useExamTimer'

const route = useRoute()
const router = useRouter()
const examStore = useExamStore()

const stageComponentMap = {
  writing: WritingStage,
  listening: ListeningStage,
  reading: ReadingStage,
  translation: TranslationStage,
}

const isAutoSwitching = ref(false)
const submitting = ref(false)
const autoSubmitFailed = ref(false)
const { start: startTimer, stop: stopTimer } = useExamTimer(examStore, { autoStart: false })

const currentStageComponent = computed(() => stageComponentMap[examStore.currentStage] || WritingStage)

const isLastStage = computed(() => examStore.currentStage === STAGE_ORDER[STAGE_ORDER.length - 1])

const nextButtonText = computed(() => {
  if (submitting.value) return '提交中...'
  return isLastStage.value ? '交卷' : '下一阶段'
})

const currentQuestions = computed(() => {
  const stage = examStore.currentStage
  if (!stage) return []
  return examStore.questionsByStage[stage] || []
})

const goToNextStage = () => {
  examStore.advanceStage()
}

const submitExamAndExit = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    const result = await examStore.submitExam()
    const recordId = result?.data?.recordId
    await router.push('/exam/record/' + recordId + '/result')
  } catch (error) {
    ElMessage.error('提交失败，请重试')
    throw error
  } finally {
    submitting.value = false
  }
}

const handleAutoSwitch = async () => {
  if (!examStore.hasActiveExam || examStore.remainingSeconds > 0 || isAutoSwitching.value || submitting.value || autoSubmitFailed.value) {
    return
  }

  isAutoSwitching.value = true
  try {
    if (isLastStage.value) {
      try {
        await submitExamAndExit()
      } catch {
        autoSubmitFailed.value = true
      }
      return
    }

    goToNextStage()
  } finally {
    isAutoSwitching.value = false
  }
}

const handleNext = async () => {
  if (submitting.value) return
  if (isLastStage.value) {
    try {
      await submitExamAndExit()
    } catch {
      // 提交失败提示已在 submitExamAndExit 中处理，此处仅阻止异常冒泡
    }
    return
  }

  goToNextStage()
}

onMounted(async () => {
  await examStore.startExam(route.params.id)
  startTimer(handleAutoSwitch)
})

onUnmounted(() => {
  stopTimer()

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
        <el-button type="primary" size="default" :loading="submitting" @click="handleNext">{{ nextButtonText }}</el-button>
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

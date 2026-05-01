import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useExamSessionStore } from '@/stores/examSession'
import { useExamAnswerStore } from '@/stores/examAnswer'
import { useExamTimer } from '@/composables/useExamTimer'

/**
 * 考试流程控制 composable。
 * 封装开始考试、提交试卷、自动切换阶段等流程逻辑，
 * 使 ExamView 仅负责组合各子组件。
 */
export function useExamFlow() {
  const router = useRouter()
  const sessionStore = useExamSessionStore()
  const answerStore = useExamAnswerStore()

  const isAutoSwitching = ref(false)
  const submitting = ref(false)
  const autoSubmitFailed = ref(false)

  const {
    start: startTimer,
    stop: stopTimer,
    remainingSeconds,
  } = useExamTimer(sessionStore, {
    autoStart: false,
  })

  const isLastStage = computed(() => sessionStore.isLastStage)

  // 草稿保存错误提示
  watch(
    () => answerStore.draftSaveError,
    (error) => {
      if (error) {
        ElMessage.warning('答案草稿保存失败，请检查网络连接')
      }
    }
  )

  const goToNextStage = () => {
    sessionStore.advanceStage()
  }

  /** 聚合所有阶段的答案 */
  const aggregateAllAnswers = () => {
    return Object.values(answerStore.answersByStage).reduce(
      (acc, stageAnswers) => ({ ...acc, ...stageAnswers }),
      {}
    )
  }

  const submitExamAndExit = async () => {
    if (submitting.value) return
    submitting.value = true
    try {
      const allAnswers = aggregateAllAnswers()
      const result = await sessionStore.submitExam(allAnswers)
      const recordId = result?.data?.recordId
      await router.push('/exam/record/' + recordId + '/result')
    } catch (error) {
      ElMessage.error('提交失败，请重试')
      throw error
    } finally {
      submitting.value = false
    }
  }

  const handleSubmit = async () => {
    if (submitting.value) return
    try {
      await submitExamAndExit()
    } catch {
      // 提交失败提示已在 submitExamAndExit 中处理，此处仅阻止异常冒泡
    }
  }

  const handleAutoSwitch = async () => {
    if (
      !sessionStore.hasActiveExam ||
      remainingSeconds.value > 0 ||
      isAutoSwitching.value ||
      submitting.value ||
      autoSubmitFailed.value
    ) {
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

  const startExam = async (paperId) => {
    await sessionStore.startExam(paperId)
    startTimer(handleAutoSwitch)
  }

  const stopExam = () => {
    stopTimer()
  }

  return {
    submitting,
    isLastStage,
    startExam,
    stopExam,
    goToNextStage,
    handleSubmit,
    submitExamAndExit,
  }
}

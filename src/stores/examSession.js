import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { STAGE_DURATIONS, STAGE_ORDER } from '@/domain/exam'
import { examService } from '@/services/examService'
import {
  propagateListeningSessions,
  propagateReadingPassages,
  transformQuestion,
} from '@/domain/exam'

/**
 * 将原始题目数据按阶段规范化转换。
 */
const normalizeQuestionsByStage = (questionsByStage = {}) => ({
  writing: (questionsByStage.writing || []).map((q) => transformQuestion(q, 'writing')),
  listening: propagateListeningSessions(
    (questionsByStage.listening || []).map((q) => transformQuestion(q, 'listening'))
  ),
  reading: propagateReadingPassages(
    (questionsByStage.reading || []).map((q) => transformQuestion(q, 'reading'))
  ),
  translation: (questionsByStage.translation || []).map((q) => transformQuestion(q, 'translation')),
})

export const useExamSessionStore = defineStore(
  'examSession',
  () => {
    // ── State ──
    const examId = ref(null)
    const questionsByStage = ref({
      writing: [],
      listening: [],
      reading: [],
      translation: [],
    })
    const currentStage = ref(null)
    const stageStartedAt = ref(null)
    const isLoading = ref(false)
    const isSubmitted = ref(false)

    // ── Getters ──
    /** 当前阶段的题目列表 */
    const currentQuestions = computed(() => {
      if (!currentStage.value) return []
      return questionsByStage.value[currentStage.value] || []
    })

    /** 是否有进行中的考试 */
    const hasActiveExam = computed(() => examId.value !== null && !isSubmitted.value)

    /** 阶段顺序 */
    const stageOrder = computed(() => STAGE_ORDER)

    /** 是否最后阶段 */
    const isLastStage = computed(() => currentStage.value === STAGE_ORDER[STAGE_ORDER.length - 1])

    /** 当前阶段时长（从 currentStage 派生，无需持久化） */
    const stageDuration = computed(() => {
      if (!currentStage.value) return 0
      return STAGE_DURATIONS[currentStage.value] || 0
    })

    // ── Actions ──
    /** 开始新考试 */
    const startExam = async (paperId) => {
      isLoading.value = true
      try {
        const response = await examService.startExam(paperId)
        const {
          questionsByStage: rawQuestions = {},
          startedAt,
          paperId: returnedPaperId,
        } = response.data || {}

        examId.value = returnedPaperId || paperId
        questionsByStage.value = normalizeQuestionsByStage(rawQuestions)
        stageStartedAt.value = startedAt ? new Date(startedAt).getTime() : Date.now()
        currentStage.value = 'writing'
        isSubmitted.value = false
      } finally {
        isLoading.value = false
      }
    }

    /** 恢复考试状态（利用持久化数据实现真正的恢复） */
    const resumeExam = async () => {
      // 如果有持久化的完整数据，直接恢复
      if (examId.value && currentStage.value) {
        isSubmitted.value = false
        isLoading.value = false
        return
      }

      // 没有持久化数据，无法恢复
      isLoading.value = true
      try {
        // TODO: 当后端支持恢复考试 API 时，在此处调用
      } finally {
        isLoading.value = false
      }
    }

    /** 切换到下一阶段 */
    const advanceStage = () => {
      const currentIndex = STAGE_ORDER.indexOf(currentStage.value)
      const nextIndex = currentIndex + 1

      if (currentIndex === -1 || nextIndex >= STAGE_ORDER.length) return

      currentStage.value = STAGE_ORDER[nextIndex]
      stageStartedAt.value = Date.now()
    }

    /** 提交考试（接收聚合后的答案） */
    const submitExam = async (allAnswers) => {
      if (isSubmitted.value || isLoading.value) return

      isLoading.value = true
      try {
        const response = await examService.submitExam({
          paperId: examId.value,
          answers: allAnswers,
        })

        isSubmitted.value = true
        return response
      } finally {
        isLoading.value = false
      }
    }

    /** 重置考试状态 */
    const resetExam = () => {
      examId.value = null
      questionsByStage.value = { writing: [], listening: [], reading: [], translation: [] }
      currentStage.value = null
      stageStartedAt.value = null
      isLoading.value = false
      isSubmitted.value = false
    }

    return {
      // State
      examId,
      questionsByStage,
      currentStage,
      stageStartedAt,
      isLoading,
      isSubmitted,
      // Getters
      currentQuestions,
      hasActiveExam,
      stageOrder,
      isLastStage,
      stageDuration,
      // Actions
      startExam,
      resumeExam,
      advanceStage,
      submitExam,
      resetExam,
    }
  },
  {
    persist: {
      key: 'cet4-exam-session',
      pick: ['examId', 'currentStage', 'stageStartedAt', 'questionsByStage'],
    },
  }
)

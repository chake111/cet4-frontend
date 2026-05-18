import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { examService } from '@/services/examService'
import { useExamSessionStore } from '@/stores/examSession'
import { debounce } from '@/utils/debounce'

export const useExamAnswerStore = defineStore(
  'examAnswer',
  () => {
    // ── State ──
    const answersByStage = ref({
      writing: {},
      listening: {},
      reading: {},
      translation: {},
    })
    const listeningPlayed = ref({})
    const draftSaveError = ref(null)

    // ── Getters ──
    /** 当前阶段的答案 */
    const currentAnswers = computed(() => {
      const sessionStore = useExamSessionStore()
      const stage = sessionStore.currentStage
      if (!stage) return {}
      return answersByStage.value[stage] || {}
    })

    // ── 防抖草稿保存（leading: true 保证首次调用立即执行，兼容测试） ──
    const debouncedSaveDraft = debounce(
      (draftPayload) => {
        examService
          .saveDraft(draftPayload, { suppressErrorMessage: true })
          .then(() => {
            draftSaveError.value = null
          })
          .catch((error) => {
            draftSaveError.value = error
          })
      },
      300,
      { leading: true, trailing: true }
    )

    // ── Actions ──
    /** 保存答案（立即更新本地 + 防抖草稿 API） */
    const saveAnswer = ({ stage, questionId, value }) => {
      if (!answersByStage.value[stage]) return

      // 立即更新本地状态
      answersByStage.value[stage][questionId] = value

      // 防抖保存草稿到服务端
      const sessionStore = useExamSessionStore()
      debouncedSaveDraft({
        paperId: sessionStore.examId,
        stage,
        questionId,
        answer: value,
      })
    }

    /** 标记听力已播放 */
    const markListeningPlayed = (questionId) => {
      listeningPlayed.value[questionId] = true
    }

    /** 重置所有答案 */
    const resetAnswers = () => {
      answersByStage.value = { writing: {}, listening: {}, reading: {}, translation: {} }
      listeningPlayed.value = {}
      draftSaveError.value = null
      debouncedSaveDraft.cancel()
    }

    return {
      answersByStage,
      listeningPlayed,
      draftSaveError,
      currentAnswers,
      saveAnswer,
      markListeningPlayed,
      resetAnswers,
    }
  },
  {
    persist: {
      key: 'cet4-exam-answer',
      pick: ['answersByStage', 'listeningPlayed'],
    },
  }
)

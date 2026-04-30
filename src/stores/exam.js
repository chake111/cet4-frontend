import { defineStore } from 'pinia'
import { STAGE_DURATIONS, STAGE_ORDER } from '@/constants/exam'
import { examService } from '@/services/examService'
import {
  propagateListeningSessions,
  propagateReadingPassages,
  transformQuestion,
} from '@/utils/questionTransform'
export { buildSectionGroups, buildSessionGroups, getListeningSectionInfo } from '@/utils/examGrouping'
export { STAGE_DURATIONS }

const createInitialState = () => ({
  examId: null,
  paperMeta: null,
  currentStage: null,
  stageStartedAt: null,
  stageDuration: 0,
  questionsByStage: {
    writing: [],
    listening: [],
    reading: [],
    translation: [],
  },
  answersByStage: {
    writing: {},
    listening: {},
    reading: {},
    translation: {},
  },
  listeningPlayed: {},
  isSubmitted: false,
  isLoading: false,
})

const normalizeQuestionsByStage = (questionsByStage = {}) => ({
  writing: (questionsByStage.writing || []).map((q) => transformQuestion(q, 'writing')),
  listening: propagateListeningSessions(
    (questionsByStage.listening || []).map((q) => transformQuestion(q, 'listening')),
  ),
  reading: propagateReadingPassages(
    (questionsByStage.reading || []).map((q) => transformQuestion(q, 'reading')),
  ),
  translation: (questionsByStage.translation || []).map((q) => transformQuestion(q, 'translation')),
})

export const useExamStore = defineStore('exam', {
  state: () => createInitialState(),

  getters: {
    remainingSeconds(state) {
      if (!state.stageStartedAt || state.stageDuration <= 0) return 0

      const elapsedSeconds = Math.floor((Date.now() - state.stageStartedAt) / 1000)
      return Math.max(0, state.stageDuration - elapsedSeconds)
    },

    currentQuestions(state) {
      if (!state.currentStage) return []
      return state.questionsByStage[state.currentStage] || []
    },

    currentAnswers(state) {
      if (!state.currentStage) return {}
      return state.answersByStage[state.currentStage] || {}
    },

    hasActiveExam(state) {
      return state.examId !== null && !state.isSubmitted
    },

    stageOrder() {
      return STAGE_ORDER
    },
  },

  actions: {
    async startExam(paperId) {
      this.isLoading = true
      try {
        const response = await examService.startExam(paperId)
        const { questionsByStage = {}, startedAt, paperId: returnedPaperId } = response.data || {}

        this.examId = returnedPaperId || paperId
        this.questionsByStage = normalizeQuestionsByStage(questionsByStage)
        this.stageStartedAt = startedAt ? new Date(startedAt).getTime() : Date.now()
        this.currentStage = 'writing'
        this.stageDuration = STAGE_DURATIONS.writing
        this.isSubmitted = false
      } finally {
        this.isLoading = false
      }
    },

    async resumeExam(examId) {
      this.isLoading = true
      try {
        this.examId = examId
      } finally {
        this.isLoading = false
      }
    },

    saveAnswer(stage, questionId, value) {
      if (!this.answersByStage[stage]) return

      this.answersByStage[stage][questionId] = value

      examService
        .saveDraft({
          paperId: this.examId,
          stage,
          questionId,
          answer: value,
        })
        .catch(() => {})
    },

    markListeningPlayed(questionId) {
      this.listeningPlayed[questionId] = true
    },

    advanceStage() {
      const currentIndex = STAGE_ORDER.indexOf(this.currentStage)
      const nextIndex = currentIndex + 1

      if (currentIndex === -1 || nextIndex >= STAGE_ORDER.length) return

      const nextStage = STAGE_ORDER[nextIndex]
      this.currentStage = nextStage
      this.stageStartedAt = Date.now()
      this.stageDuration = STAGE_DURATIONS[nextStage]
    },

    async submitExam() {
      if (this.isSubmitted || this.isLoading) return

      this.isLoading = true
      try {
        const answers = Object.values(this.answersByStage).reduce(
          (acc, stageAnswers) => ({ ...acc, ...stageAnswers }),
          {},
        )
        const response = await examService.submitExam({
          paperId: this.examId,
          answers,
        })

        this.isSubmitted = true
        return response
      } finally {
        this.isLoading = false
      }
    },

    resetExam() {
      this.$patch(createInitialState())
    },
  },

  persist: {
    key: 'cet4-exam-session',
    storage: localStorage,
    pick: ['examId'],
  },
})

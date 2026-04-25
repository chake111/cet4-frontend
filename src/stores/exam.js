import { defineStore } from 'pinia'
import request from '@/utils/request'

/**
 * CET-4 考试全局状态中枢。
 *
 * 设计意图：集中管理“考试进行中”所需的会话、阶段、题目、作答与提交流程状态，
 * 为后续任务接入真实后端 API、断线续考恢复、答题节流上报与听力播放限制提供统一数据源。
 * 本文件当前仅实现本地状态逻辑与 API 占位，不包含真实网络请求。
 */

/**
 * 各考试阶段时长（秒）。
 */
const STAGE_DURATIONS = {
  writing: 1800,
  listening: 2100,
  reading: 2400,
  translation: 1500,
}

const STAGE_ORDER = ['writing', 'listening', 'reading', 'translation']

const createInitialState = () => ({
  /** 后端生成的考试会话 ID */
  examId: null,
  /** 试卷基础信息：{ paperId, year, month, setNo, totalScore, totalDuration } */
  paperMeta: null,
  /** 当前阶段：'writing' | 'listening' | 'reading' | 'translation' | null */
  currentStage: null,
  /** 当前阶段开始时间戳（ms），用于计算剩余时间 */
  stageStartedAt: null,
  /** 当前阶段总时长（秒） */
  stageDuration: 0,
  /** 按阶段分组的题目列表 */
  questionsByStage: {
    writing: [],
    listening: [],
    reading: [],
    translation: [],
  },
  /** 按阶段分组的作答草稿 */
  answersByStage: {
    writing: {},
    listening: {},
    reading: {},
    translation: {},
  },
  /** 听力题播放完成标记：{ [questionId]: true } */
  listeningPlayed: {},
  /** 是否已交卷 */
  isSubmitted: false,
  /** 接口调用加载状态 */
  isLoading: false,
})

export const useExamStore = defineStore('exam', {
  state: () => createInitialState(),

  getters: {
    /**
     * 当前阶段剩余秒数。
     * 基于 stageStartedAt + stageDuration 与当前时间差值实时计算，最小为 0。
     * 不使用 setInterval 维护递减值。
     */
    remainingSeconds(state) {
      if (!state.stageStartedAt || state.stageDuration <= 0) return 0

      const elapsedSeconds = Math.floor((Date.now() - state.stageStartedAt) / 1000)
      const remaining = state.stageDuration - elapsedSeconds
      return Math.max(0, remaining)
    },

    /** 当前阶段题目列表，若无当前阶段则返回空数组。 */
    currentQuestions(state) {
      if (!state.currentStage) return []
      return state.questionsByStage[state.currentStage] || []
    },

    /** 当前阶段作答对象，若无当前阶段则返回空对象。 */
    currentAnswers(state) {
      if (!state.currentStage) return {}
      return state.answersByStage[state.currentStage] || {}
    },

    /** 是否存在进行中的考试会话。 */
    hasActiveExam(state) {
      return state.examId !== null && !state.isSubmitted
    },

    /** 阶段顺序常量。 */
    stageOrder() {
      return STAGE_ORDER
    },
  },

  actions: {
    /**
     * 开始考试。
     * @param {string|number} paperId 试卷 ID
     * @returns {Promise<void>}
     */
    async startExam(paperId) {
      this.isLoading = true
      try {
        const response = await request.post('/exam/start', { paperId })
        const { questionsByStage = {}, startedAt } = response || {}

        this.examId = paperId
        this.questionsByStage = {
          writing: questionsByStage.writing || [],
          listening: questionsByStage.listening || [],
          reading: questionsByStage.reading || [],
          translation: questionsByStage.translation || [],
        }
        this.stageStartedAt = startedAt ? new Date(startedAt).getTime() : Date.now()
        this.currentStage = 'writing'
        this.stageDuration = 1800
        this.isSubmitted = false
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 恢复考试会话。
     * @param {string|number} examId 考试会话 ID
     * @returns {Promise<void>}
     */
    async resumeExam(examId) {
      this.isLoading = true
      try {
        // TODO: 任务 1.3 接入 GET /api/exam/session/{examId}
        this.examId = examId
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 保存作答草稿到本地状态。
     * @param {'writing'|'listening'|'reading'|'translation'} stage 阶段
     * @param {string|number} questionId 题目 ID
     * @param {any} value 作答内容
     */
    saveAnswer(stage, questionId, value) {
      if (!this.answersByStage[stage]) return
      this.answersByStage[stage][questionId] = value

      request
        .put('/exam/draft', {
          paperId: this.examId,
          stage,
          questionId,
          answer: value,
        })
        .catch(() => {})
    },

    /**
     * 标记听力题已播放完成（一次性播放约束依赖该标记）。
     * @param {string|number} questionId 题目 ID
     */
    markListeningPlayed(questionId) {
      this.listeningPlayed[questionId] = true
    },

    /**
     * 切换到下一考试阶段并重置阶段计时。
     * 若当前已经是最后阶段，则不执行任何操作。
     */
    advanceStage() {
      const currentIndex = STAGE_ORDER.indexOf(this.currentStage)
      const nextIndex = currentIndex + 1

      if (currentIndex === -1 || nextIndex >= STAGE_ORDER.length) {
        return
      }

      const nextStage = STAGE_ORDER[nextIndex]
      this.currentStage = nextStage
      this.stageStartedAt = Date.now()
      this.stageDuration = STAGE_DURATIONS[nextStage]
    },

    /**
     * 提交试卷（占位实现）。
     * @returns {Promise<void>}
     */
    async submitExam() {
      this.isLoading = true
      try {
        const answers = Object.values(this.answersByStage).reduce((acc, stageAnswers) => ({ ...acc, ...stageAnswers }), {})
        const response = await request.post('/exam/submit', {
          paperId: this.examId,
          answers,
        })

        this.isSubmitted = true
        return response
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 重置考试状态到初始值。
     */
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

export { STAGE_DURATIONS }

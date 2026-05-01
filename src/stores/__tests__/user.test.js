import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../user'
import { useExamSessionStore } from '../examSession'
import { useExamAnswerStore } from '../examAnswer'

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty token initially', () => {
      const store = useUserStore()
      expect(store.token).toBe('')
    })

    it('should have null userInfo initially', () => {
      const store = useUserStore()
      expect(store.userInfo).toBeNull()
    })
  })

  describe('setToken', () => {
    it('should set the token value', () => {
      const store = useUserStore()
      store.setToken('my-jwt-token')
      expect(store.token).toBe('my-jwt-token')
    })

    it('should overwrite existing token', () => {
      const store = useUserStore()
      store.setToken('first-token')
      store.setToken('second-token')
      expect(store.token).toBe('second-token')
    })

    it('should allow setting empty string', () => {
      const store = useUserStore()
      store.setToken('some-token')
      store.setToken('')
      expect(store.token).toBe('')
    })
  })

  describe('logout', () => {
    it('should clear token', () => {
      const store = useUserStore()
      store.setToken('my-jwt-token')
      store.logout()
      expect(store.token).toBe('')
    })

    it('should clear userInfo', () => {
      const store = useUserStore()
      store.userInfo = { name: 'Test User' }
      store.logout()
      expect(store.userInfo).toBeNull()
    })

    it('should call sessionStore.resetExam', () => {
      const store = useUserStore()
      const sessionStore = useExamSessionStore()
      const resetSpy = vi.spyOn(sessionStore, 'resetExam')

      store.logout()

      expect(resetSpy).toHaveBeenCalled()
    })

    it('should call answerStore.resetAnswers', () => {
      const store = useUserStore()
      const answerStore = useExamAnswerStore()
      const resetSpy = vi.spyOn(answerStore, 'resetAnswers')

      store.logout()

      expect(resetSpy).toHaveBeenCalled()
    })

    it('should clear all related stores on logout', () => {
      const store = useUserStore()
      const sessionStore = useExamSessionStore()
      const answerStore = useExamAnswerStore()

      store.setToken('token')
      store.userInfo = { name: 'User' }
      sessionStore.$patch({ examId: 'exam-1', currentStage: 'writing' })
      answerStore.saveAnswer({ stage: 'writing', questionId: 'q1', value: 'answer' })

      store.logout()

      expect(store.token).toBe('')
      expect(store.userInfo).toBeNull()
      expect(sessionStore.examId).toBeNull()
      expect(sessionStore.currentStage).toBeNull()
      expect(answerStore.answersByStage.writing).toEqual({})
    })
  })
})

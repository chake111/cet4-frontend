import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useExamAnswerStore } from '../examAnswer'
import { useExamSessionStore } from '../examSession'

// Mock examService
vi.mock('@/services/examService', () => ({
  examService: {
    saveDraft: vi.fn().mockResolvedValue({}),
  },
}))

import { examService } from '@/services/examService'

describe('useExamAnswerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty answersByStage initially', () => {
      const store = useExamAnswerStore()
      expect(store.answersByStage).toEqual({
        writing: {},
        listening: {},
        reading: {},
        translation: {},
      })
    })

    it('should have empty listeningPlayed initially', () => {
      const store = useExamAnswerStore()
      expect(store.listeningPlayed).toEqual({})
    })

    it('should have null draftSaveError initially', () => {
      const store = useExamAnswerStore()
      expect(store.draftSaveError).toBeNull()
    })
  })

  describe('saveAnswer', () => {
    it('should update local answer immediately', () => {
      const store = useExamAnswerStore()
      store.saveAnswer({ stage: 'writing', questionId: 'q1', value: 'My essay' })
      expect(store.answersByStage.writing.q1).toBe('My essay')
    })

    it('should call examService.saveDraft', () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123' })

      const store = useExamAnswerStore()
      store.saveAnswer({ stage: 'writing', questionId: 'q1', value: 'My essay' })

      expect(examService.saveDraft).toHaveBeenCalledWith(
        {
          paperId: 'paper-123',
          stage: 'writing',
          questionId: 'q1',
          answer: 'My essay',
        },
        { suppressErrorMessage: true }
      )
    })

    it('should clear draftSaveError on successful save', async () => {
      examService.saveDraft.mockResolvedValue({})
      const store = useExamAnswerStore()
      store.draftSaveError = new Error('previous error')

      store.saveAnswer({ stage: 'writing', questionId: 'q1', value: 'A' })

      // Wait for the promise to resolve
      await vi.waitFor(() => {
        expect(store.draftSaveError).toBeNull()
      })
    })

    it('should set draftSaveError on failed save', async () => {
      const error = new Error('Network error')
      examService.saveDraft.mockRejectedValue(error)

      const store = useExamAnswerStore()
      store.saveAnswer({ stage: 'writing', questionId: 'q1', value: 'A' })

      await vi.waitFor(() => {
        expect(store.draftSaveError).toBe(error)
      })
    })

    it('should not update answer for invalid stage', () => {
      const store = useExamAnswerStore()
      store.saveAnswer({ stage: 'invalid_stage', questionId: 'q1', value: 'A' })
      expect(store.answersByStage.invalid_stage).toBeUndefined()
    })
  })

  describe('markListeningPlayed', () => {
    it('should mark a question as played', () => {
      const store = useExamAnswerStore()
      store.markListeningPlayed('q1')
      expect(store.listeningPlayed.q1).toBe(true)
    })

    it('should mark multiple questions as played', () => {
      const store = useExamAnswerStore()
      store.markListeningPlayed('q1')
      store.markListeningPlayed('q2')
      expect(store.listeningPlayed.q1).toBe(true)
      expect(store.listeningPlayed.q2).toBe(true)
    })
  })

  describe('resetAnswers', () => {
    it('should reset all answers to empty', () => {
      const store = useExamAnswerStore()
      store.saveAnswer({ stage: 'writing', questionId: 'q1', value: 'My essay' })
      store.markListeningPlayed('q1')
      store.draftSaveError = new Error('error')

      store.resetAnswers()

      expect(store.answersByStage).toEqual({
        writing: {},
        listening: {},
        reading: {},
        translation: {},
      })
      expect(store.listeningPlayed).toEqual({})
      expect(store.draftSaveError).toBeNull()
    })
  })

  describe('currentAnswers getter', () => {
    it('should return answers for current stage', () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ currentStage: 'writing' })

      const store = useExamAnswerStore()
      store.saveAnswer({ stage: 'writing', questionId: 'q1', value: 'My essay' })

      expect(store.currentAnswers).toEqual({ q1: 'My essay' })
    })

    it('should return empty object when no currentStage', () => {
      // currentStage is null by default, no need to call useExamSessionStore
      const store = useExamAnswerStore()
      expect(store.currentAnswers).toEqual({})
    })
  })
})

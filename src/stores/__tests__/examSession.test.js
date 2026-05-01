import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useExamSessionStore } from '../examSession'

// Mock examService
vi.mock('@/services/examService', () => ({
  examService: {
    startExam: vi.fn(),
    submitExam: vi.fn(),
  },
}))

// Import the mocked module
import { examService } from '@/services/examService'

describe('useExamSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have null examId initially', () => {
      const store = useExamSessionStore()
      expect(store.examId).toBeNull()
    })

    it('should have null currentStage initially', () => {
      const store = useExamSessionStore()
      expect(store.currentStage).toBeNull()
    })

    it('should have false isSubmitted initially', () => {
      const store = useExamSessionStore()
      expect(store.isSubmitted).toBe(false)
    })

    it('should have false isLoading initially', () => {
      const store = useExamSessionStore()
      expect(store.isLoading).toBe(false)
    })

    it('should have empty questionsByStage initially', () => {
      const store = useExamSessionStore()
      expect(store.questionsByStage).toEqual({
        writing: [],
        listening: [],
        reading: [],
        translation: [],
      })
    })
  })

  describe('getters', () => {
    it('currentQuestions should return empty array when no currentStage', () => {
      const store = useExamSessionStore()
      expect(store.currentQuestions).toEqual([])
    })

    it('currentQuestions should return questions for current stage', () => {
      const store = useExamSessionStore()
      store.$patch({
        currentStage: 'writing',
        questionsByStage: {
          writing: [{ id: 1 }],
          listening: [],
          reading: [],
          translation: [],
        },
      })
      expect(store.currentQuestions).toEqual([{ id: 1 }])
    })

    it('hasActiveExam should be false when no examId', () => {
      const store = useExamSessionStore()
      expect(store.hasActiveExam).toBe(false)
    })

    it('hasActiveExam should be true when examId set and not submitted', () => {
      const store = useExamSessionStore()
      store.$patch({ examId: 'test-id', isSubmitted: false })
      expect(store.hasActiveExam).toBe(true)
    })

    it('hasActiveExam should be false when submitted', () => {
      const store = useExamSessionStore()
      store.$patch({ examId: 'test-id', isSubmitted: true })
      expect(store.hasActiveExam).toBe(false)
    })

    it('stageOrder should return STAGE_ORDER', () => {
      const store = useExamSessionStore()
      expect(store.stageOrder).toEqual(['writing', 'listening', 'reading', 'translation'])
    })

    it('isLastStage should be false when not on last stage', () => {
      const store = useExamSessionStore()
      store.$patch({ currentStage: 'writing' })
      expect(store.isLastStage).toBe(false)
    })

    it('isLastStage should be true when on translation stage', () => {
      const store = useExamSessionStore()
      store.$patch({ currentStage: 'translation' })
      expect(store.isLastStage).toBe(true)
    })

    it('stageDuration should return 0 when no currentStage', () => {
      const store = useExamSessionStore()
      expect(store.stageDuration).toBe(0)
    })

    it('stageDuration should return correct duration for writing', () => {
      const store = useExamSessionStore()
      store.$patch({ currentStage: 'writing' })
      expect(store.stageDuration).toBe(1800)
    })
  })

  describe('startExam', () => {
    it('should set examId and currentStage on success', async () => {
      examService.startExam.mockResolvedValue({
        data: {
          questionsByStage: { writing: [], listening: [], reading: [], translation: [] },
          startedAt: new Date().toISOString(),
          paperId: 'paper-123',
        },
      })

      const store = useExamSessionStore()
      await store.startExam('paper-123')

      expect(store.examId).toBe('paper-123')
      expect(store.currentStage).toBe('writing')
      expect(store.isSubmitted).toBe(false)
      expect(store.isLoading).toBe(false)
    })

    it('should set isLoading to false even on error', async () => {
      examService.startExam.mockRejectedValue(new Error('Network error'))

      const store = useExamSessionStore()
      await expect(store.startExam('paper-123')).rejects.toThrow('Network error')
      expect(store.isLoading).toBe(false)
    })

    it('should normalize questions by stage', async () => {
      examService.startExam.mockResolvedValue({
        data: {
          questionsByStage: {
            writing: [
              {
                id: 1,
                content: 'Write an essay',
                optionA: null,
                optionB: null,
                optionC: null,
                optionD: null,
              },
            ],
            listening: [],
            reading: [],
            translation: [],
          },
          startedAt: new Date().toISOString(),
          paperId: 'paper-123',
        },
      })

      const store = useExamSessionStore()
      await store.startExam('paper-123')

      expect(store.questionsByStage.writing).toHaveLength(1)
      expect(store.questionsByStage.writing[0].content).toEqual({ title: 'Write an essay' })
    })
  })

  describe('advanceStage', () => {
    it('should advance from writing to listening', () => {
      const store = useExamSessionStore()
      store.$patch({ currentStage: 'writing' })
      store.advanceStage()
      expect(store.currentStage).toBe('listening')
    })

    it('should advance from listening to reading', () => {
      const store = useExamSessionStore()
      store.$patch({ currentStage: 'listening' })
      store.advanceStage()
      expect(store.currentStage).toBe('reading')
    })

    it('should advance from reading to translation', () => {
      const store = useExamSessionStore()
      store.$patch({ currentStage: 'reading' })
      store.advanceStage()
      expect(store.currentStage).toBe('translation')
    })

    it('should not advance past translation', () => {
      const store = useExamSessionStore()
      store.$patch({ currentStage: 'translation' })
      store.advanceStage()
      expect(store.currentStage).toBe('translation')
    })

    it('should reset stageStartedAt on advance', () => {
      const store = useExamSessionStore()
      store.$patch({ currentStage: 'writing', stageStartedAt: 1000 })
      const beforeAdvance = Date.now()
      store.advanceStage()
      expect(store.stageStartedAt).toBeGreaterThanOrEqual(beforeAdvance)
    })

    it('should not advance when currentStage is null', () => {
      const store = useExamSessionStore()
      store.advanceStage()
      expect(store.currentStage).toBeNull()
    })
  })

  describe('submitExam', () => {
    it('should set isSubmitted to true on success', async () => {
      examService.submitExam.mockResolvedValue({ data: { recordId: 'rec-1' } })

      const store = useExamSessionStore()
      store.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: false })

      const result = await store.submitExam({ 1: 'A' })
      expect(store.isSubmitted).toBe(true)
      expect(result).toEqual({ data: { recordId: 'rec-1' } })
    })

    it('should not submit when already submitted', async () => {
      const store = useExamSessionStore()
      store.$patch({ examId: 'paper-123', isSubmitted: true, isLoading: false })

      await store.submitExam({ 1: 'A' })
      expect(examService.submitExam).not.toHaveBeenCalled()
    })

    it('should not submit when loading', async () => {
      const store = useExamSessionStore()
      store.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: true })

      await store.submitExam({ 1: 'A' })
      expect(examService.submitExam).not.toHaveBeenCalled()
    })

    it('should set isLoading to false even on error', async () => {
      examService.submitExam.mockRejectedValue(new Error('Submit failed'))

      const store = useExamSessionStore()
      store.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: false })

      await expect(store.submitExam({ 1: 'A' })).rejects.toThrow('Submit failed')
      expect(store.isLoading).toBe(false)
    })
  })

  describe('resetExam', () => {
    it('should reset all state to initial values', () => {
      const store = useExamSessionStore()
      store.$patch({
        examId: 'paper-123',
        currentStage: 'listening',
        isSubmitted: false,
        isLoading: false,
        stageStartedAt: Date.now(),
        questionsByStage: {
          writing: [{ id: 1 }],
          listening: [],
          reading: [],
          translation: [],
        },
      })

      store.resetExam()

      expect(store.examId).toBeNull()
      expect(store.currentStage).toBeNull()
      expect(store.isSubmitted).toBe(false)
      expect(store.isLoading).toBe(false)
      expect(store.stageStartedAt).toBeNull()
      expect(store.questionsByStage).toEqual({
        writing: [],
        listening: [],
        reading: [],
        translation: [],
      })
    })
  })

  describe('resumeExam', () => {
    it('should restore state when examId and currentStage exist', async () => {
      const store = useExamSessionStore()
      store.$patch({
        examId: 'paper-123',
        currentStage: 'listening',
        isSubmitted: true,
      })

      await store.resumeExam()

      expect(store.isSubmitted).toBe(false)
      expect(store.isLoading).toBe(false)
    })

    it('should set isLoading to false when no persistent data', async () => {
      const store = useExamSessionStore()
      // examId and currentStage are null by default
      await store.resumeExam()
      expect(store.isLoading).toBe(false)
    })
  })
})

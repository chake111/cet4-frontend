import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useExamFlow } from '../useExamFlow'
import { useExamSessionStore } from '@/stores/examSession'
import { useExamAnswerStore } from '@/stores/examAnswer'

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock element-plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock examService
vi.mock('@/services/examService', () => ({
  examService: {
    startExam: vi.fn(),
    submitExam: vi.fn(),
    saveDraft: vi.fn(),
  },
}))

// Capture the onTick callback passed to useExamTimer().start()
let capturedOnTick = null
const mockStart = vi.fn((onTick) => {
  capturedOnTick = onTick
})
const mockStop = vi.fn()
let mockRemainingSeconds = { value: 600 }

vi.mock('@/composables/useExamTimer', () => ({
  useExamTimer: () => ({
    start: mockStart,
    stop: mockStop,
    get remainingSeconds() {
      return mockRemainingSeconds
    },
  }),
}))

import { examService } from '@/services/examService'
import { ElMessage } from 'element-plus'

describe('useExamFlow', () => {
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
    capturedOnTick = null
    mockRemainingSeconds = { value: 600 }
  })

  describe('startExam', () => {
    it('should call sessionStore.startExam and start timer', async () => {
      examService.startExam.mockResolvedValue({
        data: {
          questionsByStage: { writing: [], listening: [], reading: [], translation: [] },
          startedAt: new Date().toISOString(),
          paperId: 'paper-123',
        },
      })

      const { startExam } = useExamFlow()
      await startExam('paper-123')

      expect(examService.startExam).toHaveBeenCalledWith('paper-123')
      expect(mockStart).toHaveBeenCalled()
    })
  })

  describe('goToNextStage', () => {
    it('should advance to next stage', () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ currentStage: 'writing' })

      const { goToNextStage } = useExamFlow()
      goToNextStage()

      expect(sessionStore.currentStage).toBe('listening')
    })
  })

  describe('submitExamAndExit', () => {
    it('should submit exam and navigate to result page', async () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: false })

      examService.submitExam.mockResolvedValue({
        data: { recordId: 'rec-123' },
      })

      const { submitExamAndExit } = useExamFlow()
      await submitExamAndExit()

      expect(examService.submitExam).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/exam/record/rec-123/result')
    })

    it('should navigate when submit response is already unwrapped', async () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: false })

      examService.submitExam.mockResolvedValue({
        recordId: 'rec-direct',
      })

      const { submitExamAndExit } = useExamFlow()
      await submitExamAndExit()

      expect(mockPush).toHaveBeenCalledWith('/exam/record/rec-direct/result')
    })

    it('should show error message on submit failure', async () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: false })

      examService.submitExam.mockRejectedValue(new Error('Submit failed'))

      const { submitExamAndExit } = useExamFlow()
      await expect(submitExamAndExit()).rejects.toThrow('Submit failed')

      expect(ElMessage.error).toHaveBeenCalledWith('提交失败，请重试')
    })

    it('should not submit when already submitting', async () => {
      const { submitExamAndExit, submitting } = useExamFlow()
      // Manually set submitting to true
      submitting.value = true

      await submitExamAndExit()

      expect(examService.submitExam).not.toHaveBeenCalled()
    })
  })

  describe('handleSubmit', () => {
    it('should call submitExamAndExit', async () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: false })

      examService.submitExam.mockResolvedValue({
        data: { recordId: 'rec-123' },
      })

      const { handleSubmit } = useExamFlow()
      await handleSubmit()

      expect(examService.submitExam).toHaveBeenCalled()
    })

    it('should not throw on submit failure', async () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: false })

      examService.submitExam.mockRejectedValue(new Error('Submit failed'))

      const { handleSubmit } = useExamFlow()
      // Should not throw
      await expect(handleSubmit()).resolves.toBeUndefined()
    })
  })

  describe('stopExam', () => {
    it('should call stopTimer', () => {
      const { stopExam } = useExamFlow()
      // stopExam calls stopTimer which is mocked
      expect(() => stopExam()).not.toThrow()
      expect(mockStop).toHaveBeenCalled()
    })
  })

  describe('isLastStage', () => {
    it('should reflect sessionStore.isLastStage', () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ currentStage: 'translation' })

      const { isLastStage } = useExamFlow()
      expect(isLastStage.value).toBe(true)
    })
  })

  describe('handleAutoSwitch', () => {
    it('should not proceed if no active exam', async () => {
      const sessionStore = useExamSessionStore()
      // No examId means no active exam
      sessionStore.$patch({ examId: null, isSubmitted: false })
      mockRemainingSeconds.value = 0

      // Need to trigger startExam to capture the onTick callback
      examService.startExam.mockResolvedValue({
        data: {
          questionsByStage: { writing: [], listening: [], reading: [], translation: [] },
          startedAt: new Date().toISOString(),
          paperId: 'paper-123',
        },
      })
      const { startExam } = useExamFlow()
      await startExam('paper-123')

      // Reset examId after start to simulate no active exam
      sessionStore.$patch({ examId: null })

      if (capturedOnTick) {
        await capturedOnTick()
      }

      expect(examService.submitExam).not.toHaveBeenCalled()
    })

    it('should not proceed if remaining time > 0', async () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123', isSubmitted: false, currentStage: 'writing' })
      mockRemainingSeconds.value = 600 // Still has time

      examService.startExam.mockResolvedValue({
        data: {
          questionsByStage: { writing: [], listening: [], reading: [], translation: [] },
          startedAt: new Date().toISOString(),
          paperId: 'paper-123',
        },
      })
      const { startExam } = useExamFlow()
      await startExam('paper-123')

      if (capturedOnTick) {
        await capturedOnTick()
      }

      expect(examService.submitExam).not.toHaveBeenCalled()
    })

    it('should call goToNextStage when not last stage and time is up', async () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123', isSubmitted: false, currentStage: 'writing' })
      mockRemainingSeconds.value = 0

      examService.startExam.mockResolvedValue({
        data: {
          questionsByStage: { writing: [], listening: [], reading: [], translation: [] },
          startedAt: new Date().toISOString(),
          paperId: 'paper-123',
        },
      })
      const { startExam } = useExamFlow()
      await startExam('paper-123')

      if (capturedOnTick) {
        await capturedOnTick()
      }

      // Should have advanced from writing to listening
      expect(sessionStore.currentStage).toBe('listening')
    })

    it('should call submitExamAndExit when last stage and time is up', async () => {
      const sessionStore = useExamSessionStore()
      mockRemainingSeconds.value = 0

      examService.startExam.mockResolvedValue({
        data: {
          questionsByStage: { writing: [], listening: [], reading: [], translation: [] },
          startedAt: new Date().toISOString(),
          paperId: 'paper-123',
        },
      })
      examService.submitExam.mockResolvedValue({
        data: { recordId: 'rec-auto' },
      })

      const { startExam } = useExamFlow()
      await startExam('paper-123')

      // startExam sets currentStage to 'writing'; override to 'translation' for last stage test
      sessionStore.$patch({ currentStage: 'translation' })

      if (capturedOnTick) {
        await capturedOnTick()
      }

      expect(examService.submitExam).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/exam/record/rec-auto/result')
    })

    it('should set autoSubmitFailed on submit failure during auto-submit', async () => {
      const sessionStore = useExamSessionStore()
      mockRemainingSeconds.value = 0

      examService.startExam.mockResolvedValue({
        data: {
          questionsByStage: { writing: [], listening: [], reading: [], translation: [] },
          startedAt: new Date().toISOString(),
          paperId: 'paper-123',
        },
      })
      examService.submitExam.mockRejectedValue(new Error('Auto submit failed'))

      const { startExam } = useExamFlow()
      await startExam('paper-123')

      // startExam sets currentStage to 'writing'; override to 'translation' for last stage test
      sessionStore.$patch({ currentStage: 'translation' })

      if (capturedOnTick) {
        await capturedOnTick()
      }

      expect(ElMessage.error).toHaveBeenCalledWith('提交失败，请重试')
    })
  })

  describe('aggregateAllAnswers', () => {
    it('should aggregate answers from all stages', async () => {
      const sessionStore = useExamSessionStore()
      sessionStore.$patch({ examId: 'paper-123', isSubmitted: false, isLoading: false })

      const answerStore = useExamAnswerStore()
      answerStore.$patch({
        answersByStage: {
          writing: { q1: 'essay answer' },
          listening: { q2: 'A' },
          reading: { q3: 'B', q4: 'C' },
          translation: { q5: 'translation answer' },
        },
      })

      examService.submitExam.mockResolvedValue({
        data: { recordId: 'rec-agg' },
      })

      const { submitExamAndExit } = useExamFlow()
      await submitExamAndExit()

      // Verify submitExam was called with aggregated answers
      expect(examService.submitExam).toHaveBeenCalledWith(
        expect.objectContaining({
          paperId: 'paper-123',
          answers: expect.objectContaining({
            q1: 'essay answer',
            q2: 'A',
            q3: 'B',
            q4: 'C',
            q5: 'translation answer',
          }),
        })
      )
    })
  })

  describe('draftSaveError watch', () => {
    it('should show warning when draftSaveError is set', async () => {
      const answerStore = useExamAnswerStore()

      useExamFlow()

      // Simulate draft save error
      answerStore.draftSaveError = new Error('Network error')

      // Wait for watch to trigger
      await vi.waitFor(() => {
        expect(ElMessage.warning).toHaveBeenCalledWith('答案草稿保存失败，请检查网络连接')
      })
    })
  })
})

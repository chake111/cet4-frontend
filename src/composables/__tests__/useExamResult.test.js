import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useExamResult } from '../useExamResult'

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
  },
}))

vi.mock('@/services/examService', () => ({
  examService: {
    getExamResult: vi.fn(),
  },
}))

import { examService } from '@/services/examService'

describe('useExamResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should use wrapped result payload', async () => {
    examService.getExamResult.mockResolvedValue({
      data: {
        recordId: 1,
        score: 450,
        startTime: '2026-05-04T10:00:00',
        submittedAt: '2026-05-04T11:00:00',
        answerDetails: [],
      },
    })

    const { result, durationText, fetchResult } = useExamResult(ref('1'))
    await fetchResult()

    expect(result.value.score).toBe(450)
    expect(durationText.value).toBe('01:00:00')
  })

  it('should use result payload that is already unwrapped', async () => {
    examService.getExamResult.mockResolvedValue({
      recordId: 2,
      score: 360,
      startTime: '2026-05-04T10:00:00',
      submittedAt: '2026-05-04T10:45:00',
      answerDetails: [],
    })

    const { result, durationText, fetchResult } = useExamResult(ref('2'))
    await fetchResult()

    expect(result.value.score).toBe(360)
    expect(durationText.value).toBe('00:45:00')
  })
})

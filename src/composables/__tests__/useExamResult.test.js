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
import { ElMessage } from 'element-plus'

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

  it('should show user guidance when recordId is missing', async () => {
    const { loading, fetchResult } = useExamResult(ref(''))

    await fetchResult()

    expect(loading.value).toBe(false)
    expect(examService.getExamResult).not.toHaveBeenCalled()
    expect(ElMessage.error).toHaveBeenCalledWith('无法打开考试报告，请从考试记录重新进入')
  })

  it('should leave rejected fetch messages to the request interceptor', async () => {
    examService.getExamResult.mockRejectedValue(new Error('Server failed'))

    const { result, loading, fetchResult } = useExamResult(ref('1'))
    await fetchResult()

    expect(result.value).toEqual({})
    expect(loading.value).toBe(false)
    expect(ElMessage.error).not.toHaveBeenCalled()
  })
})

import { describe, it, expect } from 'vitest'
import {
  getListeningSectionInfo,
  buildSessionGroups,
  buildSectionGroups,
  buildListeningResultSessions,
  buildReadingResultSessions,
} from '../grouping'

describe('getListeningSectionInfo', () => {
  it('should return Section A News Report for questionNo <= 7', () => {
    expect(getListeningSectionInfo(1)).toEqual({
      sectionLabel: 'Section A',
      sectionTitle: 'News Report',
    })
    expect(getListeningSectionInfo(7)).toEqual({
      sectionLabel: 'Section A',
      sectionTitle: 'News Report',
    })
  })

  it('should return Section B Conversation for questionNo 8-15', () => {
    expect(getListeningSectionInfo(8)).toEqual({
      sectionLabel: 'Section B',
      sectionTitle: 'Conversation',
    })
    expect(getListeningSectionInfo(15)).toEqual({
      sectionLabel: 'Section B',
      sectionTitle: 'Conversation',
    })
  })

  it('should return Section C Passage for questionNo > 15', () => {
    expect(getListeningSectionInfo(16)).toEqual({
      sectionLabel: 'Section C',
      sectionTitle: 'Passage',
    })
    expect(getListeningSectionInfo(25)).toEqual({
      sectionLabel: 'Section C',
      sectionTitle: 'Passage',
    })
  })
})

describe('buildSessionGroups', () => {
  it('should group listening questions by sessionId with section labels', () => {
    const questions = [
      { id: 1, sessionId: 'listening-0', questionNo: 1, sharedStem: 'News 1' },
      { id: 2, sessionId: 'listening-0', questionNo: 2, sharedStem: 'News 1' },
      { id: 3, sessionId: 'listening-1', questionNo: 8, sharedStem: 'Conv 1' },
    ]
    const result = buildSessionGroups(questions, 'listening')

    expect(result).toHaveLength(2)
    expect(result[0].sessionId).toBe('listening-0')
    expect(result[0].sectionLabel).toBe('Section A')
    expect(result[0].sectionTitle).toBe('News Report')
    expect(result[0].sessionTitle).toBe('News Report 1')
    expect(result[0].questions).toHaveLength(2)

    expect(result[1].sessionId).toBe('listening-1')
    expect(result[1].sectionLabel).toBe('Section B')
    expect(result[1].sectionTitle).toBe('Conversation')
    expect(result[1].sessionTitle).toBe('Conversation 1')
  })

  it('should assign correct listening session titles for multiple sections', () => {
    const questions = [
      { id: 1, sessionId: 'l-0', questionNo: 1 },
      { id: 2, sessionId: 'l-1', questionNo: 4 },
      { id: 3, sessionId: 'l-2', questionNo: 8 },
      { id: 4, sessionId: 'l-3', questionNo: 16 },
    ]
    const result = buildSessionGroups(questions, 'listening')

    expect(result[0].sessionTitle).toBe('News Report 1')
    expect(result[1].sessionTitle).toBe('News Report 2')
    expect(result[2].sessionTitle).toBe('Conversation 1')
    expect(result[3].sessionTitle).toBe('Passage 1')
  })

  it('should group reading questions by sessionId with type-based labels', () => {
    const questions = [
      { id: 1, sessionId: 'r-0', content: { type: 'blank_filling' } },
      { id: 2, sessionId: 'r-1', content: { type: 'matching' } },
      { id: 3, sessionId: 'r-2', content: { type: 'single_choice' } },
    ]
    const result = buildSessionGroups(questions, 'reading')

    expect(result).toHaveLength(3)
    expect(result[0].sessionTitle).toBe('选词填空 1')
    expect(result[0].sectionLabel).toBe('Section A')
    expect(result[1].sessionTitle).toBe('段落匹配 1')
    expect(result[1].sectionLabel).toBe('Section B')
    expect(result[2].sessionTitle).toBe('仔细阅读 1')
    expect(result[2].sectionLabel).toBe('Section C')
  })

  it('should use question id as fallback key when sessionId is missing', () => {
    const questions = [
      { id: 10, questionNo: 1 },
      { id: 20, questionNo: 2 },
    ]
    const result = buildSessionGroups(questions, 'listening')
    expect(result).toHaveLength(2)
    expect(result[0].sessionId).toBe('10')
    expect(result[1].sessionId).toBe('20')
  })

  it('should handle empty questions array', () => {
    expect(buildSessionGroups([], 'listening')).toEqual([])
  })

  it('should handle unknown stage without special labeling', () => {
    const questions = [{ id: 1, sessionId: 's-0' }]
    const result = buildSessionGroups(questions, 'writing')
    expect(result[0].sessionTitle).toBe('')
    expect(result[0].sectionLabel).toBe('')
  })
})

describe('buildSectionGroups', () => {
  it('should group sessions by sectionLabel', () => {
    const sessions = [
      { sectionLabel: 'Section A', sectionTitle: 'News Report', sessionId: 'l-0' },
      { sectionLabel: 'Section A', sectionTitle: 'News Report', sessionId: 'l-1' },
      { sectionLabel: 'Section B', sectionTitle: 'Conversation', sessionId: 'l-2' },
    ]
    const result = buildSectionGroups(sessions)

    expect(result).toHaveLength(2)
    expect(result[0].sectionLabel).toBe('Section A')
    expect(result[0].sessions).toHaveLength(2)
    expect(result[1].sectionLabel).toBe('Section B')
    expect(result[1].sessions).toHaveLength(1)
  })

  it('should use default key when sectionLabel is empty', () => {
    const sessions = [{ sectionLabel: '', sectionTitle: '', sessionId: 's-0' }]
    const result = buildSectionGroups(sessions)
    expect(result[0].sectionLabel).toBe('default')
  })

  it('should handle empty sessions array', () => {
    expect(buildSectionGroups([])).toEqual([])
  })
})

describe('buildListeningResultSessions', () => {
  it('should group questions by section label', () => {
    const questions = [
      { id: 1, questionNo: 1 },
      { id: 2, questionNo: 2 },
      { id: 3, questionNo: 8 },
      { id: 4, questionNo: 16 },
    ]
    const result = buildListeningResultSessions(questions)

    expect(result).toHaveLength(3)
    expect(result[0].sessionId).toBe('Section A')
    expect(result[0].sessionTitle).toBe('Section A · News Report')
    expect(result[0].questions).toHaveLength(2)

    expect(result[1].sessionId).toBe('Section B')
    expect(result[1].sessionTitle).toBe('Section B · Conversation')
    expect(result[1].questions).toHaveLength(1)

    expect(result[2].sessionId).toBe('Section C')
    expect(result[2].sessionTitle).toBe('Section C · Passage')
    expect(result[2].questions).toHaveLength(1)
  })

  it('should handle empty questions array', () => {
    expect(buildListeningResultSessions([])).toEqual([])
  })
})

describe('buildReadingResultSessions', () => {
  it('should group questions by part and sort by RESULT_PART_ORDER', () => {
    const questions = [
      { id: 1, part: 'reading_a' },
      { id: 2, part: 'reading_b' },
      { id: 3, part: 'reading_c' },
    ]
    const result = buildReadingResultSessions(questions)

    expect(result).toHaveLength(3)
    // reading_a, reading_b, reading_c all have RESULT_PART_ORDER = 3
    // so they maintain Map insertion order
    expect(result.map((s) => s.sessionId)).toEqual(['reading_a', 'reading_b', 'reading_c'])
  })

  it('should sort different part orders correctly', () => {
    const questions = [
      { id: 1, part: 'reading' },
      { id: 2, part: 'reading_a' },
    ]
    const result = buildReadingResultSessions(questions)
    // reading has order 3, reading_a also has order 3
    // Map insertion order is preserved
    expect(result.map((s) => s.sessionId)).toEqual(['reading', 'reading_a'])
  })

  it('should default part to reading when not specified', () => {
    const questions = [{ id: 1 }, { id: 2 }]
    const result = buildReadingResultSessions(questions)
    expect(result).toHaveLength(1)
    expect(result[0].sessionId).toBe('reading')
  })

  it('should use RESULT_PART_LABELS for sessionTitle', () => {
    const questions = [{ id: 1, part: 'reading_a' }]
    const result = buildReadingResultSessions(questions)
    expect(result[0].sessionTitle).toBe('选词填空')
  })

  it('should handle empty questions array', () => {
    expect(buildReadingResultSessions([])).toEqual([])
  })
})

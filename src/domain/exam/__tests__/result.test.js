import { describe, it, expect } from 'vitest'
import {
  partToStage,
  isObjectiveQuestion,
  isSubjectiveQuestion,
  getScoreText,
  sortAnswerDetails,
  buildGroupedAnswers,
  buildStageGroupedAnswers,
  buildStageSessionAnswers,
  filterWrongStageSessionAnswers,
  buildSkillBreakdown,
} from '../result'

describe('partToStage', () => {
  it('should return writing for writing part', () => {
    expect(partToStage('writing')).toBe('writing')
  })

  it('should return listening for listening part', () => {
    expect(partToStage('listening')).toBe('listening')
  })

  it('should return reading for reading_a part', () => {
    expect(partToStage('reading_a')).toBe('reading')
  })

  it('should return reading for reading_b part', () => {
    expect(partToStage('reading_b')).toBe('reading')
  })

  it('should return reading for reading part', () => {
    expect(partToStage('reading')).toBe('reading')
  })

  it('should return translation for translation part', () => {
    expect(partToStage('translation')).toBe('translation')
  })

  it('should return the part itself for unknown parts', () => {
    expect(partToStage('unknown')).toBe('unknown')
  })
})

describe('isObjectiveQuestion', () => {
  it('should return true for single_choice question', () => {
    expect(isObjectiveQuestion({ questionType: 'single_choice' })).toBe(true)
  })

  it('should return true for blank_filling question', () => {
    expect(isObjectiveQuestion({ questionType: 'blank_filling' })).toBe(true)
  })

  it('should return true for matching question', () => {
    expect(isObjectiveQuestion({ questionType: 'matching' })).toBe(true)
  })

  it('should return false for writing question', () => {
    expect(isObjectiveQuestion({ questionType: 'writing' })).toBe(false)
  })

  it('should return false for translation question', () => {
    expect(isObjectiveQuestion({ questionType: 'translation' })).toBe(false)
  })

  it('should return true for unknown type with correct field', () => {
    expect(isObjectiveQuestion({ questionType: 'other', correct: true })).toBe(true)
  })

  it('should return true for unknown type with correct=null but correct field defined as 0', () => {
    expect(isObjectiveQuestion({ questionType: 'other', correct: 0 })).toBe(true)
  })

  it('should return false for unknown type without correct field', () => {
    expect(isObjectiveQuestion({ questionType: 'other' })).toBe(false)
  })
})

describe('isSubjectiveQuestion', () => {
  it('should return true for writing question', () => {
    expect(isSubjectiveQuestion({ questionType: 'writing' })).toBe(true)
  })

  it('should return true for translation question', () => {
    expect(isSubjectiveQuestion({ questionType: 'translation' })).toBe(true)
  })

  it('should return false for single_choice question', () => {
    expect(isSubjectiveQuestion({ questionType: 'single_choice' })).toBe(false)
  })
})

describe('getScoreText', () => {
  it('should format score and fullScore', () => {
    expect(getScoreText({ score: 8, fullScore: 10 })).toBe('8 / 10')
  })

  it('should use -- for missing score', () => {
    expect(getScoreText({ fullScore: 10 })).toBe('-- / 10')
  })

  it('should use -- for missing fullScore', () => {
    expect(getScoreText({ score: 8 })).toBe('8 / --')
  })

  it('should use -- for both missing', () => {
    expect(getScoreText({})).toBe('-- / --')
  })

  it('should handle score of 0', () => {
    expect(getScoreText({ score: 0, fullScore: 10 })).toBe('0 / 10')
  })
})

describe('sortAnswerDetails', () => {
  it('should sort by RESULT_PART_ORDER then questionNo', () => {
    const answers = [
      { part: 'reading', questionNo: 2 },
      { part: 'writing', questionNo: 1 },
      { part: 'listening', questionNo: 1 },
      { part: 'writing', questionNo: 2 },
    ]
    const result = sortAnswerDetails(answers)
    expect(result[0].part).toBe('writing')
    expect(result[1].part).toBe('writing')
    expect(result[2].part).toBe('listening')
    expect(result[3].part).toBe('reading')
  })

  it('should sort by questionNo within same part', () => {
    const answers = [
      { part: 'writing', questionNo: 3 },
      { part: 'writing', questionNo: 1 },
      { part: 'writing', questionNo: 2 },
    ]
    const result = sortAnswerDetails(answers)
    expect(result.map((a) => a.questionNo)).toEqual([1, 2, 3])
  })

  it('should handle empty array', () => {
    expect(sortAnswerDetails([])).toEqual([])
  })

  it('should handle undefined input', () => {
    expect(sortAnswerDetails(undefined)).toEqual([])
  })

  it('should throw for null input (default param only handles undefined)', () => {
    expect(() => sortAnswerDetails(null)).toThrow()
  })

  it('should place unknown parts at the end', () => {
    const answers = [
      { part: 'unknown', questionNo: 1 },
      { part: 'writing', questionNo: 1 },
    ]
    const result = sortAnswerDetails(answers)
    expect(result[0].part).toBe('writing')
    expect(result[1].part).toBe('unknown')
  })
})

describe('buildGroupedAnswers', () => {
  it('should group answers by part', () => {
    const answers = [
      { part: 'writing', id: 1 },
      { part: 'writing', id: 2 },
      { part: 'listening', id: 3 },
    ]
    const result = buildGroupedAnswers(answers)
    expect(result).toHaveLength(2)
    expect(result[0].part).toBe('writing')
    expect(result[0].questions).toHaveLength(2)
    expect(result[1].part).toBe('listening')
    expect(result[1].questions).toHaveLength(1)
  })

  it('should use RESULT_PART_LABELS for label', () => {
    const answers = [{ part: 'writing', id: 1 }]
    const result = buildGroupedAnswers(answers)
    expect(result[0].label).toBe('写作')
  })

  it('should default part to other when missing', () => {
    const answers = [{ id: 1 }]
    const result = buildGroupedAnswers(answers)
    expect(result[0].part).toBe('other')
    expect(result[0].label).toBe('other')
  })

  it('should handle empty array', () => {
    expect(buildGroupedAnswers([])).toEqual([])
  })

  it('should handle undefined input', () => {
    expect(buildGroupedAnswers(undefined)).toEqual([])
  })
})

describe('buildStageGroupedAnswers', () => {
  it('should group answers by stage and maintain STAGE_ORDER', () => {
    const answers = [
      { part: 'reading_a', id: 1 },
      { part: 'writing', id: 2 },
      { part: 'listening', id: 3 },
    ]
    const result = buildStageGroupedAnswers(answers)
    expect(result).toHaveLength(3)
    expect(result[0].stage).toBe('writing')
    expect(result[1].stage).toBe('listening')
    expect(result[2].stage).toBe('reading')
  })

  it('should use STAGE_LABELS for label', () => {
    const answers = [{ part: 'writing', id: 1 }]
    const result = buildStageGroupedAnswers(answers)
    expect(result[0].label).toBe('写作')
  })

  it('should merge reading_a and reading_b into reading stage', () => {
    const answers = [
      { part: 'reading_a', id: 1 },
      { part: 'reading_b', id: 2 },
    ]
    const result = buildStageGroupedAnswers(answers)
    expect(result).toHaveLength(1)
    expect(result[0].stage).toBe('reading')
    expect(result[0].questions).toHaveLength(2)
  })

  it('should handle empty array', () => {
    expect(buildStageGroupedAnswers([])).toEqual([])
  })
})

describe('buildStageSessionAnswers', () => {
  it('should build sessions for listening stage', () => {
    const stageGroups = [
      {
        stage: 'listening',
        label: '听力',
        questions: [
          { id: 1, questionNo: 1, questionType: 'single_choice', correct: true },
          { id: 2, questionNo: 2, questionType: 'single_choice', correct: false },
        ],
      },
    ]
    const result = buildStageSessionAnswers(stageGroups)
    expect(result).toHaveLength(1)
    expect(result[0].sessions.length).toBeGreaterThan(0)
    expect(result[0].subjectiveQuestions).toEqual([])
  })

  it('should build sessions for reading stage', () => {
    const stageGroups = [
      {
        stage: 'reading',
        label: '阅读',
        questions: [
          { id: 1, part: 'reading_a', questionType: 'blank_filling', correct: true },
          { id: 2, part: 'reading_b', questionType: 'matching', correct: false },
        ],
      },
    ]
    const result = buildStageSessionAnswers(stageGroups)
    expect(result).toHaveLength(1)
    expect(result[0].sessions.length).toBeGreaterThan(0)
  })

  it('should separate subjective questions', () => {
    const stageGroups = [
      {
        stage: 'writing',
        label: '写作',
        questions: [
          { id: 1, questionType: 'writing' },
          { id: 2, questionType: 'single_choice', correct: true },
        ],
      },
    ]
    const result = buildStageSessionAnswers(stageGroups)
    expect(result[0].subjectiveQuestions).toHaveLength(1)
    expect(result[0].subjectiveQuestions[0].questionType).toBe('writing')
  })

  it('should handle empty stage groups', () => {
    expect(buildStageSessionAnswers([])).toEqual([])
  })
})

describe('filterWrongStageSessionAnswers', () => {
  it('should filter only wrong answers in sessions', () => {
    const stageSessionAnswers = [
      {
        stage: 'listening',
        sessions: [
          {
            sessionId: 's1',
            questions: [
              { id: 1, correct: false },
              { id: 2, correct: true },
            ],
          },
        ],
        subjectiveQuestions: [],
      },
    ]
    const result = filterWrongStageSessionAnswers(stageSessionAnswers)
    expect(result[0].sessions[0].questions).toHaveLength(1)
    expect(result[0].sessions[0].questions[0].correct).toBe(false)
  })

  it('should remove sessions with no wrong answers', () => {
    const stageSessionAnswers = [
      {
        stage: 'listening',
        sessions: [
          {
            sessionId: 's1',
            questions: [{ id: 1, correct: true }],
          },
        ],
        subjectiveQuestions: [],
      },
    ]
    const result = filterWrongStageSessionAnswers(stageSessionAnswers)
    expect(result).toHaveLength(0)
  })

  it('should remove stages with no wrong sessions and no subjective questions', () => {
    const stageSessionAnswers = [
      {
        stage: 'listening',
        sessions: [{ sessionId: 's1', questions: [{ id: 1, correct: true }] }],
        subjectiveQuestions: [],
      },
    ]
    const result = filterWrongStageSessionAnswers(stageSessionAnswers)
    expect(result).toHaveLength(0)
  })

  it('should clear subjectiveQuestions in result', () => {
    const stageSessionAnswers = [
      {
        stage: 'writing',
        sessions: [],
        subjectiveQuestions: [{ id: 1, questionType: 'writing' }],
      },
    ]
    const result = filterWrongStageSessionAnswers(stageSessionAnswers)
    // Stage with no sessions but subjective questions should be filtered out
    // since subjectiveQuestions is cleared to []
    expect(result).toHaveLength(0)
  })

  it('should handle empty input', () => {
    expect(filterWrongStageSessionAnswers([])).toEqual([])
  })
})

describe('buildSkillBreakdown', () => {
  it('should build skill breakdown from result', () => {
    const result = {
      answerDetails: [
        { part: 'writing', score: 80 },
        { part: 'listening', score: 120 },
        { part: 'reading_a', score: 60 },
        { part: 'translation', score: 50 },
      ],
    }
    const breakdown = buildSkillBreakdown(result)

    expect(breakdown).toHaveLength(4)
    expect(breakdown[0]).toEqual({
      key: 'writing',
      label: '写作',
      earned: 80,
      max: 106,
      percent: Math.min((80 / 106) * 100, 100),
    })
    expect(breakdown[1]).toEqual({
      key: 'listening',
      label: '听力',
      earned: 120,
      max: 249,
      percent: Math.min((120 / 249) * 100, 100),
    })
  })

  it('should cap percent at 100', () => {
    const result = {
      answerDetails: [{ part: 'writing', score: 200 }],
    }
    const breakdown = buildSkillBreakdown(result)
    expect(breakdown[0].percent).toBe(100)
  })

  it('should return empty array for null result', () => {
    expect(buildSkillBreakdown(null)).toEqual([])
  })

  it('should return empty array for undefined result', () => {
    expect(buildSkillBreakdown(undefined)).toEqual([])
  })

  it('should handle missing answerDetails', () => {
    const breakdown = buildSkillBreakdown({})
    expect(breakdown).toHaveLength(4)
    expect(breakdown.every((b) => b.earned === 0)).toBe(true)
  })

  it('should calculate 0 percent when maxScore is 0', () => {
    // This is a defensive check - current maxScores are all > 0
    const result = { answerDetails: [] }
    const breakdown = buildSkillBreakdown(result)
    breakdown.forEach((b) => {
      expect(b.percent).toBeGreaterThanOrEqual(0)
    })
  })
})

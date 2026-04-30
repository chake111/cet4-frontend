import {
  OBJECTIVE_QUESTION_TYPES,
  RESULT_PART_LABELS,
  RESULT_PART_ORDER,
  STAGE_LABELS,
  STAGE_ORDER,
  SUBJECTIVE_QUESTION_TYPES,
} from '@/constants/exam'
import { buildListeningResultSessions, buildReadingResultSessions } from '@/utils/examGrouping'

export const partToStage = (part) => {
  if (part === 'writing') return 'writing'
  if (part === 'listening') return 'listening'
  if (part && part.startsWith('reading')) return 'reading'
  if (part === 'translation') return 'translation'
  return part
}

export const isObjectiveQuestion = (question) => {
  if (OBJECTIVE_QUESTION_TYPES.includes(question.questionType)) return true
  if (SUBJECTIVE_QUESTION_TYPES.includes(question.questionType)) return false
  return question.correct !== null && question.correct !== undefined
}

export const isSubjectiveQuestion = (question) => SUBJECTIVE_QUESTION_TYPES.includes(question.questionType)

export const getScoreText = (question) => {
  const score = question.score ?? '--'
  const fullScore = question.fullScore ?? '--'
  return `${score} / ${fullScore}`
}

export const sortAnswerDetails = (answers = []) => {
  return [...answers].sort((a, b) => {
    const pa = RESULT_PART_ORDER[a.part] || 99
    const pb = RESULT_PART_ORDER[b.part] || 99
    if (pa !== pb) return pa - pb
    return (a.questionNo || 0) - (b.questionNo || 0)
  })
}

export const buildGroupedAnswers = (answers = []) => {
  const groupMap = new Map()

  for (const item of answers) {
    const partKey = item.part || 'other'
    if (!groupMap.has(partKey)) {
      groupMap.set(partKey, {
        part: partKey,
        label: RESULT_PART_LABELS[partKey] || partKey,
        questions: [],
      })
    }
    groupMap.get(partKey).questions.push(item)
  }

  return [...groupMap.values()]
}

export const buildStageGroupedAnswers = (answers = []) => {
  const groupMap = new Map()

  for (const item of answers) {
    const stageKey = partToStage(item.part)
    if (!groupMap.has(stageKey)) {
      groupMap.set(stageKey, {
        stage: stageKey,
        label: STAGE_LABELS[stageKey] || stageKey,
        questions: [],
      })
    }
    groupMap.get(stageKey).questions.push(item)
  }

  return STAGE_ORDER.filter((key) => groupMap.has(key)).map((key) => groupMap.get(key))
}

export const buildStageSessionAnswers = (stageGroups = []) => {
  return stageGroups.map((stage) => {
    const objectiveQuestions = stage.questions.filter((q) => isObjectiveQuestion(q))
    const subjectiveQuestions = stage.questions.filter((q) => isSubjectiveQuestion(q))

    let sessions = []
    if (stage.stage === 'listening' && objectiveQuestions.length > 0) {
      sessions = buildListeningResultSessions(objectiveQuestions)
    } else if (stage.stage === 'reading' && objectiveQuestions.length > 0) {
      sessions = buildReadingResultSessions(objectiveQuestions)
    } else if (objectiveQuestions.length > 0) {
      sessions = [{ sessionId: 'default', sessionTitle: '', questions: objectiveQuestions }]
    }

    return {
      ...stage,
      sessions,
      subjectiveQuestions,
    }
  })
}

export const filterWrongStageSessionAnswers = (stageSessionAnswers = []) => {
  return stageSessionAnswers
    .map((stage) => {
      const filteredSessions = stage.sessions
        .map((session) => ({
          ...session,
          questions: session.questions.filter((q) => q.correct === false),
        }))
        .filter((session) => session.questions.length > 0)

      return {
        ...stage,
        sessions: filteredSessions,
        subjectiveQuestions: [],
      }
    })
    .filter((stage) => stage.sessions.length > 0 || stage.subjectiveQuestions.length > 0)
}

export const buildSkillBreakdown = (result) => {
  if (!result) return []

  const stages = [
    { key: 'writing', label: STAGE_LABELS.writing, maxScore: 106 },
    { key: 'listening', label: STAGE_LABELS.listening, maxScore: 249 },
    { key: 'reading', label: STAGE_LABELS.reading, maxScore: 249 },
    { key: 'translation', label: STAGE_LABELS.translation, maxScore: 106 },
  ]
  const answers = result.answerDetails || []

  return stages.map((stage) => {
    const stageAnswers = answers.filter((answer) => partToStage(answer.part) === stage.key)
    const earned = stageAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0)

    return {
      key: stage.key,
      label: stage.label,
      earned,
      max: stage.maxScore,
      percent: stage.maxScore > 0 ? Math.min((earned / stage.maxScore) * 100, 100) : 0,
    }
  })
}

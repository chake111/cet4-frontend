export const EXAM_TITLE = 'CET-4 模拟考试'

export const EXAM_TOTAL_SCORE = 710

export const TIMER_TICK_MS = 1000

export const TIMER_DANGER_SECONDS = 300

// Domain constants — re-export from domain layer for backward compatibility
export {
  STAGE_DURATIONS,
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_LIST,
  RESULT_PART_ORDER,
  RESULT_PART_LABELS,
  QUESTION_TYPE_LABELS,
  OBJECTIVE_QUESTION_TYPES,
  SUBJECTIVE_QUESTION_TYPES,
} from '@/domain/exam/constants'

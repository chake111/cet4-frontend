export const STAGE_DURATIONS = {
  writing: 1800,
  listening: 1500,
  reading: 2700,
  translation: 1500,
}

export const STAGE_ORDER = ['writing', 'listening', 'reading', 'translation']

export const STAGE_LABELS = {
  writing: '写作',
  listening: '听力',
  reading: '阅读',
  translation: '翻译',
}

export const STAGE_LIST = STAGE_ORDER.map((key) => ({
  key,
  label: STAGE_LABELS[key],
  duration: STAGE_DURATIONS[key] / 60,
}))

export const RESULT_PART_ORDER = {
  writing: 1,
  listening: 2,
  reading_a: 3,
  reading_b: 3,
  reading: 3,
  reading_c: 3,
  translation: 4,
}

export const RESULT_PART_LABELS = {
  writing: '写作',
  listening: '听力',
  reading_a: '选词填空',
  reading_b: '段落匹配',
  reading: '阅读理解',
  reading_c: '阅读理解',
  translation: '翻译',
}

export const QUESTION_TYPE_LABELS = {
  single_choice: '选择题',
  blank_filling: '填空题',
  matching: '匹配题',
  writing: '写作题',
  translation: '翻译题',
}

export const OBJECTIVE_QUESTION_TYPES = ['single_choice', 'blank_filling', 'matching']

export const SUBJECTIVE_QUESTION_TYPES = ['writing', 'translation']

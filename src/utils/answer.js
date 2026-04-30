export const UNANSWERED_TEXT = '未作答'

export const normalizeAnswer = (answer) => {
  if (answer === null || answer === undefined || answer === '') return UNANSWERED_TEXT
  if (Array.isArray(answer)) return answer.join('、')
  return String(answer)
}

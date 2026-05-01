export const parseAiFeedback = (feedback) => {
  if (!feedback) return null
  if (typeof feedback === 'object') return feedback

  try {
    return JSON.parse(feedback)
  } catch {
    return null
  }
}

export const isStructuredFeedback = (feedback) => {
  const parsed = parseAiFeedback(feedback)
  if (!parsed || typeof parsed !== 'object') return false

  return Boolean(
    parsed.overall ||
    parsed.strengths ||
    parsed.weaknesses ||
    parsed.suggestions ||
    parsed.accuracy ||
    parsed.expression
  )
}

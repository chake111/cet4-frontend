export function transformQuestion(q, stage) {
  const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter((opt) => opt != null)

  let content

  switch (stage) {
    case 'writing':
      content = { title: q.content }
      break
    case 'listening':
      content = { stem: q.content, options }
      break
    case 'reading':
      content = transformReadingContent(q, options)
      break
    case 'translation':
      content = { source: q.content }
      break
    default:
      content = { stem: q.content }
  }

  return { ...q, content }
}

function transformReadingContent(q, options) {
  const passagePayload = parsePassagePayload(q.passage)

  if (q.questionType === 'blank_filling') {
    return {
      stem: q.content,
      passage: passagePayload.article,
      wordBank: passagePayload.wordBank,
      type: 'blank_filling',
    }
  }

  if (q.questionType === 'matching') {
    return {
      stem: q.content,
      passage: passagePayload.article,
      type: 'matching',
    }
  }

  return {
    stem: q.content,
    passage: passagePayload.article,
    options,
    type: 'single_choice',
  }
}

export function parsePassagePayload(passage) {
  if (!passage) {
    return {
      article: '',
      wordBank: [],
    }
  }

  if (typeof passage === 'object') {
    return {
      article: passage.article || '',
      wordBank: passage.word_bank || passage.wordBank || [],
    }
  }

  try {
    const parsed = JSON.parse(passage)
    if (parsed && typeof parsed === 'object' && parsed.article) {
      return {
        article: parsed.article,
        wordBank: parsed.word_bank || parsed.wordBank || [],
      }
    }
  } catch {
    const looseParsed = parseLoosePassageJson(passage)
    if (looseParsed) return looseParsed
  }

  return {
    article: passage,
    wordBank: [],
  }
}

function parseLoosePassageJson(passage) {
  if (typeof passage !== 'string' || !passage.includes('"article"')) return null

  const articleMatch = passage.match(
    /"article"\s*:\s*"([\s\S]*?)"\s*,\s*"(?:word_bank|wordBank)"\s*:/
  )
  if (!articleMatch) return null

  const wordBankMatch = passage.match(/"(?:word_bank|wordBank)"\s*:\s*(\[[\s\S]*?\])\s*\}?$/)

  return {
    article: unescapeJsonString(articleMatch[1]),
    wordBank: parseLooseWordBank(wordBankMatch?.[1]),
  }
}

function parseLooseWordBank(value) {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return Array.from(value.matchAll(/"([^"]+)"/g), (match) => unescapeJsonString(match[1]))
  }
}

function unescapeJsonString(value) {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
}

export function propagateListeningSessions(questions) {
  const stemToSessionId = new Map()
  let sessionCounter = 0

  return questions.map((q) => {
    const stem = q.content?.stem || ''
    if (!stemToSessionId.has(stem)) {
      stemToSessionId.set(stem, `listening-${sessionCounter}`)
      sessionCounter += 1
    }

    return {
      ...q,
      sessionId: stemToSessionId.get(stem),
      sharedStem: stem,
    }
  })
}

export function propagateReadingPassages(questions) {
  let currentPassage = null
  let currentGroupId = 0
  let currentWordBank = null

  return questions.map((q) => {
    if (q.content.passage) {
      currentPassage = q.content.passage
      currentGroupId += 1
      currentWordBank = q.content.wordBank || null
    }

    return {
      ...q,
      content: {
        ...q.content,
        passage: q.content.passage || currentPassage,
        wordBank: q.content.wordBank?.length ? q.content.wordBank : currentWordBank,
      },
      passageGroupId: currentGroupId,
      sessionId: `reading-${currentGroupId}`,
    }
  })
}

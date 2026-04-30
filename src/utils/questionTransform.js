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
  if (q.questionType === 'blank_filling') {
    let passageData = null
    try {
      passageData = q.passage ? JSON.parse(q.passage) : null
    } catch {
      passageData = null
    }

    return {
      stem: q.content,
      passage: passageData?.article || q.passage,
      wordBank: passageData?.word_bank || [],
      type: 'blank_filling',
    }
  }

  if (q.questionType === 'matching') {
    return {
      stem: q.content,
      passage: q.passage,
      type: 'matching',
    }
  }

  return {
    stem: q.content,
    passage: q.passage,
    options,
    type: 'single_choice',
  }
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

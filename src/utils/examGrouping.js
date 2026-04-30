import { RESULT_PART_LABELS, RESULT_PART_ORDER } from '@/constants/exam'

export function getListeningSectionInfo(questionNo) {
  if (questionNo <= 7) return { sectionLabel: 'Section A', sectionTitle: 'News Report' }
  if (questionNo <= 15) return { sectionLabel: 'Section B', sectionTitle: 'Conversation' }
  return { sectionLabel: 'Section C', sectionTitle: 'Passage' }
}

export function buildSessionGroups(questions, stage) {
  const map = new Map()

  for (const q of questions) {
    const key = q.sessionId || String(q.id)
    if (!map.has(key)) {
      map.set(key, {
        sessionId: key,
        sessionTitle: '',
        sharedStem: q.sharedStem || '',
        section: stage,
        sectionLabel: '',
        sectionTitle: '',
        questions: [],
      })
    }
    map.get(key).questions.push(q)
  }

  const sessions = Array.from(map.values())

  if (stage === 'listening') {
    let newsCount = 0
    let convCount = 0
    let passageCount = 0

    for (const session of sessions) {
      const firstQ = session.questions[0]
      const qNo = firstQ.questionNo
      const sectionInfo = getListeningSectionInfo(qNo)
      session.sectionLabel = sectionInfo.sectionLabel
      session.sectionTitle = sectionInfo.sectionTitle

      if (qNo <= 7) {
        newsCount += 1
        session.sessionTitle = `News Report ${newsCount}`
      } else if (qNo <= 15) {
        convCount += 1
        session.sessionTitle = `Conversation ${convCount}`
      } else {
        passageCount += 1
        session.sessionTitle = `Passage ${passageCount}`
      }
    }
  }

  if (stage === 'reading') {
    let blankCount = 0
    let matchingCount = 0
    let choiceCount = 0

    for (const session of sessions) {
      const type = session.questions[0]?.content?.type
      if (type === 'blank_filling') {
        blankCount += 1
        session.sessionTitle = `选词填空 ${blankCount}`
        session.sectionLabel = 'Section A'
        session.sectionTitle = '选词填空'
      } else if (type === 'matching') {
        matchingCount += 1
        session.sessionTitle = `段落匹配 ${matchingCount}`
        session.sectionLabel = 'Section B'
        session.sectionTitle = '段落匹配'
      } else {
        choiceCount += 1
        session.sessionTitle = `仔细阅读 ${choiceCount}`
        session.sectionLabel = 'Section C'
        session.sectionTitle = '仔细阅读'
      }
    }
  }

  return sessions
}

export function buildSectionGroups(sessionGroups) {
  const map = new Map()

  for (const session of sessionGroups) {
    const key = session.sectionLabel || 'default'
    if (!map.has(key)) {
      map.set(key, {
        sectionLabel: key,
        sectionTitle: session.sectionTitle || '',
        sessions: [],
      })
    }
    map.get(key).sessions.push(session)
  }

  return Array.from(map.values())
}

export function buildListeningResultSessions(questions) {
  const sectionMap = new Map()

  for (const q of questions) {
    const info = getListeningSectionInfo(q.questionNo)
    const key = info.sectionLabel
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        sessionId: key,
        sessionTitle: `${info.sectionLabel} · ${info.sectionTitle}`,
        questions: [],
      })
    }
    sectionMap.get(key).questions.push(q)
  }

  return Array.from(sectionMap.values())
}

export function buildReadingResultSessions(questions) {
  const partMap = new Map()

  for (const q of questions) {
    const partKey = q.part || 'reading'
    if (!partMap.has(partKey)) {
      partMap.set(partKey, {
        sessionId: partKey,
        sessionTitle: RESULT_PART_LABELS[partKey] || partKey,
        questions: [],
      })
    }
    partMap.get(partKey).questions.push(q)
  }

  return Array.from(partMap.values()).sort((a, b) => {
    return (RESULT_PART_ORDER[a.sessionId] || 99) - (RESULT_PART_ORDER[b.sessionId] || 99)
  })
}

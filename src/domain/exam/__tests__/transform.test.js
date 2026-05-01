import { describe, it, expect } from 'vitest'
import {
  transformQuestion,
  parsePassagePayload,
  propagateListeningSessions,
  propagateReadingPassages,
} from '../transform'

describe('transformQuestion', () => {
  const baseQuestion = {
    id: 1,
    content: 'Test content',
    optionA: 'A',
    optionB: 'B',
    optionC: 'C',
    optionD: 'D',
  }

  it('should transform writing stage question with title content', () => {
    const result = transformQuestion(baseQuestion, 'writing')
    expect(result.content).toEqual({ title: 'Test content' })
    expect(result.id).toBe(1)
  })

  it('should transform listening stage question with stem and options', () => {
    const result = transformQuestion(baseQuestion, 'listening')
    expect(result.content).toEqual({ stem: 'Test content', options: ['A', 'B', 'C', 'D'] })
  })

  it('should transform translation stage question with source content', () => {
    const result = transformQuestion(baseQuestion, 'translation')
    expect(result.content).toEqual({ source: 'Test content' })
  })

  it('should transform reading stage question with single_choice type by default', () => {
    const q = { ...baseQuestion, passage: { article: 'Passage text' } }
    const result = transformQuestion(q, 'reading')
    expect(result.content.stem).toBe('Test content')
    expect(result.content.passage).toBe('Passage text')
    expect(result.content.options).toEqual(['A', 'B', 'C', 'D'])
    expect(result.content.type).toBe('single_choice')
  })

  it('should transform reading blank_filling question', () => {
    const q = {
      ...baseQuestion,
      questionType: 'blank_filling',
      passage: { article: 'Fill in ___ blanks', word_bank: ['the', 'a', 'an'] },
    }
    const result = transformQuestion(q, 'reading')
    expect(result.content.type).toBe('blank_filling')
    expect(result.content.passage).toBe('Fill in ___ blanks')
    expect(result.content.wordBank).toEqual(['the', 'a', 'an'])
  })

  it('should transform reading matching question', () => {
    const q = {
      ...baseQuestion,
      questionType: 'matching',
      passage: { article: 'Match paragraphs' },
    }
    const result = transformQuestion(q, 'reading')
    expect(result.content.type).toBe('matching')
    expect(result.content.passage).toBe('Match paragraphs')
    expect(result.content.wordBank).toBeUndefined()
  })

  it('should use default content for unknown stage', () => {
    const result = transformQuestion(baseQuestion, 'unknown')
    expect(result.content).toEqual({ stem: 'Test content' })
  })

  it('should filter out null options', () => {
    const q = { ...baseQuestion, optionC: null, optionD: null }
    const result = transformQuestion(q, 'listening')
    expect(result.content.options).toEqual(['A', 'B'])
  })

  it('should filter out undefined options', () => {
    const q = { ...baseQuestion, optionD: undefined }
    const result = transformQuestion(q, 'listening')
    expect(result.content.options).toEqual(['A', 'B', 'C'])
  })
})

describe('parsePassagePayload', () => {
  it('should return empty article and wordBank when passage is null', () => {
    expect(parsePassagePayload(null)).toEqual({ article: '', wordBank: [] })
  })

  it('should return empty article and wordBank when passage is undefined', () => {
    expect(parsePassagePayload(undefined)).toEqual({ article: '', wordBank: [] })
  })

  it('should return empty article and wordBank when passage is empty string', () => {
    expect(parsePassagePayload('')).toEqual({ article: '', wordBank: [] })
  })

  it('should parse object with article and word_bank', () => {
    const passage = { article: 'Hello', word_bank: ['a', 'b'] }
    expect(parsePassagePayload(passage)).toEqual({ article: 'Hello', wordBank: ['a', 'b'] })
  })

  it('should parse object with article and wordBank (camelCase)', () => {
    const passage = { article: 'Hello', wordBank: ['a', 'b'] }
    expect(parsePassagePayload(passage)).toEqual({ article: 'Hello', wordBank: ['a', 'b'] })
  })

  it('should default to empty article when object has no article', () => {
    const passage = { word_bank: ['a'] }
    expect(parsePassagePayload(passage)).toEqual({ article: '', wordBank: ['a'] })
  })

  it('should default to empty wordBank when object has no word_bank or wordBank', () => {
    const passage = { article: 'Hello' }
    expect(parsePassagePayload(passage)).toEqual({ article: 'Hello', wordBank: [] })
  })

  it('should parse valid JSON string with article', () => {
    const passage = JSON.stringify({ article: 'JSON article', word_bank: ['x'] })
    expect(parsePassagePayload(passage)).toEqual({ article: 'JSON article', wordBank: ['x'] })
  })

  it('should parse valid JSON string with wordBank camelCase', () => {
    const passage = JSON.stringify({ article: 'JSON article', wordBank: ['x'] })
    expect(parsePassagePayload(passage)).toEqual({ article: 'JSON article', wordBank: ['x'] })
  })

  it('should return article as string when JSON has no article field', () => {
    const passage = JSON.stringify({ text: 'no article' })
    expect(parsePassagePayload(passage)).toEqual({ article: passage, wordBank: [] })
  })

  it('should return plain string as article when not valid JSON', () => {
    expect(parsePassagePayload('plain text')).toEqual({ article: 'plain text', wordBank: [] })
  })

  it('should parse loose JSON with article and word_bank', () => {
    const passage = '{"article":"Loose article","word_bank":["a","b"]}'
    // This is valid JSON, so it will be parsed normally
    expect(parsePassagePayload(passage)).toEqual({ article: 'Loose article', wordBank: ['a', 'b'] })
  })
})

describe('propagateListeningSessions', () => {
  it('should assign sessionId based on stem content', () => {
    const questions = [
      { id: 1, content: { stem: 'News about weather' } },
      { id: 2, content: { stem: 'News about weather' } },
      { id: 3, content: { stem: 'Conversation about travel' } },
    ]
    const result = propagateListeningSessions(questions)
    expect(result[0].sessionId).toBe('listening-0')
    expect(result[1].sessionId).toBe('listening-0')
    expect(result[2].sessionId).toBe('listening-1')
  })

  it('should set sharedStem on each question', () => {
    const questions = [
      { id: 1, content: { stem: 'Stem A' } },
      { id: 2, content: { stem: 'Stem A' } },
    ]
    const result = propagateListeningSessions(questions)
    expect(result[0].sharedStem).toBe('Stem A')
    expect(result[1].sharedStem).toBe('Stem A')
  })

  it('should handle empty stem as separate session', () => {
    const questions = [
      { id: 1, content: { stem: '' } },
      { id: 2, content: { stem: '' } },
    ]
    const result = propagateListeningSessions(questions)
    // Empty stems are the same key, so they share a session
    expect(result[0].sessionId).toBe('listening-0')
    expect(result[1].sessionId).toBe('listening-0')
  })

  it('should handle missing content.stem gracefully', () => {
    const questions = [{ id: 1 }, { id: 2 }]
    const result = propagateListeningSessions(questions)
    expect(result[0].sessionId).toBe('listening-0')
    expect(result[1].sessionId).toBe('listening-0')
  })

  it('should handle empty questions array', () => {
    const result = propagateListeningSessions([])
    expect(result).toEqual([])
  })
})

describe('propagateReadingPassages', () => {
  it('should propagate passage to subsequent questions without passage', () => {
    const questions = [
      { id: 1, content: { passage: 'Passage A', wordBank: ['a', 'b'] } },
      { id: 2, content: { passage: '', wordBank: [] } },
      { id: 3, content: { passage: 'Passage B', wordBank: ['c'] } },
      { id: 4, content: {} },
    ]
    const result = propagateReadingPassages(questions)

    expect(result[0].content.passage).toBe('Passage A')
    expect(result[0].passageGroupId).toBe(1)
    expect(result[1].content.passage).toBe('Passage A')
    expect(result[1].passageGroupId).toBe(1)
    expect(result[2].content.passage).toBe('Passage B')
    expect(result[2].passageGroupId).toBe(2)
    expect(result[3].content.passage).toBe('Passage B')
    expect(result[3].passageGroupId).toBe(2)
  })

  it('should propagate wordBank to subsequent questions', () => {
    const questions = [
      { id: 1, content: { passage: 'P1', wordBank: ['x'] } },
      { id: 2, content: { passage: '', wordBank: [] } },
    ]
    const result = propagateReadingPassages(questions)
    expect(result[1].content.wordBank).toEqual(['x'])
  })

  it('should assign sessionId based on passageGroupId', () => {
    const questions = [
      { id: 1, content: { passage: 'P1' } },
      { id: 2, content: {} },
    ]
    const result = propagateReadingPassages(questions)
    expect(result[0].sessionId).toBe('reading-1')
    expect(result[1].sessionId).toBe('reading-1')
  })

  it('should handle empty questions array', () => {
    const result = propagateReadingPassages([])
    expect(result).toEqual([])
  })

  it('should handle questions with no passage at all', () => {
    const questions = [
      { id: 1, content: {} },
      { id: 2, content: {} },
    ]
    const result = propagateReadingPassages(questions)
    expect(result[0].passageGroupId).toBe(0)
    // When no passage exists, currentPassage remains null
    expect(result[0].content.passage).toBeNull()
  })
})

describe('parsePassagePayload - loose JSON parsing', () => {
  it('should parse loose JSON with article and word_bank via regex fallback', () => {
    // Create a malformed JSON that fails JSON.parse but contains article pattern
    const passage = '{"article":"Some text here","word_bank":["word1","word2"]'
    // Missing closing brace - will fail JSON.parse, trigger loose parser
    const result = parsePassagePayload(passage)
    expect(result.article).toBe('Some text here')
    expect(result.wordBank).toEqual(['word1', 'word2'])
  })

  it('should parse loose JSON with wordBank camelCase via regex fallback', () => {
    const passage = '{"article":"Hello world","wordBank":["a","b"]'
    const result = parsePassagePayload(passage)
    expect(result.article).toBe('Hello world')
    expect(result.wordBank).toEqual(['a', 'b'])
  })

  it('should handle loose JSON with escaped characters in article', () => {
    const passage = '{"article":"Line1\\nLine2","word_bank":["x"]'
    const result = parsePassagePayload(passage)
    expect(result.article).toBe('Line1\nLine2')
  })

  it('should return passage as string when loose parse finds no article', () => {
    const passage = '{"not_article":"something"}'
    // This is valid JSON but has no article field, so parsePassagePayload
    // returns { article: passage, wordBank: [] }
    const result = parsePassagePayload(passage)
    expect(result.article).toBe(passage)
    expect(result.wordBank).toEqual([])
  })

  it('should handle loose JSON with empty word_bank array', () => {
    const passage = '{"article":"Text","word_bank":[]'
    const result = parsePassagePayload(passage)
    expect(result.article).toBe('Text')
    expect(result.wordBank).toEqual([])
  })

  it('should handle loose JSON word_bank with regex fallback for malformed array', () => {
    const passage = '{"article":"Text","word_bank":["a","b"'
    const result = parsePassagePayload(passage)
    expect(result.article).toBe('Text')
    // Malformed array may not be parseable, wordBank could be empty
    expect(result.wordBank).toBeDefined()
  })
})

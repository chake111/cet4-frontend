import { describe, it, expect } from 'vitest'
import { UNANSWERED_TEXT, normalizeAnswer } from '../answer'

describe('UNANSWERED_TEXT', () => {
  it('should be "未作答"', () => {
    expect(UNANSWERED_TEXT).toBe('未作答')
  })
})

describe('normalizeAnswer', () => {
  it('should return UNANSWERED_TEXT for null', () => {
    expect(normalizeAnswer(null)).toBe('未作答')
  })

  it('should return UNANSWERED_TEXT for undefined', () => {
    expect(normalizeAnswer(undefined)).toBe('未作答')
  })

  it('should return UNANSWERED_TEXT for empty string', () => {
    expect(normalizeAnswer('')).toBe('未作答')
  })

  it('should return string representation of a number', () => {
    expect(normalizeAnswer(42)).toBe('42')
  })

  it('should return string representation of 0', () => {
    expect(normalizeAnswer(0)).toBe('0')
  })

  it('should return the string itself for string input', () => {
    expect(normalizeAnswer('A')).toBe('A')
  })

  it('should join array with Chinese comma', () => {
    expect(normalizeAnswer(['A', 'B', 'C'])).toBe('A、B、C')
  })

  it('should handle single-element array', () => {
    expect(normalizeAnswer(['A'])).toBe('A')
  })

  it('should handle empty array', () => {
    expect(normalizeAnswer([])).toBe('')
  })

  it('should return string for boolean true', () => {
    expect(normalizeAnswer(true)).toBe('true')
  })

  it('should return string for boolean false', () => {
    expect(normalizeAnswer(false)).toBe('false')
  })
})

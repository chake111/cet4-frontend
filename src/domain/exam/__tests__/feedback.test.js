import { describe, it, expect } from 'vitest'
import { parseAiFeedback, isStructuredFeedback } from '../feedback'

describe('parseAiFeedback', () => {
  it('should return null for null input', () => {
    expect(parseAiFeedback(null)).toBeNull()
  })

  it('should return null for undefined input', () => {
    expect(parseAiFeedback(undefined)).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(parseAiFeedback('')).toBeNull()
  })

  it('should return the object directly when input is an object', () => {
    const feedback = { overall: 'Good', strengths: ['vocab'] }
    expect(parseAiFeedback(feedback)).toEqual(feedback)
  })

  it('should parse valid JSON string', () => {
    const feedback = JSON.stringify({ overall: 'Good', strengths: ['vocab'] })
    expect(parseAiFeedback(feedback)).toEqual({ overall: 'Good', strengths: ['vocab'] })
  })

  it('should return null for invalid JSON string', () => {
    expect(parseAiFeedback('not valid json')).toBeNull()
  })

  it('should return parsed string for JSON string of non-object', () => {
    // parseAiFeedback returns whatever JSON.parse returns
    expect(parseAiFeedback('"just a string"')).toBe('just a string')
  })

  it('should return parsed array for JSON array', () => {
    // parseAiFeedback returns whatever JSON.parse returns
    expect(parseAiFeedback('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('should return parsed number for JSON number value', () => {
    // parseAiFeedback returns whatever JSON.parse returns
    expect(parseAiFeedback('42')).toBe(42)
  })
})

describe('isStructuredFeedback', () => {
  it('should return true for object with overall field', () => {
    expect(isStructuredFeedback({ overall: 'Good' })).toBe(true)
  })

  it('should return true for object with strengths field', () => {
    expect(isStructuredFeedback({ strengths: ['vocab'] })).toBe(true)
  })

  it('should return true for object with weaknesses field', () => {
    expect(isStructuredFeedback({ weaknesses: ['grammar'] })).toBe(true)
  })

  it('should return true for object with suggestions field', () => {
    expect(isStructuredFeedback({ suggestions: ['Practice more'] })).toBe(true)
  })

  it('should return true for object with accuracy field', () => {
    expect(isStructuredFeedback({ accuracy: 0.8 })).toBe(true)
  })

  it('should return true for object with expression field', () => {
    expect(isStructuredFeedback({ expression: 'fluent' })).toBe(true)
  })

  it('should return false for object without structured fields', () => {
    expect(isStructuredFeedback({ random: 'data' })).toBe(false)
  })

  it('should return false for null', () => {
    expect(isStructuredFeedback(null)).toBe(false)
  })

  it('should return false for undefined', () => {
    expect(isStructuredFeedback(undefined)).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(isStructuredFeedback('')).toBe(false)
  })

  it('should return true for valid JSON string with structured fields', () => {
    const feedback = JSON.stringify({ overall: 'Good', strengths: ['vocab'] })
    expect(isStructuredFeedback(feedback)).toBe(true)
  })

  it('should return false for invalid JSON string', () => {
    expect(isStructuredFeedback('not json')).toBe(false)
  })

  it('should return false for empty object', () => {
    expect(isStructuredFeedback({})).toBe(false)
  })
})

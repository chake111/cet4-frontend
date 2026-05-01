import { describe, it, expect } from 'vitest'
import { parseTime, formatDateTime, formatDuration, formatDurationText } from '../date'

describe('parseTime', () => {
  it('should return null for null input', () => {
    expect(parseTime(null)).toBeNull()
  })

  it('should return null for undefined input', () => {
    expect(parseTime(undefined)).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(parseTime('')).toBeNull()
  })

  it('should parse valid date string', () => {
    const result = parseTime('2024-01-15T10:30:00')
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(0) // January
    expect(result.getDate()).toBe(15)
  })

  it('should parse Date object', () => {
    const date = new Date(2024, 0, 15, 10, 30)
    const result = parseTime(date)
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2024)
  })

  it('should return null for invalid date string', () => {
    expect(parseTime('not a date')).toBeNull()
  })

  it('should parse ISO 8601 string', () => {
    const result = parseTime('2024-06-15T08:30:00.000Z')
    expect(result).toBeInstanceOf(Date)
  })
})

describe('formatDateTime', () => {
  it('should format a valid date string', () => {
    const result = formatDateTime('2024-01-15T10:30:00')
    expect(result).toBe('2024-01-15 10:30')
  })

  it('should pad single-digit months and days', () => {
    const result = formatDateTime('2024-03-05T09:05:00')
    expect(result).toBe('2024-03-05 09:05')
  })

  it('should return default empty text for null', () => {
    expect(formatDateTime(null)).toBe('-')
  })

  it('should return default empty text for undefined', () => {
    expect(formatDateTime(undefined)).toBe('-')
  })

  it('should return default empty text for invalid date', () => {
    expect(formatDateTime('invalid')).toBe('-')
  })

  it('should use custom empty text', () => {
    expect(formatDateTime(null, 'N/A')).toBe('N/A')
  })

  it('should format Date object', () => {
    const date = new Date(2024, 5, 15, 14, 30) // June 15, 2024, 14:30
    const result = formatDateTime(date)
    expect(result).toBe('2024-06-15 14:30')
  })
})

describe('formatDuration', () => {
  it('should format duration between two dates', () => {
    const start = '2024-01-15T10:00:00'
    const end = '2024-01-15T11:30:45'
    expect(formatDuration(start, end)).toBe('01:30:45')
  })

  it('should format zero duration', () => {
    const start = '2024-01-15T10:00:00'
    const end = '2024-01-15T10:00:00'
    expect(formatDuration(start, end)).toBe('00:00:00')
  })

  it('should return default empty text when start is null', () => {
    expect(formatDuration(null, '2024-01-15T10:00:00')).toBe('--:--:--')
  })

  it('should return default empty text when end is null', () => {
    expect(formatDuration('2024-01-15T10:00:00', null)).toBe('--:--:--')
  })

  it('should return default empty text when end < start', () => {
    const start = '2024-01-15T11:00:00'
    const end = '2024-01-15T10:00:00'
    expect(formatDuration(start, end)).toBe('--:--:--')
  })

  it('should use custom empty text', () => {
    expect(formatDuration(null, null, 'N/A')).toBe('N/A')
  })

  it('should format long duration correctly', () => {
    const start = '2024-01-15T08:00:00'
    const end = '2024-01-15T20:30:15'
    expect(formatDuration(start, end)).toBe('12:30:15')
  })

  it('should pad single-digit hours, minutes, seconds', () => {
    const start = '2024-01-15T10:00:00'
    const end = '2024-01-15T10:05:03'
    expect(formatDuration(start, end)).toBe('00:05:03')
  })
})

describe('formatDurationText', () => {
  it('should format duration in minutes only', () => {
    const start = '2024-01-15T10:00:00'
    const end = '2024-01-15T10:35:00'
    expect(formatDurationText(start, end)).toBe('35分钟')
  })

  it('should format duration in hours and minutes', () => {
    const start = '2024-01-15T10:00:00'
    const end = '2024-01-15T12:30:00'
    expect(formatDurationText(start, end)).toBe('2小时30分钟')
  })

  it('should return <1分钟 for less than 1 minute', () => {
    const start = '2024-01-15T10:00:00'
    const end = '2024-01-15T10:00:30'
    expect(formatDurationText(start, end)).toBe('<1分钟')
  })

  it('should return default empty text when start is null', () => {
    expect(formatDurationText(null, '2024-01-15T10:00:00')).toBe('-')
  })

  it('should return default empty text when end is null', () => {
    expect(formatDurationText('2024-01-15T10:00:00', null)).toBe('-')
  })

  it('should return default empty text when end < start', () => {
    const start = '2024-01-15T11:00:00'
    const end = '2024-01-15T10:00:00'
    expect(formatDurationText(start, end)).toBe('-')
  })

  it('should use custom empty text', () => {
    expect(formatDurationText(null, null, 'N/A')).toBe('N/A')
  })

  it('should handle exactly 1 minute', () => {
    const start = '2024-01-15T10:00:00'
    const end = '2024-01-15T10:01:00'
    expect(formatDurationText(start, end)).toBe('1分钟')
  })

  it('should handle exactly 1 hour', () => {
    const start = '2024-01-15T10:00:00'
    const end = '2024-01-15T11:00:00'
    expect(formatDurationText(start, end)).toBe('1小时0分钟')
  })
})

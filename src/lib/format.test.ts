import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatDateShort,
  isTodayDate,
  isThisWeekDate,
  isThisMonthDate,
  parseDate,
} from './format'

describe('formatCurrency', () => {
  it('formats euros correctly', () => {
    const result = formatCurrency(25.5)
    expect(result).toContain('25')
    expect(result).toContain('50')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('formats large amounts', () => {
    const result = formatCurrency(1500)
    expect(result).toContain('1')
    expect(result).toContain('500')
  })

  it('formats negative amounts', () => {
    const result = formatCurrency(-10)
    expect(result).toContain('10')
  })
})

describe('formatDate', () => {
  it('formats ISO string date', () => {
    const result = formatDate('2024-03-15T10:30:00Z')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('formats Date object', () => {
    const date = new Date(2024, 5, 20) // June 20, 2024
    const result = formatDate(date)
    expect(result).toContain('20')
    expect(result).toContain('2024')
  })
})

describe('formatDateTime', () => {
  it('includes time in output', () => {
    const result = formatDateTime('2024-03-15T14:30:00Z')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('formats Date object with time', () => {
    const date = new Date(2024, 0, 10, 9, 45)
    const result = formatDateTime(date)
    expect(result).toContain('10')
    expect(result).toContain('45')
  })
})

describe('formatTime', () => {
  it('returns HH:mm format', () => {
    const date = new Date(2024, 0, 1, 14, 30)
    const result = formatTime(date)
    expect(result).toContain('14')
    expect(result).toContain('30')
  })

  it('formats string date time', () => {
    const result = formatTime('2024-06-15T09:15:00Z')
    expect(result).toMatch(/\d{2}:\d{2}/)
  })
})

describe('formatDateShort', () => {
  it('returns dd/MM format', () => {
    const result = formatDateShort('2024-03-15T10:00:00Z')
    expect(result).toContain('15')
    expect(result).toContain('03')
  })

  it('formats Date object', () => {
    const date = new Date(2024, 11, 25) // Dec 25
    const result = formatDateShort(date)
    expect(result).toContain('25')
    expect(result).toContain('12')
  })
})

describe('isTodayDate', () => {
  it('returns true for today', () => {
    expect(isTodayDate(new Date())).toBe(true)
  })

  it('returns false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isTodayDate(yesterday)).toBe(false)
  })

  it('works with ISO strings', () => {
    const today = new Date().toISOString()
    expect(isTodayDate(today)).toBe(true)
  })
})

describe('isThisWeekDate', () => {
  it('returns true for today', () => {
    expect(isThisWeekDate(new Date())).toBe(true)
  })

  it('returns false for date far in the past', () => {
    expect(isThisWeekDate('2020-01-01T00:00:00Z')).toBe(false)
  })
})

describe('isThisMonthDate', () => {
  it('returns true for today', () => {
    expect(isThisMonthDate(new Date())).toBe(true)
  })

  it('returns false for date in different month', () => {
    const farDate = new Date()
    farDate.setMonth(farDate.getMonth() - 3)
    expect(isThisMonthDate(farDate)).toBe(false)
  })
})

describe('parseDate', () => {
  it('parses ISO string to Date object', () => {
    const result = parseDate('2024-06-15T10:30:00Z')
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2024)
  })

  it('parses date-only string', () => {
    const result = parseDate('2024-12-25')
    expect(result).toBeInstanceOf(Date)
    expect(result.getMonth()).toBe(11) // December = 11
    expect(result.getDate()).toBe(25)
  })
})

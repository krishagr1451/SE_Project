import { describe, it, expect } from 'vitest'

describe('Unit 5: validateEmail Function', () => {
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  it('Test 5.1: Should accept valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('Test 5.2: Should accept email with dots', () => {
    expect(validateEmail('user.name@example.com')).toBe(true)
  })

  it('Test 5.3: Should accept email with numbers', () => {
    expect(validateEmail('user123@example456.com')).toBe(true)
  })

  it('Test 5.4: Should reject email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false)
  })

  it('Test 5.5: Should reject email without domain', () => {
    expect(validateEmail('user@')).toBe(false)
  })

  it('Test 5.6: Should reject email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false)
  })

  it('Test 5.7: Should reject empty string', () => {
    expect(validateEmail('')).toBe(false)
  })

  it('Test 5.8: Should accept email with + symbol', () => {
    // This will fail - regex doesn't support +
    expect(validateEmail('user+tag@example.com')).toBe(true)
  })

  it('Test 5.9: Should reject multiple @ symbols', () => {
    expect(validateEmail('user@@example.com')).toBe(false)
  })

  it('Test 5.10: Should reject email without TLD', () => {
    // This will fail - regex accepts localhost
    expect(validateEmail('user@localhost')).toBe(false)
  })
})

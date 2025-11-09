import { describe, it, expect } from 'vitest'

describe('Unit 3: canCancelBooking Function', () => {
  const canCancelBooking = (status: string) => {
    const upperStatus = status.toUpperCase()
    return ['PENDING', 'ACTIVE', 'CONFIRMED'].includes(upperStatus)
  }

  it('Test 3.1: Should return true for PENDING status', () => {
    expect(canCancelBooking('PENDING')).toBe(true)
  })

  it('Test 3.2: Should return true for ACTIVE status', () => {
    expect(canCancelBooking('ACTIVE')).toBe(true)
  })

  it('Test 3.3: Should return true for CONFIRMED status', () => {
    expect(canCancelBooking('CONFIRMED')).toBe(true)
  })

  it('Test 3.4: Should return false for COMPLETED status', () => {
    expect(canCancelBooking('COMPLETED')).toBe(false)
  })

  it('Test 3.5: Should return false for CANCELLED status', () => {
    expect(canCancelBooking('CANCELLED')).toBe(false)
  })

  it('Test 3.6: Should handle case-insensitive input', () => {
    expect(canCancelBooking('pending')).toBe(true)
  })

  it('Test 3.7: Should return true for SCHEDULED status', () => {
    // This will fail - SCHEDULED not in allowed list
    expect(canCancelBooking('SCHEDULED')).toBe(true)
  })
})

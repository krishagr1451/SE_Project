import { describe, it, expect } from 'vitest'

describe('Unit 2: canCancelRide Function', () => {
  const canCancelRide = (status: string) => {
    const upperStatus = status.toUpperCase()
    return ['SEARCHING', 'ACCEPTED', 'PENDING', 'ARRIVED'].includes(upperStatus)
  }

  it('Test 2.1: Should return true for SEARCHING status', () => {
    expect(canCancelRide('SEARCHING')).toBe(true)
  })

  it('Test 2.2: Should return true for ACCEPTED status', () => {
    expect(canCancelRide('ACCEPTED')).toBe(true)
  })

  it('Test 2.3: Should return true for PENDING status', () => {
    expect(canCancelRide('PENDING')).toBe(true)
  })

  it('Test 2.4: Should return true for ARRIVED status', () => {
    expect(canCancelRide('ARRIVED')).toBe(true)
  })

  it('Test 2.5: Should return false for IN_PROGRESS status', () => {
    expect(canCancelRide('IN_PROGRESS')).toBe(false)
  })

  it('Test 2.6: Should return false for COMPLETED status', () => {
    expect(canCancelRide('COMPLETED')).toBe(false)
  })

  it('Test 2.7: Should return false for CANCELLED status', () => {
    expect(canCancelRide('CANCELLED')).toBe(false)
  })

  it('Test 2.8: Should handle lowercase input', () => {
    expect(canCancelRide('searching')).toBe(true)
    expect(canCancelRide('completed')).toBe(false)
  })

  it('Test 2.9: Should return true for SCHEDULED status', () => {
    // This will fail - SCHEDULED not in allowed list
    expect(canCancelRide('SCHEDULED')).toBe(true)
  })

  it('Test 2.10: Should handle mixed case', () => {
    expect(canCancelRide('SeArChInG')).toBe(true)
  })
})

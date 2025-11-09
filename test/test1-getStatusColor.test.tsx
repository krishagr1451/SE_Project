import { describe, it, expect } from 'vitest'

describe('Unit 1: getStatusColor Function', () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SEARCHING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800'
      case 'ARRIVED': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  it('Test 1.1: Should return yellow classes for SEARCHING status', () => {
    expect(getStatusColor('SEARCHING')).toBe('bg-yellow-100 text-yellow-800')
  })

  it('Test 1.2: Should return blue classes for ACCEPTED status', () => {
    expect(getStatusColor('ACCEPTED')).toBe('bg-blue-100 text-blue-800')
  })

  it('Test 1.3: Should return green classes for ARRIVED status', () => {
    expect(getStatusColor('ARRIVED')).toBe('bg-green-100 text-green-800')
  })

  it('Test 1.4: Should return purple classes for IN_PROGRESS status', () => {
    expect(getStatusColor('IN_PROGRESS')).toBe('bg-purple-100 text-purple-800')
  })

  it('Test 1.5: Should return gray classes for COMPLETED status', () => {
    expect(getStatusColor('COMPLETED')).toBe('bg-gray-100 text-gray-800')
  })

  it('Test 1.6: Should return red classes for CANCELLED status', () => {
    expect(getStatusColor('CANCELLED')).toBe('bg-red-100 text-red-800')
  })

  it('Test 1.7: Should handle lowercase status', () => {
    // This will fail - function doesn't convert to uppercase
    expect(getStatusColor('searching')).toBe('bg-yellow-100 text-yellow-800')
  })

  it('Test 1.8: Should return default gray for unknown status', () => {
    expect(getStatusColor('UNKNOWN')).toBe('bg-gray-100 text-gray-800')
  })
})

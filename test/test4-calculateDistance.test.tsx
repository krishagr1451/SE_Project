import { describe, it, expect } from 'vitest'

describe('Unit 4: calculateDistance Function', () => {
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  it('Test 4.1: Should calculate distance correctly', () => {
    const distance = calculateDistance(40.7128, -74.0060, 34.0522, -118.2437)
    expect(distance).toBeGreaterThan(3900)
    expect(distance).toBeLessThan(4000)
  })

  it('Test 4.2: Should return 0 for same coordinates', () => {
    const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060)
    expect(distance).toBe(0)
  })

  it('Test 4.3: Should handle negative coordinates', () => {
    const distance = calculateDistance(-33.8688, 151.2093, 51.5074, -0.1278)
    expect(distance).toBeGreaterThan(16900)
  })

  it('Test 4.4: Should calculate short distance', () => {
    const distance = calculateDistance(28.6139, 77.2090, 28.6229, 77.2090)
    expect(distance).toBeCloseTo(1, 0)
  })

  it('Test 4.5: Should validate latitude bounds', () => {
    // This will fail - no validation for invalid coordinates
    const distance = calculateDistance(95, 0, 0, 0)
    expect(distance).toBe(0)
  })

  it('Test 4.6: Should handle equator crossing', () => {
    const distance = calculateDistance(-10, 0, 10, 0)
    expect(distance).toBeGreaterThan(2200)
  })
})

import { describe, it, expect } from 'vitest'

describe('Unit 6: formatPrice Function', () => {
  const formatPrice = (price: number, currency: string = 'INR'): string => {
    if (price < 0) return 'Invalid Price'
    if (currency === 'INR') {
      return `₹${price.toFixed(2)}`
    } else if (currency === 'USD') {
      return `$${price.toFixed(2)}`
    } else {
      return `${price.toFixed(2)} ${currency}`
    }
  }

  it('Test 6.1: Should format price in INR', () => {
    expect(formatPrice(100)).toBe('₹100.00')
  })

  it('Test 6.2: Should format price in USD', () => {
    expect(formatPrice(100, 'USD')).toBe('$100.00')
  })

  it('Test 6.3: Should handle decimal values', () => {
    expect(formatPrice(99.99, 'INR')).toBe('₹99.99')
  })

  it('Test 6.4: Should round to 2 decimal places', () => {
    expect(formatPrice(99.999, 'INR')).toBe('₹100.00')
  })

  it('Test 6.5: Should handle zero price', () => {
    expect(formatPrice(0, 'INR')).toBe('₹0.00')
  })

  it('Test 6.6: Should handle negative price', () => {
    expect(formatPrice(-50, 'INR')).toBe('Invalid Price')
  })

  it('Test 6.7: Should handle unknown currency', () => {
    expect(formatPrice(100, 'EUR')).toBe('100.00 EUR')
  })

  it('Test 6.8: Should add comma separators for large amounts', () => {
    // This will fail - no comma formatting
    expect(formatPrice(100000, 'INR')).toBe('₹1,00,000.00')
  })

  it('Test 6.9: Should handle large numbers', () => {
    expect(formatPrice(999999, 'INR')).toBe('₹999999.00')
  })
})

import { describe, it, expect } from 'vitest'
import { signToken, verifyToken, getAuthFromHeader } from '../auth'

describe('Auth Functions', () => {
  describe('signToken', () => {
    it('should create a valid JWT token', () => {
      const payload = {
        userId: 'test-user-id',
        role: 'PASSENGER' as const,
        email: 'test@example.com'
      }
      
      const token = signToken(payload, 3600)
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const payload = {
        userId: 'test-user-id',
        role: 'DRIVER' as const,
        email: 'driver@example.com'
      }
      
      const token = signToken(payload, 3600)
      const decoded = verifyToken(token)
      
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe(payload.userId)
      expect(decoded?.role).toBe(payload.role)
    })

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token-string')
      expect(decoded).toBeNull()
    })

    it('should return null for expired token', () => {
      const payload = {
        userId: 'test-user-id',
        role: 'PASSENGER' as const,
      }
      
      // Create token that expires immediately (1 second ago)
      const token = signToken(payload, -1)
      
      // Wait a bit to ensure expiration
      const decoded = verifyToken(token)
      expect(decoded).toBeNull()
    })
  })

  describe('getAuthFromHeader', () => {
    it('should extract and verify token from Bearer header', () => {
      const payload = {
        userId: 'test-user-id',
        role: 'ADMIN' as const,
      }
      
      const token = signToken(payload, 3600)
      const authHeader = `Bearer ${token}`
      
      const decoded = getAuthFromHeader(authHeader)
      expect(decoded).toBeTruthy()
      expect(decoded?.userId).toBe(payload.userId)
      expect(decoded?.role).toBe(payload.role)
    })

    it('should return null for missing header', () => {
      const decoded = getAuthFromHeader(null)
      expect(decoded).toBeNull()
    })

    it('should return null for malformed header', () => {
      const decoded = getAuthFromHeader('InvalidFormat token')
      expect(decoded).toBeNull()
    })

    it('should return null for header without Bearer prefix', () => {
      const payload = {
        userId: 'test-user-id',
        role: 'PASSENGER' as const,
      }
      
      const token = signToken(payload, 3600)
      const decoded = getAuthFromHeader(token) // Missing "Bearer " prefix
      expect(decoded).toBeNull()
    })
  })
})

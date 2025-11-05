import { describe, it, expect } from 'vitest'
import { logger } from '../logger'

describe('Logger Utility', () => {
  it('should have info method', () => {
    expect(logger.info).toBeDefined()
    expect(typeof logger.info).toBe('function')
  })

  it('should have warn method', () => {
    expect(logger.warn).toBeDefined()
    expect(typeof logger.warn).toBe('function')
  })

  it('should have error method', () => {
    expect(logger.error).toBeDefined()
    expect(typeof logger.error).toBe('function')
  })

  it('should have debug method', () => {
    expect(logger.debug).toBeDefined()
    expect(typeof logger.debug).toBe('function')
  })

  it('should log without throwing errors', () => {
    expect(() => logger.info('Test info message')).not.toThrow()
    expect(() => logger.warn('Test warn message')).not.toThrow()
    expect(() => logger.error('Test error message')).not.toThrow()
    expect(() => logger.debug('Test debug message')).not.toThrow()
  })

  it('should handle context objects', () => {
    expect(() => 
      logger.info('Test with context', { userId: '123', action: 'login' })
    ).not.toThrow()
  })

  it('should handle Error objects in error method', () => {
    const testError = new Error('Test error')
    expect(() => 
      logger.error('Error occurred', testError, { userId: '123' })
    ).not.toThrow()
  })
})

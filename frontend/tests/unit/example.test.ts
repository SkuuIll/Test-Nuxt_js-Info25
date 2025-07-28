import { describe, it, expect } from 'vitest'

describe('Basic functionality', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2)
  })
  
  it('should handle strings', () => {
    expect('hello world').toContain('world')
  })
})
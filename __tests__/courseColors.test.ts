import { describe, it, expect } from 'vitest'
import { COURSE_COLORS } from '@/lib/courseColors'

describe('COURSE_COLORS', () => {
  it('exports exactly 8 colors', () => {
    expect(COURSE_COLORS).toHaveLength(8)
  })

  it('each color has block, chip, and border fields', () => {
    for (const color of COURSE_COLORS) {
      expect(typeof color.block).toBe('string')
      expect(typeof color.chip).toBe('string')
      expect(typeof color.border).toBe('string')
    }
  })

  it('all colors are distinct (no duplicate chip strings)', () => {
    const chips = COURSE_COLORS.map((c) => c.chip)
    expect(new Set(chips).size).toBe(chips.length)
  })

  it('block strings include a bg- class', () => {
    for (const color of COURSE_COLORS) {
      expect(color.block).toMatch(/bg-/)
    }
  })

  it('border strings include a border- class', () => {
    for (const color of COURSE_COLORS) {
      expect(color.border).toMatch(/border-/)
    }
  })

  it('color at index 8 wraps to index 0 (modulo behavior)', () => {
    // Consumers use colorIndex % COURSE_COLORS.length — verify length is 8
    expect(COURSE_COLORS[8 % COURSE_COLORS.length]).toEqual(COURSE_COLORS[0])
  })
})

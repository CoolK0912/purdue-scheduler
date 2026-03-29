// End-to-end tests against the real Purdue.io API.
// These make live network requests — run with: npm test
// They verify the full pipeline: fetch → normalize → conflict detection.

import { describe, it, expect, beforeAll } from 'vitest'
import { getSemesters, searchCourses, getSections } from '@/lib/purdue'
import { hasConflict, findConflicts, conflictingIds } from '@/lib/conflicts'
import type { ApiSemester, ApiSection } from '@/types/purdue'

let fallSemester: ApiSemester | undefined

// Find the most recent fall semester (Fall 2025 or Fall 2026 if available)
// Purdue.io Term codes: Spring=x620, Summer=x630, Fall=x710 (e.g. 202710 = Fall 2026)
beforeAll(async () => {
  const semesters = await getSemesters()
  fallSemester = semesters.find((s) => s.name.toLowerCase().includes('fall'))
}, 15000)

describe('Purdue.io API — getSemesters', () => {
  it('returns at least one semester', async () => {
    const semesters = await getSemesters()
    expect(semesters.length).toBeGreaterThan(0)
  })

  it('each semester has id, code, and name', async () => {
    const semesters = await getSemesters()
    for (const s of semesters) {
      expect(s.id).toBeTruthy()
      expect(s.code).toMatch(/^\d{6}$/)
      expect(s.name).toBeTruthy()
    }
  })

  it('does not include the sentinel "The End of Time" entry', async () => {
    const semesters = await getSemesters()
    expect(semesters.find((s) => s.code === '999999')).toBeUndefined()
  })

  it('finds a fall semester', () => {
    expect(fallSemester).toBeDefined()
    expect(fallSemester!.name).toMatch(/Fall/i)
  })
})

describe('Purdue.io API — searchCourses', () => {
  it('returns courses matching "CS" — at least one should be the CS subject', async () => {
    if (!fallSemester) return
    const courses = await searchCourses('CS', fallSemester.id)
    expect(courses.length).toBeGreaterThan(0)
    // "contains" matches any subject with "CS" in it (e.g. CS, CLCS) — verify CS is among them
    expect(courses.some((c) => c.subject === 'CS')).toBe(true)
  }, 15000)

  it('returns courses matching a number fragment', async () => {
    if (!fallSemester) return
    const courses = await searchCourses('182', fallSemester.id)
    expect(courses.length).toBeGreaterThan(0)
  }, 15000)

  it('each course has required fields', async () => {
    if (!fallSemester) return
    const courses = await searchCourses('MA', fallSemester.id)
    for (const c of courses.slice(0, 5)) {
      expect(c.id).toBeTruthy()
      expect(c.number).toBeTruthy()
      expect(c.title).toBeTruthy()
      expect(c.subject).toBeTruthy()
      expect(typeof c.creditHours).toBe('number')
    }
  }, 15000)

  it('returns empty array for nonsense query', async () => {
    if (!fallSemester) return
    const courses = await searchCourses('ZZZZZZZZ', fallSemester.id)
    expect(courses).toEqual([])
  }, 15000)
})

describe('Purdue.io API — getSections', () => {
  let csCourseId: string | undefined

  beforeAll(async () => {
    if (!fallSemester) return
    const courses = await searchCourses('CS', fallSemester.id)
    csCourseId = courses[0]?.id
  }, 15000)

  it('returns sections for a CS course', async () => {
    if (!fallSemester || !csCourseId) return
    const sections = await getSections(csCourseId, fallSemester.id)
    expect(sections.length).toBeGreaterThan(0)
  }, 15000)

  it('each section has crn and type', async () => {
    if (!fallSemester || !csCourseId) return
    const sections = await getSections(csCourseId, fallSemester.id)
    for (const s of sections.slice(0, 3)) {
      expect(s.crn).toBeTruthy()
      expect(typeof s.type).toBe('string')
      expect(Array.isArray(s.meetings)).toBe(true)
      expect(Array.isArray(s.instructors)).toBe(true)
    }
  }, 15000)

  it('meeting days only contain valid day codes', async () => {
    if (!fallSemester || !csCourseId) return
    const sections = await getSections(csCourseId, fallSemester.id)
    const validDays = new Set(['M', 'T', 'W', 'R', 'F', 'Sa', 'Su'])
    for (const sec of sections) {
      for (const meeting of sec.meetings) {
        for (const day of meeting.days) {
          expect(validDays.has(day)).toBe(true)
        }
      }
    }
  }, 15000)
})

describe('Full pipeline — fetch → normalize → conflict detection', () => {
  it('detects no conflicts among a single section', async () => {
    if (!fallSemester) return
    const courses = await searchCourses('CS', fallSemester.id)
    if (!courses[0]) return
    const sections = await getSections(courses[0].id, fallSemester.id)
    if (sections.length === 0) return

    const result = findConflicts([sections[0]])
    expect(result).toEqual([])
  }, 20000)

  it('conflictingIds returns a Set', async () => {
    if (!fallSemester) return
    const courses = await searchCourses('CS', fallSemester.id)
    if (!courses[0]) return
    const sections = await getSections(courses[0].id, fallSemester.id)
    if (sections.length < 2) return

    const ids = conflictingIds(sections.slice(0, 5))
    expect(ids).toBeInstanceOf(Set)
  }, 20000)

  it('hasConflict is consistent with findConflicts', async () => {
    if (!fallSemester) return
    const courses = await searchCourses('CS', fallSemester.id)
    if (!courses[0]) return
    const sections = await getSections(courses[0].id, fallSemester.id)
    const sample = sections.slice(0, 6)

    const pairs = findConflicts(sample)
    // Every pair returned by findConflicts must also satisfy hasConflict
    for (const [a, b] of pairs) {
      expect(hasConflict(a, b)).toBe(true)
    }
    // Every non-conflicting pair must return false from hasConflict
    for (let i = 0; i < sample.length; i++) {
      for (let j = i + 1; j < sample.length; j++) {
        const inPairs = pairs.some(
          ([a, b]) =>
            (a.id === sample[i].id && b.id === sample[j].id) ||
            (a.id === sample[j].id && b.id === sample[i].id)
        )
        expect(hasConflict(sample[i], sample[j])).toBe(inPairs)
      }
    }
  }, 25000)
})

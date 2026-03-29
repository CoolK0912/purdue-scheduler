// Unit tests for Next.js API route handlers
// Handlers are called directly — no HTTP server needed.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/purdue', () => ({
  getSemesters: vi.fn(),
  searchCourses: vi.fn(),
  getSections: vi.fn(),
}))

import { getSemesters, searchCourses, getSections } from '@/lib/purdue'
import { GET as semestersGET } from '@/app/api/semesters/route'
import { GET as coursesGET } from '@/app/api/courses/route'
import { GET as sectionsGET } from '@/app/api/courses/[id]/sections/route'

const mockGetSemesters = vi.mocked(getSemesters)
const mockSearchCourses = vi.mocked(searchCourses)
const mockGetSections = vi.mocked(getSections)

function makeRequest(url: string): NextRequest {
  return new NextRequest(url)
}

// Next.js 16 passes params as a Promise
function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// --- /api/semesters ---

describe('GET /api/semesters', () => {
  it('returns 200 with semester list', async () => {
    const semesters = [{ id: 'abc', code: '202710', name: 'Fall 2026' }]
    mockGetSemesters.mockResolvedValue(semesters)

    const res = await semestersGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(semesters)
  })

  it('returns 502 when Purdue.io throws', async () => {
    mockGetSemesters.mockRejectedValue(new Error('network error'))
    const res = await semestersGET()
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBeDefined()
  })
})

// --- /api/courses ---

describe('GET /api/courses', () => {
  it('returns 200 with course list', async () => {
    const courses = [{
      id: 'c1', number: '18200', title: 'Foundations',
      subject: 'CS', subjectName: 'Computer Science', description: '', creditHours: 3,
    }]
    mockSearchCourses.mockResolvedValue(courses)

    const req = makeRequest('http://localhost/api/courses?q=CS&semester=abc')
    const res = await coursesGET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(courses)
    expect(mockSearchCourses).toHaveBeenCalledWith('CS', 'abc')
  })

  it('returns 400 when q is missing', async () => {
    const res = await coursesGET(makeRequest('http://localhost/api/courses?semester=abc'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/q/)
  })

  it('returns 400 when semester is missing', async () => {
    const res = await coursesGET(makeRequest('http://localhost/api/courses?q=CS'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/semester/)
  })

  it('returns 400 when q is too short (< 2 chars)', async () => {
    const res = await coursesGET(makeRequest('http://localhost/api/courses?q=C&semester=abc'))
    expect(res.status).toBe(400)
  })

  it('returns 502 when Purdue.io throws', async () => {
    mockSearchCourses.mockRejectedValue(new Error('upstream'))
    const res = await coursesGET(makeRequest('http://localhost/api/courses?q=CS&semester=abc'))
    expect(res.status).toBe(502)
  })
})

// --- /api/courses/[id]/sections ---

describe('GET /api/courses/[id]/sections', () => {
  it('returns 200 with sections list', async () => {
    const sections = [{
      id: 'sec1', crn: '12345', type: 'Lecture',
      instructors: ['Dr. Smith'], meetings: [],
    }]
    mockGetSections.mockResolvedValue(sections)

    const req = makeRequest('http://localhost/api/courses/course-xyz/sections?semester=abc')
    const res = await sectionsGET(req, makeParams('course-xyz'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(sections)
    expect(mockGetSections).toHaveBeenCalledWith('course-xyz', 'abc')
  })

  it('returns 400 when semester is missing', async () => {
    const req = makeRequest('http://localhost/api/courses/course-xyz/sections')
    const res = await sectionsGET(req, makeParams('course-xyz'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/semester/)
  })

  it('returns 502 when Purdue.io throws', async () => {
    mockGetSections.mockRejectedValue(new Error('timeout'))
    const req = makeRequest('http://localhost/api/courses/course-xyz/sections?semester=abc')
    const res = await sectionsGET(req, makeParams('course-xyz'))
    expect(res.status).toBe(502)
  })

  it('returns empty array when course has no sections', async () => {
    mockGetSections.mockResolvedValue([])
    const req = makeRequest('http://localhost/api/courses/course-xyz/sections?semester=abc')
    const res = await sectionsGET(req, makeParams('course-xyz'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

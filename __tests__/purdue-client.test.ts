import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSemesters, searchCourses, getSections } from '@/lib/purdue'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function odataResponse(value: unknown[]) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ value }),
  })
}

function errorResponse(status: number, statusText: string) {
  return Promise.resolve({ ok: false, status, statusText })
}

beforeEach(() => {
  mockFetch.mockReset()
})

// --- getSemesters ---

describe('getSemesters', () => {
  it('returns normalized terms', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        { Id: 'abc', Code: '202710', Name: 'Fall 2026', StartDate: '2026-07-27', EndDate: '2026-12-20' },
        { Id: 'def', Code: '202620', Name: 'Spring 2026', StartDate: null, EndDate: null },
      ])
    )
    const result = await getSemesters()
    expect(result).toEqual([
      { id: 'abc', code: '202710', name: 'Fall 2026' },
      { id: 'def', code: '202620', name: 'Spring 2026' },
    ])
  })

  it('calls the Terms endpoint', async () => {
    mockFetch.mockReturnValue(odataResponse([]))
    await getSemesters()
    expect(mockFetch).toHaveBeenCalledOnce()
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('api.purdue.io/odata/Terms')
  })

  it('filters out the sentinel "The End of Time" entry (Code 999999)', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        { Id: 'sentinel', Code: '999999', Name: 'The End of Time', StartDate: null, EndDate: null },
        { Id: 'abc', Code: '202710', Name: 'Fall 2026', StartDate: null, EndDate: null },
      ])
    )
    const result = await getSemesters()
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('202710')
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockReturnValue(errorResponse(502, 'Bad Gateway'))
    await expect(getSemesters()).rejects.toThrow('502')
  })

  it('returns empty array when API has no terms', async () => {
    mockFetch.mockReturnValue(odataResponse([]))
    expect(await getSemesters()).toEqual([])
  })
})

// --- searchCourses ---

describe('searchCourses', () => {
  const termId = 'term-id-abc'

  it('returns normalized courses', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        {
          Id: 'cid1',
          Number: '18200',
          Title: 'Foundations of Computer Science',
          Description: 'Intro CS',
          CreditHours: 3,
          Subject: { Abbreviation: 'CS', Name: 'Computer Science' },
        },
      ])
    )
    const result = await searchCourses('cs182', termId)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'cid1',
      number: '18200',
      title: 'Foundations of Computer Science',
      subject: 'CS',
      subjectName: 'Computer Science',
      creditHours: 3,
    })
  })

  it('uppercases the query', async () => {
    mockFetch.mockReturnValue(odataResponse([]))
    await searchCourses('cs182', termId)
    const url = decodeURIComponent(mockFetch.mock.calls[0][0] as string)
    // "cs182" → subject=CS, number=182 (split and uppercased)
    expect(url).toContain("'CS'")
    expect(url).toContain("'182'")
  })

  it('includes the termId in the filter', async () => {
    mockFetch.mockReturnValue(odataResponse([]))
    await searchCourses('CS', termId)
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain(termId)
  })

  it('splits "CS 25000" into subject eq + number contains filter', async () => {
    mockFetch.mockReturnValue(odataResponse([]))
    await searchCourses('CS 25000', termId)
    const url = decodeURIComponent(mockFetch.mock.calls[0][0] as string)
    expect(url).toContain("Subject/Abbreviation eq 'CS'")
    expect(url).toContain("contains(Number, '25000')")
  })

  it('splits "MA182" (no space) into subject + number filter', async () => {
    mockFetch.mockReturnValue(odataResponse([]))
    await searchCourses('MA182', termId)
    const url = decodeURIComponent(mockFetch.mock.calls[0][0] as string)
    expect(url).toContain("Subject/Abbreviation eq 'MA'")
    expect(url).toContain("contains(Number, '182')")
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockReturnValue(errorResponse(500, 'Internal Server Error'))
    await expect(searchCourses('cs', termId)).rejects.toThrow('500')
  })

  it('handles missing optional fields gracefully', async () => {
    mockFetch.mockReturnValue(
      odataResponse([{ Id: 'cid2', Number: '101', Title: 'Some Course', Subject: { Abbreviation: 'MA', Name: 'Math' } }])
    )
    const result = await searchCourses('MA', termId)
    expect(result[0].description).toBe('')
    expect(result[0].creditHours).toBe(0)
  })
})

// --- getSections ---

describe('getSections', () => {
  const courseId = 'course-guid-xyz'
  const termId = 'term-guid-abc'

  it('returns normalized sections with meetings and instructors', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        {
          Id: 'class1',
          CourseId: courseId,
          TermId: termId,
          Sections: [
            {
              Id: 'sec1',
              Crn: '12345',
              Type: 'Lecture',
              Meetings: [
                {
                  Id: 'm1',
                  Type: 'Lecture',
                  StartTime: '10:30:00',
                  Duration: 'PT50M',
                  DaysOfWeek: 21, // 1+4+16 = Monday + Wednesday + Friday
                  RoomId: null,
                  Instructors: [{ Id: 'i1', Name: 'Dr. Smith', Email: null }],
                },
              ],
            },
          ],
        },
      ])
    )

    const result = await getSections(courseId, termId)
    expect(result).toHaveLength(1)
    const sec = result[0]
    expect(sec.crn).toBe('12345')
    expect(sec.meetings).toHaveLength(1)
    expect(sec.meetings[0].days).toEqual(['M', 'W', 'F'])
    expect(sec.meetings[0].startTime).toBe('10:30:00')
    expect(sec.meetings[0].endTime).toBe('11:20:00')
    expect(sec.meetings[0].instructors).toEqual(['Dr. Smith'])
  })

  it('flattens sections across multiple classes', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        { Id: 'class1', Sections: [{ Id: 's1', Crn: '11111', Type: 'Lecture', Meetings: [] }] },
        { Id: 'class2', Sections: [{ Id: 's2', Crn: '22222', Type: 'Lab', Meetings: [] }] },
      ])
    )
    const result = await getSections(courseId, termId)
    expect(result).toHaveLength(2)
    expect(result.map((s) => s.crn)).toEqual(['11111', '22222'])
  })

  it('handles section with no meetings', async () => {
    mockFetch.mockReturnValue(
      odataResponse([{ Id: 'class1', Sections: [{ Id: 'sec3', Crn: '11111', Type: 'Online', Meetings: [] }] }])
    )
    const result = await getSections(courseId, termId)
    expect(result[0].meetings).toEqual([])
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockReturnValue(errorResponse(404, 'Not Found'))
    await expect(getSections(courseId, termId)).rejects.toThrow('404')
  })

  it('parses DaysOfWeek bitmask correctly for T/R (2 + 8 = 10)', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        {
          Id: 'class1',
          Sections: [
            {
              Id: 'sec4', Crn: '33333', Type: 'Lecture',
              Meetings: [{ Id: 'm2', Type: 'Lecture', StartTime: '13:30:00', Duration: 'PT50M', DaysOfWeek: 10, RoomId: null, Instructors: [] }],
            },
          ],
        },
      ])
    )
    const result = await getSections(courseId, termId)
    expect(result[0].meetings[0].days).toEqual(['T', 'R'])
  })

  it('parses DaysOfWeek as string "Monday, Wednesday, Friday"', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        {
          Id: 'class1',
          Sections: [
            {
              Id: 'sec5', Crn: '44444', Type: 'Lecture',
              Meetings: [{ Id: 'm3', Type: 'Lecture', StartTime: '08:30:00', Duration: 'PT50M', DaysOfWeek: 'Monday, Wednesday, Friday', RoomId: null, Instructors: [] }],
            },
          ],
        },
      ])
    )
    const result = await getSections(courseId, termId)
    expect(result[0].meetings[0].days).toEqual(['M', 'W', 'F'])
  })

  it('computes endTime from startTime + duration', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        {
          Id: 'class1',
          Sections: [
            {
              Id: 'sec6', Crn: '55555', Type: 'Lecture',
              Meetings: [{ Id: 'm4', Type: 'Lecture', StartTime: '09:00:00', Duration: 'PT1H15M', DaysOfWeek: 1, RoomId: null, Instructors: [] }],
            },
          ],
        },
      ])
    )
    const result = await getSections(courseId, termId)
    expect(result[0].meetings[0].endTime).toBe('10:15:00')
  })

  it('sets endTime to null when Duration is PT0S', async () => {
    mockFetch.mockReturnValue(
      odataResponse([
        {
          Id: 'class1',
          Sections: [
            {
              Id: 'sec7', Crn: '66666', Type: 'Research',
              Meetings: [{ Id: 'm5', Type: 'Research', StartTime: null, Duration: 'PT0S', DaysOfWeek: 'None', RoomId: null, Instructors: [] }],
            },
          ],
        },
      ])
    )
    const result = await getSections(courseId, termId)
    expect(result[0].meetings[0].endTime).toBeNull()
    expect(result[0].meetings[0].days).toEqual([])
  })
})

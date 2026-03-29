import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react'
import type { ApiSection, ApiCourse } from '@/types/purdue'

// Import the store — we reset it between tests via the exposed actions
import { useScheduleStore } from '@/store/scheduleStore'

// --- Helpers ---

function makeSection(id: string, days: ('M' | 'T' | 'W' | 'R' | 'F')[], start: string, end: string): ApiSection {
  return {
    id,
    crn: `CRN-${id}`,
    type: 'Lecture',
    instructors: ['Staff'],
    meetings: [{ id: `m-${id}`, type: 'Lecture', startTime: start, endTime: end, days, room: null, instructors: [] }],
  }
}

const fakeCourse: ApiCourse = {
  id: 'course-1',
  number: '18200',
  title: 'Foundations of CS',
  description: '',
  creditHours: 3,
  subject: 'CS',
  subjectName: 'Computer Science',
}

beforeEach(() => {
  // Reset store state before each test
  act(() => {
    useScheduleStore.setState({ semesterId: '', selectedSections: [] })
  })
})

// --- setSemester ---

describe('setSemester', () => {
  it('sets the semesterId', () => {
    act(() => useScheduleStore.getState().setSemester('semester-abc'))
    expect(useScheduleStore.getState().semesterId).toBe('semester-abc')
  })

  it('clears selectedSections when semester changes', () => {
    const s = makeSection('A', ['M'], '10:00:00', '11:00:00')
    act(() => {
      useScheduleStore.getState().addSection(s, fakeCourse, 0)
      useScheduleStore.getState().setSemester('new-semester')
    })
    expect(useScheduleStore.getState().selectedSections).toHaveLength(0)
  })
})

// --- addSection ---

describe('addSection', () => {
  it('adds a section with course metadata and colorIndex', () => {
    const s = makeSection('A', ['M', 'W', 'F'], '10:30:00', '11:20:00')
    act(() => useScheduleStore.getState().addSection(s, fakeCourse, 2))

    const { selectedSections } = useScheduleStore.getState()
    expect(selectedSections).toHaveLength(1)
    expect(selectedSections[0].id).toBe('A')
    expect(selectedSections[0].courseLabel).toBe('CS 18200')
    expect(selectedSections[0].courseTitle).toBe('Foundations of CS')
    expect(selectedSections[0].colorIndex).toBe(2)
    expect(selectedSections[0].courseId).toBe('course-1')
    expect(selectedSections[0].creditHours).toBe(3)
  })

  it('does not add a duplicate section', () => {
    const s = makeSection('A', ['M'], '10:00:00', '11:00:00')
    act(() => {
      useScheduleStore.getState().addSection(s, fakeCourse, 0)
      useScheduleStore.getState().addSection(s, fakeCourse, 1) // duplicate
    })
    expect(useScheduleStore.getState().selectedSections).toHaveLength(1)
  })

  it('adds multiple different sections', () => {
    const a = makeSection('A', ['M'], '08:00:00', '09:00:00')
    const b = makeSection('B', ['T'], '10:00:00', '11:00:00')
    act(() => {
      useScheduleStore.getState().addSection(a, fakeCourse, 0)
      useScheduleStore.getState().addSection(b, fakeCourse, 1)
    })
    expect(useScheduleStore.getState().selectedSections).toHaveLength(2)
  })

  it('preserves all ApiSection fields on the added entry', () => {
    const s = makeSection('A', ['M', 'W'], '09:00:00', '09:50:00')
    act(() => useScheduleStore.getState().addSection(s, fakeCourse, 0))

    const added = useScheduleStore.getState().selectedSections[0]
    expect(added.crn).toBe('CRN-A')
    expect(added.meetings).toHaveLength(1)
    expect(added.meetings[0].days).toEqual(['M', 'W'])
  })
})

// --- removeSection ---

describe('removeSection', () => {
  it('removes a section by id', () => {
    const s = makeSection('A', ['M'], '10:00:00', '11:00:00')
    act(() => {
      useScheduleStore.getState().addSection(s, fakeCourse, 0)
      useScheduleStore.getState().removeSection('A')
    })
    expect(useScheduleStore.getState().selectedSections).toHaveLength(0)
  })

  it('only removes the targeted section', () => {
    const a = makeSection('A', ['M'], '08:00:00', '09:00:00')
    const b = makeSection('B', ['T'], '10:00:00', '11:00:00')
    act(() => {
      useScheduleStore.getState().addSection(a, fakeCourse, 0)
      useScheduleStore.getState().addSection(b, fakeCourse, 1)
      useScheduleStore.getState().removeSection('A')
    })
    const { selectedSections } = useScheduleStore.getState()
    expect(selectedSections).toHaveLength(1)
    expect(selectedSections[0].id).toBe('B')
  })

  it('is a no-op when id does not exist', () => {
    const s = makeSection('A', ['M'], '10:00:00', '11:00:00')
    act(() => {
      useScheduleStore.getState().addSection(s, fakeCourse, 0)
      useScheduleStore.getState().removeSection('nonexistent')
    })
    expect(useScheduleStore.getState().selectedSections).toHaveLength(1)
  })
})

// --- clearSchedule ---

describe('clearSchedule', () => {
  it('removes all sections', () => {
    const a = makeSection('A', ['M'], '08:00:00', '09:00:00')
    const b = makeSection('B', ['T'], '10:00:00', '11:00:00')
    act(() => {
      useScheduleStore.getState().addSection(a, fakeCourse, 0)
      useScheduleStore.getState().addSection(b, fakeCourse, 1)
      useScheduleStore.getState().clearSchedule()
    })
    expect(useScheduleStore.getState().selectedSections).toHaveLength(0)
  })

  it('is a no-op on already empty store', () => {
    act(() => useScheduleStore.getState().clearSchedule())
    expect(useScheduleStore.getState().selectedSections).toHaveLength(0)
  })
})

// --- isSelected ---

describe('isSelected', () => {
  it('returns false when section is not added', () => {
    expect(useScheduleStore.getState().isSelected('not-there')).toBe(false)
  })

  it('returns true after section is added', () => {
    const s = makeSection('A', ['M'], '10:00:00', '11:00:00')
    act(() => useScheduleStore.getState().addSection(s, fakeCourse, 0))
    expect(useScheduleStore.getState().isSelected('A')).toBe(true)
  })

  it('returns false after section is removed', () => {
    const s = makeSection('A', ['M'], '10:00:00', '11:00:00')
    act(() => {
      useScheduleStore.getState().addSection(s, fakeCourse, 0)
      useScheduleStore.getState().removeSection('A')
    })
    expect(useScheduleStore.getState().isSelected('A')).toBe(false)
  })
})

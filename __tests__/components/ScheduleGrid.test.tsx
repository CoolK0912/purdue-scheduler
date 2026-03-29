// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import ScheduleGrid from '@/components/ScheduleGrid'
import { useScheduleStore } from '@/store/scheduleStore'
import type { ApiCourse } from '@/types/purdue'

const fakeCourse: ApiCourse = {
  id: 'c1', number: '18200', title: 'Foundations', description: '', creditHours: 3, subject: 'CS', subjectName: 'Computer Science',
}

function makeSection(id: string, days: ('M' | 'T' | 'W' | 'R' | 'F')[], start: string, end: string) {
  return {
    id, crn: `CRN-${id}`, type: 'Lecture', instructors: ['Staff'],
    meetings: [{ id: `m-${id}`, type: 'Lecture', startTime: start, endTime: end, days, room: null, instructors: [] }],
  }
}

beforeEach(() => {
  act(() => useScheduleStore.setState({ semesterId: '', selectedSections: [] }))
})

describe('ScheduleGrid', () => {
  it('renders all 7 day headers', () => {
    render(<ScheduleGrid />)
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
  })

  it('renders time labels from 7 AM to 9 PM', () => {
    render(<ScheduleGrid />)
    expect(screen.getAllByText('7 AM').length).toBeGreaterThan(0)
    expect(screen.getAllByText('9 PM').length).toBeGreaterThan(0)
  })

  it('shows no course blocks when schedule is empty', () => {
    render(<ScheduleGrid />)
    expect(screen.queryByText(/CS 18200/)).not.toBeInTheDocument()
  })

  it('renders a course block when a section is added', () => {
    const s = makeSection('A', ['M', 'W', 'F'], '10:30:00', '11:20:00')
    act(() => useScheduleStore.getState().addSection(s, fakeCourse, 0))
    render(<ScheduleGrid />)
    // Course label appears in each column where the section meets (M, W, F = 3 blocks)
    const blocks = screen.getAllByText('CS 18200')
    expect(blocks.length).toBe(3)
  })

  it('renders blocks on the correct days only', () => {
    // Section only on T and R
    const s = makeSection('B', ['T', 'R'], '09:00:00', '09:50:00')
    act(() => useScheduleStore.getState().addSection(s, fakeCourse, 1))
    render(<ScheduleGrid />)
    const blocks = screen.getAllByText('CS 18200')
    expect(blocks.length).toBe(2) // T and R only
  })

  it('renders multiple course blocks for multiple sections', () => {
    const a = makeSection('A', ['M'], '08:00:00', '08:50:00')
    const b = makeSection('B', ['T'], '10:00:00', '10:50:00')

    const course2: ApiCourse = { ...fakeCourse, id: 'c2', number: '38400', subject: 'MA' }

    act(() => {
      useScheduleStore.getState().addSection(a, fakeCourse, 0)
      useScheduleStore.getState().addSection(b, course2, 1)
    })
    render(<ScheduleGrid />)
    expect(screen.getByText('CS 18200')).toBeInTheDocument()
    expect(screen.getByText('MA 38400')).toBeInTheDocument()
  })

  it('skips sections with null start/end times (no blocks rendered)', () => {
    const s = {
      id: 'TBA', crn: 'CRN-TBA', type: 'Online', instructors: [],
      meetings: [{ id: 'm-tba', type: 'Online', startTime: null, endTime: null, days: ['M' as const], room: null, instructors: [] }],
    }
    act(() => useScheduleStore.getState().addSection(s, fakeCourse, 0))
    render(<ScheduleGrid />)
    expect(screen.queryByText('CS 18200')).not.toBeInTheDocument()
  })
})

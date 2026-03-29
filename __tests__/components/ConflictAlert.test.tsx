// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ConflictAlert from '@/components/ConflictAlert'
import { useScheduleStore } from '@/store/scheduleStore'
import type { ApiCourse } from '@/types/purdue'

const fakeCourse: ApiCourse = {
  id: 'c1', number: '18200', title: 'Foundations', description: '', creditHours: 3, subject: 'CS', subjectName: 'Computer Science',
}

function makeSection(id: string, days: ('M' | 'T' | 'W')[]) {
  return {
    id, crn: `CRN-${id}`, type: 'Lecture', instructors: [],
    meetings: [{ id: `m-${id}`, type: 'Lecture', startTime: '10:00:00', endTime: '11:00:00', days, room: null, instructors: [] }],
  }
}

beforeEach(() => {
  act(() => useScheduleStore.setState({ semesterId: '', selectedSections: [] }))
})

describe('ConflictAlert', () => {
  it('renders nothing when there are no sections', () => {
    const { container } = render(<ConflictAlert />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when sections have no conflicts', () => {
    act(() => {
      useScheduleStore.getState().addSection(makeSection('A', ['M']), fakeCourse, 0)
      useScheduleStore.getState().addSection(makeSection('B', ['T']), fakeCourse, 1)
    })
    const { container } = render(<ConflictAlert />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders conflict warning when two sections overlap', () => {
    act(() => {
      useScheduleStore.getState().addSection(makeSection('A', ['M', 'W']), fakeCourse, 0)
      useScheduleStore.getState().addSection(makeSection('B', ['M']), fakeCourse, 1)
    })
    render(<ConflictAlert />)
    expect(screen.getByText(/Schedule Conflict Detected/i)).toBeInTheDocument()
  })

  it('lists the conflicting section CRNs', () => {
    act(() => {
      useScheduleStore.getState().addSection(makeSection('A', ['M']), fakeCourse, 0)
      useScheduleStore.getState().addSection(makeSection('B', ['M']), fakeCourse, 1)
    })
    render(<ConflictAlert />)
    expect(screen.getByText(/CRN-A/)).toBeInTheDocument()
    expect(screen.getByText(/CRN-B/)).toBeInTheDocument()
  })

  it('disappears after clicking the dismiss button', () => {
    act(() => {
      useScheduleStore.getState().addSection(makeSection('A', ['M']), fakeCourse, 0)
      useScheduleStore.getState().addSection(makeSection('B', ['M']), fakeCourse, 1)
    })
    render(<ConflictAlert />)
    expect(screen.getByText(/Schedule Conflict Detected/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText(/Schedule Conflict Detected/i)).not.toBeInTheDocument()
  })
})

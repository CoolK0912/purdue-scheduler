// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SelectedCoursesPanel from '@/components/SelectedCoursesPanel'
import { useScheduleStore } from '@/store/scheduleStore'
import type { ApiCourse } from '@/types/purdue'

const fakeCourse: ApiCourse = {
  id: 'c1', number: '18200', title: 'Foundations', description: '', creditHours: 3, subject: 'CS', subjectName: 'Computer Science',
}

function makeSection(id: string) {
  return {
    id, crn: `CRN-${id}`, type: 'Lecture', instructors: [],
    meetings: [{ id: `m-${id}`, type: 'Lecture', startTime: '10:00:00', endTime: '11:00:00', days: ['M' as const], room: null, instructors: [] }],
  }
}

beforeEach(() => {
  act(() => useScheduleStore.setState({ semesterId: '', selectedSections: [] }))
})

describe('SelectedCoursesPanel', () => {
  it('shows empty state message when no sections are selected', () => {
    render(<SelectedCoursesPanel />)
    expect(screen.getByText(/No courses added yet/i)).toBeInTheDocument()
  })

  it('shows a chip for each added section', () => {
    act(() => {
      useScheduleStore.getState().addSection(makeSection('A'), fakeCourse, 0)
      useScheduleStore.getState().addSection(makeSection('B'), fakeCourse, 1)
    })
    render(<SelectedCoursesPanel />)
    expect(screen.getAllByText(/CS 18200/).length).toBeGreaterThanOrEqual(2)
  })

  it('shows the section count', () => {
    act(() => {
      useScheduleStore.getState().addSection(makeSection('A'), fakeCourse, 0)
      useScheduleStore.getState().addSection(makeSection('B'), fakeCourse, 1)
    })
    render(<SelectedCoursesPanel />)
    expect(screen.getByText(/Selected Sections \(2\)/i)).toBeInTheDocument()
  })

  it('removes a section when its chip × button is clicked', () => {
    act(() => useScheduleStore.getState().addSection(makeSection('A'), fakeCourse, 0))
    render(<SelectedCoursesPanel />)

    fireEvent.click(screen.getByRole('button', { name: /Remove CS 18200/i }))
    expect(screen.getByText(/No courses added yet/i)).toBeInTheDocument()
  })

  it('clears all sections when "Clear all" is clicked', () => {
    act(() => {
      useScheduleStore.getState().addSection(makeSection('A'), fakeCourse, 0)
      useScheduleStore.getState().addSection(makeSection('B'), fakeCourse, 1)
    })
    render(<SelectedCoursesPanel />)

    fireEvent.click(screen.getByRole('button', { name: /Clear all/i }))
    expect(screen.getByText(/No courses added yet/i)).toBeInTheDocument()
  })

  it('shows the CRN in each chip', () => {
    act(() => useScheduleStore.getState().addSection(makeSection('X'), fakeCourse, 0))
    render(<SelectedCoursesPanel />)
    expect(screen.getByText(/CRN-X/)).toBeInTheDocument()
  })
})

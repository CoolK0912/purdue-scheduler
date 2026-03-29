// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SectionRow from '@/components/SectionRow'
import { useScheduleStore } from '@/store/scheduleStore'
import type { ApiSection, ApiCourse } from '@/types/purdue'

const fakeCourse: ApiCourse = {
  id: 'c1', number: '18200', title: 'Foundations', description: '', creditHours: 3, subject: 'CS', subjectName: 'Computer Science',
}

function makeSection(id: string, days: ApiSection['meetings'][0]['days'], start: string, end: string): ApiSection {
  return {
    id, crn: `CRN-${id}`, type: 'Lecture', instructors: ['Dr. Smith'],
    meetings: [{ id: `m-${id}`, type: 'Lecture', startTime: start, endTime: end, days, room: 'LWSN-1106', instructors: ['Dr. Smith'] }],
  }
}

beforeEach(() => {
  act(() => useScheduleStore.setState({ semesterId: '', selectedSections: [] }))
})

describe('SectionRow', () => {
  it('renders CRN, type abbreviation, and instructor', () => {
    const s = makeSection('A', ['M', 'W', 'F'], '10:30:00', '11:20:00')
    render(<SectionRow section={s} course={fakeCourse} colorIndex={0} />)
    expect(screen.getByText(/CRN CRN-A/)).toBeInTheDocument()
    expect(screen.getByText('LEC')).toBeInTheDocument()
    expect(screen.getByText(/Dr\. Smith/)).toBeInTheDocument()
  })

  it('formats time as a range (10:30–11:20 AM)', () => {
    const s = makeSection('A', ['M'], '10:30:00', '11:20:00')
    render(<SectionRow section={s} course={fakeCourse} colorIndex={0} />)
    expect(screen.getByText(/10:30.+11:20 AM/)).toBeInTheDocument()
  })

  it('shows "Add" button when section is not selected', () => {
    const s = makeSection('A', ['M'], '09:00:00', '10:00:00')
    render(<SectionRow section={s} course={fakeCourse} colorIndex={0} />)
    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument()
  })

  it('shows "Remove" button after section is added to store', () => {
    const s = makeSection('A', ['M'], '09:00:00', '10:00:00')
    act(() => useScheduleStore.getState().addSection(s, fakeCourse, 0))
    render(<SectionRow section={s} course={fakeCourse} colorIndex={0} />)
    expect(screen.getByRole('button', { name: /Remove/i })).toBeInTheDocument()
  })

  it('adds section to store when Add is clicked', () => {
    const s = makeSection('A', ['T', 'R'], '13:30:00', '14:20:00')
    render(<SectionRow section={s} course={fakeCourse} colorIndex={0} />)

    fireEvent.click(screen.getByRole('button', { name: /Add/i }))
    expect(useScheduleStore.getState().isSelected('A')).toBe(true)
  })

  it('removes section from store when Remove is clicked', () => {
    const s = makeSection('A', ['M'], '09:00:00', '10:00:00')
    act(() => useScheduleStore.getState().addSection(s, fakeCourse, 0))
    render(<SectionRow section={s} course={fakeCourse} colorIndex={0} />)

    fireEvent.click(screen.getByRole('button', { name: /Remove/i }))
    expect(useScheduleStore.getState().isSelected('A')).toBe(false)
  })

  it('disables Add and shows CONFLICT label when section conflicts with a selected one', () => {
    // Add a section that occupies Monday 10-11
    const existing = makeSection('X', ['M'], '10:00:00', '11:00:00')
    act(() => useScheduleStore.getState().addSection(existing, fakeCourse, 0))

    // Render a new section that also occupies Monday 10:30-11:30 (overlaps)
    const conflicting = makeSection('Y', ['M'], '10:30:00', '11:30:00')
    render(<SectionRow section={conflicting} course={fakeCourse} colorIndex={1} />)

    const addBtn = screen.getByRole('button', { name: /Add/i })
    expect(addBtn).toBeDisabled()
    expect(screen.getByText(/CONFLICT/i)).toBeInTheDocument()
  })

  it('does not show CONFLICT when days do not overlap', () => {
    const existing = makeSection('X', ['M', 'W', 'F'], '10:00:00', '11:00:00')
    act(() => useScheduleStore.getState().addSection(existing, fakeCourse, 0))

    const noConflict = makeSection('Y', ['T', 'R'], '10:00:00', '11:00:00')
    render(<SectionRow section={noConflict} course={fakeCourse} colorIndex={1} />)

    expect(screen.queryByText(/CONFLICT/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add/i })).not.toBeDisabled()
  })

  it('shows "TBA" when no meetings exist', () => {
    const noMeeting: ApiSection = { id: 'Z', crn: 'CRN-Z', type: 'Online', instructors: [], meetings: [] }
    render(<SectionRow section={noMeeting} course={fakeCourse} colorIndex={0} />)
    expect(screen.getByText(/TBA/)).toBeInTheDocument()
  })
})

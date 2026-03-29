// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import SearchBar from '@/components/SearchBar'
import { useScheduleStore } from '@/store/scheduleStore'

vi.mock('swr', () => ({
  default: vi.fn(),
}))

// CourseCard uses SWR internally too — mock it to avoid nested fetch issues
vi.mock('@/components/CourseCard', () => ({
  default: ({ course }: { course: { subject: string; number: string; title: string } }) => (
    <div data-testid="course-card">{course.subject} {course.number} — {course.title}</div>
  ),
}))

import useSWR from 'swr'
const mockUseSWR = vi.mocked(useSWR)

const fakeCourses = [
  { id: 'c1', number: '18200', title: 'Foundations of CS', subject: 'CS', subjectName: 'Computer Science', description: '', creditHours: 3 },
  { id: 'c2', number: '18000', title: 'Problem Solving', subject: 'CS', subjectName: 'Computer Science', description: '', creditHours: 3 },
]

beforeEach(() => {
  act(() => useScheduleStore.setState({ semesterId: '', selectedSections: [] }))
  vi.clearAllMocks()
})

describe('SearchBar', () => {
  it('renders a disabled input when no semester is selected', () => {
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: false } as any)
    render(<SearchBar />)
    expect(screen.getByPlaceholderText(/Select a semester first/i)).toBeDisabled()
  })

  it('renders an enabled input when semester is set', () => {
    act(() => useScheduleStore.setState({ semesterId: 'sem1', selectedSections: [] }))
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: false } as any)
    render(<SearchBar />)
    expect(screen.getByPlaceholderText(/Search courses/i)).not.toBeDisabled()
  })

  it('shows loading skeletons while fetching', () => {
    act(() => useScheduleStore.setState({ semesterId: 'sem1', selectedSections: [] }))
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: true } as any)
    const { container } = render(<SearchBar />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows "N courses found" when results load', () => {
    act(() => useScheduleStore.setState({ semesterId: 'sem1', selectedSections: [] }))
    mockUseSWR.mockReturnValue({ data: fakeCourses, isLoading: false } as any)
    render(<SearchBar />)
    expect(screen.getByText(/2 courses found/i)).toBeInTheDocument()
  })

  it('renders a CourseCard for each result', () => {
    act(() => useScheduleStore.setState({ semesterId: 'sem1', selectedSections: [] }))
    mockUseSWR.mockReturnValue({ data: fakeCourses, isLoading: false } as any)
    render(<SearchBar />)
    expect(screen.getAllByTestId('course-card')).toHaveLength(2)
  })

  it('shows "No courses found" when results are empty', () => {
    act(() => useScheduleStore.setState({ semesterId: 'sem1', selectedSections: [] }))
    mockUseSWR.mockReturnValue({ data: [], isLoading: false } as any)

    render(<SearchBar />)
    // Trigger a search by typing something
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ZZZZ' } })
    expect(screen.getByText(/No courses found/i)).toBeInTheDocument()
  })

  it('shows error message when fetch fails', () => {
    act(() => useScheduleStore.setState({ semesterId: 'sem1', selectedSections: [] }))
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: false, error: new Error('oops') } as any)
    render(<SearchBar />)
    expect(screen.getByText(/Failed to load courses/i)).toBeInTheDocument()
  })

  it('shows clear (✕) button when input has text', () => {
    act(() => useScheduleStore.setState({ semesterId: 'sem1', selectedSections: [] }))
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: false } as any)
    render(<SearchBar />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'CS' } })
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('clears input when ✕ is clicked', () => {
    act(() => useScheduleStore.setState({ semesterId: 'sem1', selectedSections: [] }))
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: false } as any)
    render(<SearchBar />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'CS' } })
    fireEvent.click(screen.getByRole('button'))
    expect((input as HTMLInputElement).value).toBe('')
  })
})

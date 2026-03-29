// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SemesterSelect from '@/components/SemesterSelect'
import { useScheduleStore } from '@/store/scheduleStore'

// Mock SWR so we don't make real HTTP requests
vi.mock('swr', () => ({
  default: vi.fn(),
}))

import useSWR from 'swr'
const mockUseSWR = vi.mocked(useSWR)

beforeEach(() => {
  act(() => useScheduleStore.setState({ semesterId: '', selectedSections: [] }))
  vi.clearAllMocks()
})

describe('SemesterSelect', () => {
  it('shows a loading skeleton while data is loading', () => {
    mockUseSWR.mockReturnValue({ data: undefined, isLoading: true } as any)
    const { container } = render(<SemesterSelect />)
    // Loading state renders a div with animate-pulse
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders a select dropdown once data loads', () => {
    mockUseSWR.mockReturnValue({
      data: [
        { id: 'sem1', code: '202710', name: 'Fall 2026' },
        { id: 'sem2', code: '202620', name: 'Spring 2026' },
      ],
      isLoading: false,
    } as any)
    render(<SemesterSelect />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders one option per semester plus the placeholder', () => {
    mockUseSWR.mockReturnValue({
      data: [
        { id: 'sem1', code: '202710', name: 'Fall 2026' },
        { id: 'sem2', code: '202620', name: 'Spring 2026' },
      ],
      isLoading: false,
    } as any)
    render(<SemesterSelect />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3) // placeholder + 2 semesters
    expect(screen.getByRole('option', { name: 'Fall 2026' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Spring 2026' })).toBeInTheDocument()
  })

  it('updates the store semesterId when a semester is selected', () => {
    mockUseSWR.mockReturnValue({
      data: [{ id: 'sem1', code: '202710', name: 'Fall 2026' }],
      isLoading: false,
    } as any)
    render(<SemesterSelect />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'sem1' } })
    expect(useScheduleStore.getState().semesterId).toBe('sem1')
  })

  it('renders empty select when no semesters are returned', () => {
    mockUseSWR.mockReturnValue({ data: [], isLoading: false } as any)
    render(<SemesterSelect />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(1) // only placeholder
  })
})

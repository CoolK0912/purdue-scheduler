import { describe, it, expect } from 'vitest'
import { hasConflict, findConflicts, conflictingIds } from '@/lib/conflicts'
import type { ApiSection, ApiMeeting } from '@/types/purdue'

// --- Helpers to build test fixtures ---

function meeting(
  days: ApiMeeting['days'],
  startTime: string | null,
  endTime: string | null
): ApiMeeting {
  return { id: Math.random().toString(), type: 'Lecture', startTime, endTime, days, room: null, instructors: [] }
}

function section(id: string, meetings: ApiMeeting[]): ApiSection {
  return {
    id,
    crn: `CRN-${id}`,
    type: 'Lecture',
    instructors: [],
    meetings,
  }
}

// --- hasConflict ---

describe('hasConflict', () => {
  it('detects overlap on same day and overlapping time', () => {
    const a = section('A', [meeting(['M', 'W', 'F'], '10:30:00', '11:20:00')])
    const b = section('B', [meeting(['M', 'W', 'F'], '11:00:00', '11:50:00')])
    expect(hasConflict(a, b)).toBe(true)
  })

  it('no conflict when times do not overlap', () => {
    const a = section('A', [meeting(['M', 'W', 'F'], '08:30:00', '09:20:00')])
    const b = section('B', [meeting(['M', 'W', 'F'], '09:30:00', '10:20:00')])
    expect(hasConflict(a, b)).toBe(false)
  })

  it('no conflict when days do not overlap', () => {
    const a = section('A', [meeting(['M', 'W', 'F'], '10:30:00', '11:20:00')])
    const b = section('B', [meeting(['T', 'R'], '10:30:00', '11:20:00')])
    expect(hasConflict(a, b)).toBe(false)
  })

  it('no conflict when back-to-back (aEnd === bStart)', () => {
    const a = section('A', [meeting(['M'], '09:00:00', '10:00:00')])
    const b = section('B', [meeting(['M'], '10:00:00', '11:00:00')])
    expect(hasConflict(a, b)).toBe(false)
  })

  it('conflict when one section fully contains the other', () => {
    const a = section('A', [meeting(['T', 'R'], '09:00:00', '12:00:00')])
    const b = section('B', [meeting(['T'], '10:00:00', '11:00:00')])
    expect(hasConflict(a, b)).toBe(true)
  })

  it('no conflict when either section has null times', () => {
    const a = section('A', [meeting(['M'], null, null)])
    const b = section('B', [meeting(['M'], '09:00:00', '10:00:00')])
    expect(hasConflict(a, b)).toBe(false)
  })

  it('no conflict when sections have no meetings', () => {
    const a = section('A', [])
    const b = section('B', [meeting(['M'], '09:00:00', '10:00:00')])
    expect(hasConflict(a, b)).toBe(false)
  })

  it('detects conflict across multiple meetings (e.g. lab conflicts with lecture)', () => {
    const a = section('A', [
      meeting(['M', 'W', 'F'], '08:00:00', '08:50:00'),
      meeting(['T'], '14:00:00', '15:50:00'), // lab
    ])
    const b = section('B', [meeting(['T', 'R'], '14:30:00', '15:20:00')])
    expect(hasConflict(a, b)).toBe(true)
  })

  it('is symmetric — hasConflict(a, b) === hasConflict(b, a)', () => {
    const a = section('A', [meeting(['M', 'W'], '10:00:00', '11:00:00')])
    const b = section('B', [meeting(['W', 'F'], '10:30:00', '11:30:00')])
    expect(hasConflict(a, b)).toBe(hasConflict(b, a))
  })
})

// --- findConflicts ---

describe('findConflicts', () => {
  it('returns empty array for a single section', () => {
    const a = section('A', [meeting(['M'], '09:00:00', '10:00:00')])
    expect(findConflicts([a])).toEqual([])
  })

  it('returns empty array when no sections conflict', () => {
    const a = section('A', [meeting(['M', 'W', 'F'], '08:30:00', '09:20:00')])
    const b = section('B', [meeting(['T', 'R'], '10:30:00', '11:20:00')])
    const c = section('C', [meeting(['M', 'W', 'F'], '13:30:00', '14:20:00')])
    expect(findConflicts([a, b, c])).toEqual([])
  })

  it('returns one pair when two sections conflict', () => {
    const a = section('A', [meeting(['M', 'W', 'F'], '10:30:00', '11:20:00')])
    const b = section('B', [meeting(['M'], '11:00:00', '11:50:00')])
    const c = section('C', [meeting(['T', 'R'], '09:00:00', '10:15:00')])
    const result = findConflicts([a, b, c])
    expect(result).toHaveLength(1)
    expect(result[0][0].id).toBe('A')
    expect(result[0][1].id).toBe('B')
  })

  it('returns multiple pairs when several sections conflict', () => {
    const a = section('A', [meeting(['M'], '10:00:00', '11:00:00')])
    const b = section('B', [meeting(['M'], '10:30:00', '11:30:00')])
    const c = section('C', [meeting(['M'], '10:45:00', '11:45:00')])
    const result = findConflicts([a, b, c])
    expect(result).toHaveLength(3) // A-B, A-C, B-C
  })

  it('returns empty array for empty input', () => {
    expect(findConflicts([])).toEqual([])
  })
})

// --- conflictingIds ---

describe('conflictingIds', () => {
  it('returns empty set when no conflicts', () => {
    const a = section('A', [meeting(['M'], '08:00:00', '09:00:00')])
    const b = section('B', [meeting(['T'], '08:00:00', '09:00:00')])
    expect(conflictingIds([a, b]).size).toBe(0)
  })

  it('includes both section IDs when they conflict', () => {
    const a = section('A', [meeting(['M'], '10:00:00', '11:00:00')])
    const b = section('B', [meeting(['M'], '10:30:00', '11:30:00')])
    const ids = conflictingIds([a, b])
    expect(ids.has('A')).toBe(true)
    expect(ids.has('B')).toBe(true)
  })

  it('only includes IDs that are actually conflicting, not clean ones', () => {
    const a = section('A', [meeting(['M'], '10:00:00', '11:00:00')])
    const b = section('B', [meeting(['M'], '10:30:00', '11:30:00')])
    const c = section('C', [meeting(['T', 'R'], '14:00:00', '15:00:00')]) // no conflict
    const ids = conflictingIds([a, b, c])
    expect(ids.has('A')).toBe(true)
    expect(ids.has('B')).toBe(true)
    expect(ids.has('C')).toBe(false)
  })
})

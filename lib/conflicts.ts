// Conflict detection logic — pure functions, no dependencies
// A "conflict" is any two sections that share a day and have overlapping times.

import type { ApiSection, ApiMeeting } from '@/types/purdue'

// Convert "HH:MM:SS" time string to minutes since midnight
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function meetingsOverlap(a: ApiMeeting, b: ApiMeeting): boolean {
  // No time data means we can't detect a conflict
  if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) return false

  // Check if they share at least one day
  const sharedDay = a.days.some((d) => b.days.includes(d))
  if (!sharedDay) return false

  // Check time overlap: [aStart, aEnd) overlaps [bStart, bEnd) if aStart < bEnd && bStart < aEnd
  const aStart = toMinutes(a.startTime)
  const aEnd = toMinutes(a.endTime)
  const bStart = toMinutes(b.startTime)
  const bEnd = toMinutes(b.endTime)

  return aStart < bEnd && bStart < aEnd
}

/**
 * Returns true if any meeting in section A overlaps with any meeting in section B.
 */
export function hasConflict(a: ApiSection, b: ApiSection): boolean {
  for (const ma of a.meetings) {
    for (const mb of b.meetings) {
      if (meetingsOverlap(ma, mb)) return true
    }
  }
  return false
}

/**
 * Returns all conflicting pairs from a list of selected sections.
 * Each pair [a, b] means those two sections overlap.
 */
export function findConflicts(sections: ApiSection[]): [ApiSection, ApiSection][] {
  const conflicts: [ApiSection, ApiSection][] = []
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      if (hasConflict(sections[i], sections[j])) {
        conflicts.push([sections[i], sections[j]])
      }
    }
  }
  return conflicts
}

/**
 * Returns the set of section IDs that are in conflict with any other selected section.
 * Useful for highlighting conflicting sections in the UI.
 */
export function conflictingIds(sections: ApiSection[]): Set<string> {
  const pairs = findConflicts(sections)
  const ids = new Set<string>()
  for (const [a, b] of pairs) {
    ids.add(a.id)
    ids.add(b.id)
  }
  return ids
}

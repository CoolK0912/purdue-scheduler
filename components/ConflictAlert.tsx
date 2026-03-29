'use client'

import { useState } from 'react'
import { useScheduleStore, type SelectedSection } from '@/store/scheduleStore'
import { findConflicts } from '@/lib/conflicts'

export default function ConflictAlert() {
  const { selectedSections } = useScheduleStore()
  const [dismissed, setDismissed] = useState(false)

  const conflicts = findConflicts(selectedSections)

  if (conflicts.length === 0 || dismissed) return null

  const conflictLabels = conflicts.map(
    ([a, b]) =>
      `${(a as SelectedSection).courseLabel} (CRN ${a.crn}) ↔ ${(b as SelectedSection).courseLabel} (CRN ${b.crn})`
  )

  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-800 dark:bg-red-950">
      <span className="mt-0.5 text-red-500">⚠</span>
      <div className="flex-1">
        <p className="font-semibold text-red-700 dark:text-red-300">Schedule Conflict Detected</p>
        <ul className="mt-1 space-y-0.5 text-red-600 dark:text-red-400">
          {conflictLabels.map((label, i) => (
            <li key={i}>{label}</li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-red-400 hover:text-red-600 dark:hover:text-red-200"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

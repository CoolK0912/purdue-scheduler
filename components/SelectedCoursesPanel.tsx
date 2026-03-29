'use client'

import { useScheduleStore } from '@/store/scheduleStore'
import { COURSE_COLORS } from '@/lib/courseColors'

export default function SelectedCoursesPanel() {
  const { selectedSections, removeSection, clearSchedule } = useScheduleStore()

  if (selectedSections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
        No courses added yet. Search and add sections to build your schedule.
      </div>
    )
  }

  // Sum credit hours once per unique course (lecture + lab of same course count once)
  const totalCredits = Array.from(
    new Map(selectedSections.map((s) => [s.courseId, s.creditHours])).values()
  ).reduce((sum, cr) => sum + cr, 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Selected Sections ({selectedSections.length})
          {totalCredits > 0 && (
            <span className="ml-2 rounded-full bg-[#CEB100] px-2 py-0.5 text-[11px] font-bold text-black">
              {totalCredits} cr
            </span>
          )}
        </h3>
        <button
          onClick={clearSchedule}
          className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedSections.map((s) => {
          const color = COURSE_COLORS[s.colorIndex % COURSE_COLORS.length]
          return (
            <div
              key={s.id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${color.chip}`}
            >
              <span>{s.courseLabel}</span>
              <span className="opacity-60">CRN {s.crn}</span>
              <button
                onClick={() => removeSection(s.id)}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${s.courseLabel}`}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

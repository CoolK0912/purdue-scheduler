'use client'

import { useScheduleStore } from '@/store/scheduleStore'
import { conflictingIds } from '@/lib/conflicts'
import type { ApiSection, ApiCourse } from '@/types/purdue'

interface Props {
  section: ApiSection
  course: ApiCourse
  colorIndex: number
}

function formatTime(t: string | null): string {
  if (!t) return 'TBA'
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function formatDays(days: string[]): string {
  return days.join('') || 'TBA'
}

export default function SectionRow({ section, course, colorIndex }: Props) {
  const { selectedSections, addSection, removeSection, isSelected } = useScheduleStore()
  const selected = isSelected(section.id)

  const conflicts = conflictingIds([...selectedSections, section])
  const wouldConflict = !selected && conflicts.has(section.id)

  const seatsLeft = section.enrollMax - section.enrolled
  const seatColor =
    seatsLeft <= 0
      ? 'text-red-600'
      : seatsLeft <= 5
      ? 'text-amber-600'
      : 'text-emerald-600'

  const primaryMeeting = section.meetings[0]

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors ${
        selected
          ? 'border-[#CEB100] bg-yellow-50 dark:bg-yellow-950/30'
          : wouldConflict
          ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900'
      }`}
    >
      {/* Type badge */}
      <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
        {section.type}
      </span>

      {/* CRN */}
      <span className="shrink-0 font-mono text-zinc-500">CRN {section.crn}</span>

      {/* Days + time */}
      <span className="min-w-0 flex-1 truncate text-zinc-700 dark:text-zinc-300">
        {primaryMeeting ? (
          <>
            <span className="font-medium">{formatDays(primaryMeeting.days)}</span>{' '}
            {formatTime(primaryMeeting.startTime)}–{formatTime(primaryMeeting.endTime)}
            {primaryMeeting.room && (
              <span className="ml-1 text-zinc-400">· {primaryMeeting.room}</span>
            )}
          </>
        ) : (
          'TBA'
        )}
      </span>

      {/* Instructor */}
      <span className="hidden shrink-0 text-zinc-500 sm:block">
        {section.instructors[0] ?? 'Staff'}
      </span>

      {/* Seats */}
      <span className={`shrink-0 font-medium ${seatColor}`}>
        {seatsLeft <= 0 ? 'Full' : `${seatsLeft} left`}
      </span>

      {/* Conflict indicator */}
      {wouldConflict && (
        <span className="shrink-0 text-[10px] font-semibold text-red-500">CONFLICT</span>
      )}

      {/* Add / Remove button */}
      <button
        onClick={() =>
          selected ? removeSection(section.id) : addSection(section, course, colorIndex)
        }
        disabled={wouldConflict}
        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          selected
            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400'
            : 'bg-[#CEB100] text-black hover:bg-[#b8a000]'
        }`}
      >
        {selected ? 'Remove' : 'Add'}
      </button>
    </div>
  )
}

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
  if (!t) return '?'
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'TBA'
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const sPeriod = sh >= 12 ? 'PM' : 'AM'
  const ePeriod = eh >= 12 ? 'PM' : 'AM'
  const sHour = sh % 12 || 12
  const eHour = eh % 12 || 12
  const sStr = `${sHour}:${String(sm).padStart(2, '0')}`
  const eStr = `${eHour}:${String(em).padStart(2, '0')} ${ePeriod}`
  // Omit start period if same as end
  return sPeriod === ePeriod ? `${sStr}–${eStr}` : `${sStr} ${sPeriod}–${eStr}`
}

function formatDays(days: string[]): string {
  if (!days.length) return 'TBA'
  return days.join('')
}

const TYPE_ABBR: Record<string, string> = {
  Lecture: 'LEC',
  Laboratory: 'LAB',
  Lab: 'LAB',
  Recitation: 'REC',
  Discussion: 'DIS',
  Seminar: 'SEM',
  Studio: 'STU',
  Online: 'ONL',
}

export default function SectionRow({ section, course, colorIndex }: Props) {
  const { selectedSections, addSection, removeSection, isSelected } = useScheduleStore()
  const selected = isSelected(section.id)

  const conflicts = conflictingIds([...selectedSections, section])
  const wouldConflict = !selected && conflicts.has(section.id)

  const primaryMeeting = section.meetings[0]
  const instructor = primaryMeeting?.instructors?.[0] ?? section.instructors[0] ?? 'Staff'
  const typeLabel = TYPE_ABBR[section.type] ?? section.type?.slice(0, 3).toUpperCase() ?? '?'

  const borderClass = selected
    ? 'border-[#CEB100]'
    : wouldConflict
    ? 'border-red-300 dark:border-red-700'
    : 'border-zinc-200 dark:border-zinc-700'

  const bgClass = selected
    ? 'bg-yellow-50 dark:bg-yellow-950/20'
    : wouldConflict
    ? 'bg-red-50/60 dark:bg-red-950/20'
    : 'bg-white dark:bg-zinc-900'

  return (
    <div className={`rounded-lg border ${borderClass} ${bgClass} px-3 py-2 text-xs transition-colors`}>
      <div className="flex items-center gap-2">
        {/* Days + time — the most important info, shown first */}
        <div className="min-w-0 flex-1">
          {primaryMeeting ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="font-bold text-zinc-800 dark:text-zinc-100 text-sm">
                {formatDays(primaryMeeting.days)}
              </span>
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                {formatTimeRange(primaryMeeting.startTime, primaryMeeting.endTime)}
              </span>
              {section.meetings.length > 1 && (
                <span className="text-zinc-400 text-[10px]">+{section.meetings.length - 1} more</span>
              )}
            </div>
          ) : (
            <span className="font-medium text-zinc-500">TBA</span>
          )}

          {/* Second line: type badge, CRN, instructor */}
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="rounded bg-zinc-100 px-1 py-px font-mono dark:bg-zinc-800">
              {typeLabel}
            </span>
            <span>CRN {section.crn}</span>
            <span className="truncate">· {instructor}</span>
            {wouldConflict && (
              <span className="ml-auto shrink-0 font-semibold text-red-500">CONFLICT</span>
            )}
          </div>

          {/* Extra meetings (lab, recitation) */}
          {section.meetings.slice(1).map((m, i) => (
            <div key={i} className="mt-0.5 flex items-baseline gap-1.5 text-[10px] text-zinc-500">
              <span className="font-semibold">{formatDays(m.days)}</span>
              <span>{formatTimeRange(m.startTime, m.endTime)}</span>
              <span className="text-zinc-400">
                {TYPE_ABBR[m.type] ?? m.type?.slice(0, 3).toUpperCase()}
              </span>
            </div>
          ))}
        </div>

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
    </div>
  )
}

'use client'

import { useScheduleStore, type SelectedSection } from '@/store/scheduleStore'
import { conflictingIds } from '@/lib/conflicts'
import { COURSE_COLORS } from '@/lib/courseColors'
import type { ApiMeeting } from '@/types/purdue'

// Grid config
const START_HOUR = 7   // 7 AM
const END_HOUR = 22    // 10 PM
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60
const SLOT_HEIGHT = 48  // px per hour

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const DAY_MAP: Record<string, number> = { M: 0, T: 1, W: 2, R: 3, F: 4, Sa: 5, Su: 6 }

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function timeToTop(time: string): number {
  return ((toMinutes(time) - START_HOUR * 60) / 60) * SLOT_HEIGHT
}

function durationToHeight(start: string, end: string): number {
  return ((toMinutes(end) - toMinutes(start)) / 60) * SLOT_HEIGHT
}

function formatTimeLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h} ${period}`
}

interface Block {
  section: SelectedSection
  meeting: ApiMeeting
  dayIndex: number
  top: number
  height: number
  isConflict: boolean
}

export default function ScheduleGrid() {
  const { selectedSections } = useScheduleStore()
  const conflicts = conflictingIds(selectedSections)

  // Build blocks for each meeting of each section
  const blocks: Block[] = []
  for (const section of selectedSections) {
    for (const meeting of section.meetings) {
      if (!meeting.startTime || !meeting.endTime) continue
      const top = timeToTop(meeting.startTime)
      const height = durationToHeight(meeting.startTime, meeting.endTime)
      if (height < 4) continue // skip zero-duration
      for (const day of meeting.days) {
        const dayIndex = DAY_MAP[day]
        if (dayIndex === undefined) continue
        blocks.push({
          section,
          meeting,
          dayIndex,
          top,
          height,
          isConflict: conflicts.has(section.id),
        })
      }
    }
  }

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const gridHeight = TOTAL_MINUTES / 60 * SLOT_HEIGHT

  return (
    <div className="overflow-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex">
        {/* Time gutter */}
        <div className="sticky left-0 z-10 shrink-0 bg-white dark:bg-zinc-900">
          {/* Corner spacer */}
          <div className="h-8 border-b border-r border-zinc-200 dark:border-zinc-700" />
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-0 flex items-start pr-2 text-[10px] text-zinc-400"
                style={{ top: (h - START_HOUR) * SLOT_HEIGHT - 6, width: 48 }}
              >
                {formatTimeLabel(h)}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex min-w-0 flex-1">
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex min-w-0 flex-1 flex-col">
              {/* Day header */}
              <div className="flex h-8 items-center justify-center border-b border-l border-zinc-200 text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                {day}
              </div>

              {/* Column body */}
              <div
                className="relative border-l border-zinc-200 dark:border-zinc-700"
                style={{ height: gridHeight }}
              >
                {/* Hour gridlines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute inset-x-0 border-t border-zinc-100 dark:border-zinc-800"
                    style={{ top: (h - START_HOUR) * SLOT_HEIGHT }}
                  />
                ))}
                {/* Half-hour gridlines */}
                {hours.map((h) => (
                  <div
                    key={`${h}h`}
                    className="absolute inset-x-0 border-t border-dashed border-zinc-100 dark:border-zinc-800"
                    style={{ top: (h - START_HOUR) * SLOT_HEIGHT + SLOT_HEIGHT / 2 }}
                  />
                ))}

                {/* Course blocks */}
                {blocks
                  .filter((b) => b.dayIndex === dayIdx)
                  .map((b, i) => {
                    const color = COURSE_COLORS[b.section.colorIndex % COURSE_COLORS.length]
                    return (
                      <div
                        key={`${b.section.id}-${b.meeting.id}-${i}`}
                        className={`group absolute inset-x-0.5 overflow-hidden rounded border ${color.block} ${
                          b.isConflict ? 'ring-2 ring-red-500 ring-offset-0' : ''
                        }`}
                        style={{ top: b.top, height: Math.max(b.height, 20) }}
                        title={`${b.section.courseLabel} — ${b.section.courseTitle}\nCRN: ${b.section.crn}\n${b.meeting.startTime?.slice(0, 5)}–${b.meeting.endTime?.slice(0, 5)}\n${b.meeting.room ?? ''}`}
                      >
                        <div className="flex h-full flex-col justify-start overflow-hidden p-1 leading-tight">
                          <span className="truncate text-[10px] font-bold">
                            {b.section.courseLabel}
                          </span>
                          {b.height > 28 && (
                            <span className="truncate text-[9px] opacity-75">
                              CRN {b.section.crn}
                            </span>
                          )}
                          {b.height > 42 && b.meeting.room && (
                            <span className="truncate text-[9px] opacity-60">
                              {b.meeting.room}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

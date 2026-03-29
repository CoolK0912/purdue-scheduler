'use client'

import { useState } from 'react'
import useSWR from 'swr'
import SectionRow from './SectionRow'
import { COURSE_COLORS } from '@/lib/courseColors'
import { useScheduleStore } from '@/store/scheduleStore'
import type { ApiCourse, ApiSection } from '@/types/purdue'

interface Props {
  course: ApiCourse
  colorIndex: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CourseCard({ course, colorIndex }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { semesterId } = useScheduleStore()
  const color = COURSE_COLORS[colorIndex % COURSE_COLORS.length]

  const { data: sections, isLoading } = useSWR<ApiSection[]>(
    expanded ? `/api/courses/${course.id}/sections?semester=${semesterId}` : null,
    fetcher
  )

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        {/* Color dot */}
        <span
          className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${color.border} ${color.block.split(' ')[0]}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {course.subject} {course.number}
            </span>
            {course.creditHours > 0 && (
              <span className="text-xs text-zinc-400">{course.creditHours} cr</span>
            )}
          </div>
          <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">{course.title}</p>
        </div>
        <span
          className={`shrink-0 text-zinc-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-3 pt-2 dark:border-zinc-800">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          )}
          {!isLoading && sections?.length === 0 && (
            <p className="py-2 text-center text-xs text-zinc-400">No sections available this semester.</p>
          )}
          {!isLoading && sections && sections.length > 0 && (
            <div className="space-y-1.5">
              {sections.map((s) => (
                <SectionRow key={s.id} section={s} course={course} colorIndex={colorIndex} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

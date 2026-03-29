'use client'

import useSWR from 'swr'
import { useScheduleStore } from '@/store/scheduleStore'
import type { ApiSemester } from '@/types/purdue'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SemesterSelect() {
  const { data: semesters, isLoading } = useSWR<ApiSemester[]>('/api/semesters', fetcher)
  const { semesterId, setSemester } = useScheduleStore()

  if (isLoading) {
    return (
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
    )
  }

  return (
    <select
      value={semesterId}
      onChange={(e) => setSemester(e.target.value)}
      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm focus:border-[#CEB100] focus:outline-none focus:ring-2 focus:ring-[#CEB100]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <option value="">Select a semester…</option>
      {(semesters ?? []).map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import CourseCard from './CourseCard'
import { useScheduleStore } from '@/store/scheduleStore'
import type { ApiCourse } from '@/types/purdue'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Assign a stable color index per course id within a search session
const colorCache = new Map<string, number>()
let colorCounter = 0
function getCourseColor(id: string): number {
  if (!colorCache.has(id)) {
    colorCache.set(id, colorCounter++ % 8)
  }
  return colorCache.get(id)!
}

export default function SearchBar() {
  const { semesterId } = useScheduleStore()
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (input.length >= 2) setQuery(input)
      else setQuery('')
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input])

  const canSearch = !!semesterId && query.length >= 2
  const { data: courses, isLoading, error } = useSWR<ApiCourse[]>(
    canSearch ? `/api/courses?q=${encodeURIComponent(query)}&semester=${semesterId}` : null,
    fetcher
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
          🔍
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={semesterId ? 'Search courses, e.g. CS 18200…' : 'Select a semester first'}
          disabled={!semesterId}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-9 text-sm text-zinc-800 shadow-sm placeholder:text-zinc-400 focus:border-[#CEB100] focus:outline-none focus:ring-2 focus:ring-[#CEB100]/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {input && (
          <button
            onClick={() => { setInput(''); setQuery('') }}
            className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          Failed to load courses. Check your connection.
        </p>
      )}
      {!isLoading && courses && courses.length === 0 && (
        <p className="text-center text-sm text-zinc-400">No courses found for "{query}".</p>
      )}
      {!isLoading && courses && courses.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">{courses.length} course{courses.length !== 1 ? 's' : ''} found</p>
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} colorIndex={getCourseColor(c.id)} />
          ))}
        </div>
      )}
      {!canSearch && !isLoading && input.length > 0 && input.length < 2 && (
        <p className="text-xs text-zinc-400">Type at least 2 characters to search.</p>
      )}
    </div>
  )
}

import SemesterSelect from '@/components/SemesterSelect'
import SearchBar from '@/components/SearchBar'
import ScheduleGrid from '@/components/ScheduleGrid'
import ConflictAlert from '@/components/ConflictAlert'
import SelectedCoursesPanel from '@/components/SelectedCoursesPanel'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] dark:bg-[#0f0f0f]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#1A1A1A] shadow-sm dark:border-zinc-800">
        <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1.5 rounded-full bg-[#CEB100]" />
            <span className="text-lg font-bold tracking-tight text-white">
              Purdue <span className="text-[#CEB100]">Scheduler</span>
            </span>
          </div>
          <span className="hidden text-xs text-zinc-400 sm:block">
            Build your perfect semester schedule
          </span>
        </div>
      </header>

      {/* Main layout */}
      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-4 p-4 lg:flex-row lg:items-start lg:gap-6">

        {/* Left panel: Search */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[57px] lg:w-[380px] lg:shrink-0">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Semester
            </h2>
            <SemesterSelect />
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Course Search
            </h2>
            <SearchBar />
          </div>
        </aside>

        {/* Right panel: Schedule */}
        <section className="flex flex-1 flex-col gap-4 min-w-0">
          <ConflictAlert />

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              My Schedule
            </h2>
            <SelectedCoursesPanel />
          </div>

          <ScheduleGrid />
        </section>
      </main>
    </div>
  )
}

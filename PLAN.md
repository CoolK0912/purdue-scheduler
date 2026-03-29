# Purdue Course Scheduler Website — Plan

## Context

Purdue's current scheduling tools (myPurdue / Banner 9 SSB) are clunky and hard to use for planning a full semester. The goal is a modern, intuitive website that pulls real-time Fall 2026 course data and makes building a schedule fast and conflict-free.

---

## Data Sources

### Primary: Purdue.io API (Recommended)
- **URL**: https://api.purdue.io/
- **GitHub**: https://github.com/Purdue-io/PurdueApi
- **Type**: REST + OData queries, no auth required for reads
- **Entities**: Courses, Classes, Sections, Meetings, Instructors, Campuses
- **Example query**: `GET https://api.purdue.io/odata/Courses?$filter=...`
- **Notes**: Open-source, mature (2015+), actively maintained, pulls from myPurdue

### Fallback: BoilerClasses Scraper
- **GitHub**: https://github.com/unkn-wn/boilerclasses
- **Type**: Python + Selenium scraper → Redis
- **Notes**: Use if Purdue.io is missing Fall 2026 data; scrape catalog directly

---

## Scope Split
- **Backend branch**: Next.js scaffold, API routes (`/app/api/`), Purdue.io typed client, data types, conflict detection logic
- **Frontend (your session)**: UI components, Tailwind styling, shadcn/ui, ScheduleGrid, page layout

---

## Recommended Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | API routes + frontend in one repo |
| Styling | Tailwind CSS + shadcn/ui | Fast prototyping, clean UI |
| State | Zustand | Simple client-side schedule state |
| API calls | SWR | Caching + revalidation |
| Backend | Next.js API routes (`/app/api/`) | Proxy Purdue.io, add caching layer |
| Hosting | Vercel | Free tier, auto-deploys from GitHub |

---

## Core Features (MVP)

1. **Course Search** — search by subject, course number, keyword, instructor
2. **Section Browser** — list all sections with time, location, seats available, CRN
3. **Visual Schedule Builder** — weekly calendar grid, auto-detects conflicts
4. **Conflict Detection** — highlight overlapping time slots in real time
5. **Save & Share** — save schedule to URL (encoded) or localStorage

## Phase 2 Features

- Rate My Professor integration (unofficial API exists)
- GPA distribution overlay
- Export to `.ics` (Google Calendar / iCal)
- Prerequisite checker
- AI scheduling assistant via Claude API

---

## Backend API Routes (`/app/api/`)

| Route | Description |
|-------|-------------|
| `GET /api/semesters` | List available semesters — use to find Fall 2026 ID |
| `GET /api/courses?q=cs180&semester=<id>` | Search courses by keyword/subject |
| `GET /api/courses/[id]/sections?semester=<id>` | All sections + meeting times for a course |

All routes cache with `next: { revalidate: 3600 }` (1 hour).

---

## Data Model (from Purdue.io)

```
Semester
  └── Subject (e.g. "CS")
        └── Course (e.g. "CS 18200 - Foundations of CS")
              └── Class (section group)
                    └── Section (CRN, enrollment, type)
                          └── Meeting (days, startTime, endTime, room)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `types/purdue.ts` | Shared TypeScript interfaces — import these in frontend too |
| `lib/purdue.ts` | Typed Purdue.io OData API client |
| `lib/conflicts.ts` | `hasConflict(a, b)` and `findConflicts(sections[])` pure functions |
| `app/api/semesters/route.ts` | Semesters endpoint |
| `app/api/courses/route.ts` | Course search endpoint |
| `app/api/courses/[id]/sections/route.ts` | Sections endpoint |
| `app/page.tsx` | Main page (placeholder — frontend session fills this in) |
| `components/ScheduleGrid.tsx` | Weekly calendar grid (frontend session) |
| `store/scheduleStore.ts` | Zustand store (frontend session) |

---

## Frontend Notes (for your session)

- Import types from `@/types/purdue` — all Purdue data shapes are defined there
- Use `hasConflict` / `findConflicts` from `@/lib/conflicts` for conflict detection
- Fetch data via the API routes above (not Purdue.io directly)
- Suggested component breakdown:
  - `SearchBar` — debounced input, calls `/api/courses`
  - `CourseCard` — shows course + expandable section list
  - `SectionRow` — shows CRN, time, instructor, seats, add button
  - `ScheduleGrid` — 7-col (M-Su) × time rows (7am–10pm) calendar
  - `ConflictAlert` — banner/badge when sections overlap
- State: Zustand store (`store/scheduleStore.ts`) with `addSection`, `removeSection`, `selectedSections[]`
- Persist to `localStorage` so schedule survives page refresh

---

## Verification
1. `npm run dev` → search "CS 18200" → sections load with correct times
2. Add two overlapping sections → red conflict indicator appears
3. Refresh page → schedule persists from localStorage
4. Test responsive layout on mobile viewport

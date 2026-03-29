// Typed client for the Purdue.io OData API
// Real schema discovered from https://api.purdue.io/odata/$metadata
//
// Data model: Term → Class (CourseId + TermId) → Section → Meeting (has DaysOfWeek bitmask + Instructors)
//             Course → Classes → Sections
//             Meeting has DaysOfWeek (bitmask flags enum), StartTime, Duration (ISO 8601)

import type { ApiSemester, ApiCourse, ApiSection, ApiMeeting } from '@/types/purdue'

const BASE_URL = 'https://api.purdue.io/odata'

// DaysOfWeek bitmask values from the API schema
const DAY_FLAGS: { bit: number; code: ApiMeeting['days'][number] }[] = [
  { bit: 1, code: 'M' },
  { bit: 2, code: 'T' },
  { bit: 4, code: 'W' },
  { bit: 8, code: 'R' },
  { bit: 16, code: 'F' },
  { bit: 32, code: 'Sa' },
  { bit: 64, code: 'Su' },
]

async function odata<T>(path: string, params?: Record<string, string>): Promise<T[]> {
  // Build query string manually — URLSearchParams encodes $ in OData param names
  let urlStr = `${BASE_URL}/${path}`
  if (params) {
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&')
    urlStr += `?${qs}`
  }

  const res = await fetch(urlStr, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`Purdue.io error: ${res.status} ${res.statusText} — ${urlStr}`)
  }

  const json = await res.json()
  return json.value as T[]
}

// --- Terms (semesters) ---

export async function getSemesters(): Promise<ApiSemester[]> {
  const raw = await odata<{ Id: string; Code: string; Name: string }>('Terms', {
    $orderby: 'Code desc',
  })
  // Filter out the sentinel "The End of Time" entry (Code: 999999)
  return raw
    .filter((t) => t.Code !== '999999')
    .map((t) => ({ id: t.Id, code: t.Code, name: t.Name }))
}

// --- Course search ---

export async function searchCourses(query: string, termId: string): Promise<ApiCourse[]> {
  const q = query.trim().toUpperCase()

  // Filter courses that have at least one Class in the given Term,
  // AND match the query against subject abbreviation, title, or number
  const filter = [
    `Classes/any(c: c/TermId eq ${termId})`,
    `(contains(Subject/Abbreviation, '${q}') or contains(Title, '${q}') or contains(Number, '${q}'))`,
  ].join(' and ')

  const raw = await odata<any>('Courses', {
    $filter: filter,
    $expand: 'Subject',
    $orderby: 'Subject/Abbreviation,Number',
  })

  return raw.map(normalizeCourse)
}

// --- Sections for a course in a term ---

export async function getSections(courseId: string, termId: string): Promise<ApiSection[]> {
  // Classes bridge Course ↔ Term. Each Class has Sections with Meetings.
  const classes = await odata<any>('Classes', {
    $filter: `CourseId eq ${courseId} and TermId eq ${termId}`,
    $expand: 'Sections($expand=Meetings($expand=Instructors))',
  })

  // Flatten all sections from all classes for this course+term
  const sections: ApiSection[] = []
  for (const cls of classes) {
    for (const sec of cls.Sections ?? []) {
      sections.push(normalizeSection(sec))
    }
  }
  return sections
}

// --- Normalization helpers ---

function normalizeCourse(c: any): ApiCourse {
  return {
    id: c.Id,
    number: c.Number ?? '',
    title: c.Title ?? '',
    description: c.Description ?? '',
    creditHours: c.CreditHours ?? 0,
    subject: c.Subject?.Abbreviation ?? '',
    subjectName: c.Subject?.Name ?? '',
  }
}

function normalizeSection(s: any): ApiSection {
  return {
    id: s.Id,
    crn: s.Crn ?? '',
    type: s.Type ?? 'Lecture',
    instructors: [],           // collected from meetings below
    meetings: (s.Meetings ?? []).map(normalizeMeeting),
  }
}

function normalizeMeeting(m: any): ApiMeeting {
  return {
    id: m.Id,
    type: m.Type ?? '',
    startTime: m.StartTime ?? null,
    endTime: computeEndTime(m.StartTime, m.Duration),
    days: parseDaysOfWeek(m.DaysOfWeek),
    room: m.RoomId ?? null,
    instructors: (m.Instructors ?? []).map((i: any) => i.Name as string).filter(Boolean),
  }
}

// Parse DaysOfWeek — API returns either a bitmask integer or a comma-separated string like "Monday, Wednesday"
function parseDaysOfWeek(value: unknown): ApiMeeting['days'] {
  if (value == null || value === 'None') return []

  // Numeric bitmask
  if (typeof value === 'number') {
    return DAY_FLAGS.filter((d) => value & d.bit).map((d) => d.code)
  }

  // String form: "Monday, Wednesday, Friday"
  if (typeof value === 'string') {
    const nameToCode: Record<string, ApiMeeting['days'][number]> = {
      Monday: 'M', Tuesday: 'T', Wednesday: 'W', Thursday: 'R',
      Friday: 'F', Saturday: 'Sa', Sunday: 'Su',
    }
    return value
      .split(',')
      .map((s) => nameToCode[s.trim()])
      .filter((d): d is ApiMeeting['days'][number] => Boolean(d))
  }

  return []
}

// Compute end time from ISO 8601 StartTime and Duration
// StartTime: "HH:MM:SS", Duration: "PT1H20M" or "PT50M" or "PT0S"
function computeEndTime(startTime: string | null, duration: string | null): string | null {
  if (!startTime || !duration || duration === 'PT0S') return null

  const [h, m, s] = startTime.split(':').map(Number)
  const startMinutes = h * 60 + m + (s ?? 0) / 60

  // Parse ISO 8601 duration: PT#H#M#S
  const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!durationMatch) return null

  const dHours = parseInt(durationMatch[1] ?? '0', 10)
  const dMinutes = parseInt(durationMatch[2] ?? '0', 10)
  const dSeconds = parseInt(durationMatch[3] ?? '0', 10)
  const totalDurationMinutes = dHours * 60 + dMinutes + dSeconds / 60

  const endMinutes = startMinutes + totalDurationMinutes
  const endH = Math.floor(endMinutes / 60)
  const endM = Math.round(endMinutes % 60)

  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`
}

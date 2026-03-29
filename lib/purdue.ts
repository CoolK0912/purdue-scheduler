// Typed client for the Purdue.io OData API
// Docs: https://github.com/Purdue-io/PurdueApi/wiki/OData-Queries

import type {
  Semester,
  Course,
  Section,
  ApiSemester,
  ApiCourse,
  ApiSection,
  ApiMeeting,
} from '@/types/purdue'

const BASE_URL = 'https://api.purdue.io/odata'

async function odata<T>(path: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL(`${BASE_URL}/${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(`Purdue.io error: ${res.status} ${res.statusText} — ${url}`)
  }

  const json = await res.json()
  return json.value as T[]
}

// --- Semesters ---

export async function getSemesters(): Promise<ApiSemester[]> {
  const raw = await odata<Semester>('Semesters', {
    $orderby: 'Code desc',
    $top: '20',
  })
  return raw.map((s) => ({
    id: s.SemesterId,
    code: s.Code,
    name: s.Name,
  }))
}

// --- Course search ---

export async function searchCourses(
  query: string,
  semesterId: string
): Promise<ApiCourse[]> {
  const q = query.trim().toUpperCase()

  // Match subject abbreviation (e.g. "CS") or title keyword
  const filter = [
    `Classes/any(c: c/Sections/any(s: s/SemesterId eq '${semesterId}'))`,
    `(contains(Subject/Abbreviation, '${q}') or contains(Title, '${q}') or contains(Number, '${q}'))`,
  ].join(' and ')

  const raw = await odata<Course & { Subject: { Abbreviation: string; Name: string } }>('Courses', {
    $filter: filter,
    $expand: 'Subject',
    $top: '50',
    $orderby: 'Subject/Abbreviation,Number',
  })

  return raw.map(normalizeCourse)
}

// --- Sections for a course ---

export async function getSections(
  courseId: string,
  semesterId: string
): Promise<ApiSection[]> {
  const raw = await odata<Section & { Meetings: any[]; Instructors: any[] }>(
    `Courses('${courseId}')/Classes/Sections`,
    {
      $filter: `SemesterId eq '${semesterId}'`,
      $expand: 'Meetings,Instructors',
    }
  )

  return raw.map(normalizeSection)
}

// --- Normalization helpers ---

function normalizeCourse(c: any): ApiCourse {
  return {
    id: c.CourseId,
    number: c.Number,
    title: c.Title,
    description: c.Description ?? '',
    creditHours: c.CreditHours ?? 0,
    subject: c.Subject?.Abbreviation ?? '',
    subjectName: c.Subject?.Name ?? '',
  }
}

function normalizeSection(s: any): ApiSection {
  return {
    id: s.SectionId,
    crn: s.Crn,
    type: s.Type ?? 'Lecture',
    enrolled: s.EnrollmentCount ?? 0,
    enrollMax: s.EnrollmentMax ?? 0,
    waitlist: s.WaitlistCount ?? 0,
    open: (s.EnrollmentCount ?? 0) < (s.EnrollmentMax ?? 0),
    instructors: (s.Instructors ?? []).map((i: any) => i.Name).filter(Boolean),
    meetings: (s.Meetings ?? []).map(normalizeMeeting),
  }
}

function normalizeMeeting(m: any): ApiMeeting {
  const days: ApiMeeting['days'] = []
  if (m.Monday) days.push('M')
  if (m.Tuesday) days.push('T')
  if (m.Wednesday) days.push('W')
  if (m.Thursday) days.push('R')
  if (m.Friday) days.push('F')
  if (m.Saturday) days.push('Sa')
  if (m.Sunday) days.push('Su')

  return {
    id: m.MeetingId,
    type: m.Type ?? '',
    startTime: m.StartTime ?? null,
    endTime: m.EndTime ?? null,
    days,
    room: m.RoomId ?? null,
  }
}

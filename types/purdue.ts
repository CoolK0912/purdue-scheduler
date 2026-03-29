// Purdue.io OData API — shared TypeScript interfaces
// Real schema: https://api.purdue.io/odata/$metadata
//
// Data model: Term → Class (CourseId + TermId) → Section → Meeting
//             Course → Classes → Sections

// ---- Raw API types (as returned by Purdue.io) ----

export interface RawTerm {
  Id: string
  Code: string       // e.g. "202710" for Fall 2026
  Name: string       // e.g. "Fall 2026"
  StartDate: string | null
  EndDate: string | null
}

export interface RawSubject {
  Id: string
  Abbreviation: string  // e.g. "CS"
  Name: string          // e.g. "Computer Science"
}

export interface RawCourse {
  Id: string
  Number: string        // e.g. "18200"
  Title: string
  Description: string | null
  CreditHours: number
  SubjectId: string
  Subject?: RawSubject
  Classes?: RawClass[]
}

export interface RawClass {
  Id: string
  CourseId: string
  TermId: string
  CampusId: string
  Sections?: RawSection[]
}

export interface RawSection {
  Id: string
  Crn: string
  ClassId: string
  Type: string | null
  StartDate: string | null
  EndDate: string | null
  Meetings?: RawMeeting[]
}

export interface RawInstructor {
  Id: string
  Name: string
  Email: string | null
}

export interface RawMeeting {
  Id: string
  SectionId: string
  Type: string | null
  StartDate: string | null
  EndDate: string | null
  // DaysOfWeek: flags enum — can come back as number or "Monday, Wednesday" string
  DaysOfWeek: number | string | null
  StartTime: string | null    // "HH:MM:SS"
  Duration: string | null     // ISO 8601 duration e.g. "PT50M", "PT1H20M"
  RoomId: string | null
  Instructors?: RawInstructor[]
}

// ---- Normalized API shapes (returned by our /app/api/ routes) ----

export interface ApiSemester {
  id: string
  code: string
  name: string
}

export interface ApiCourse {
  id: string
  number: string
  title: string
  description: string
  creditHours: number
  subject: string       // abbreviation, e.g. "CS"
  subjectName: string
}

export interface ApiMeeting {
  id: string
  type: string
  startTime: string | null    // "HH:MM:SS"
  endTime: string | null      // computed from startTime + duration
  days: ('M' | 'T' | 'W' | 'R' | 'F' | 'Sa' | 'Su')[]
  room: string | null         // RoomId (GUID) — frontend can ignore or display
  instructors: string[]       // instructor names (from Meeting, not Section)
}

export interface ApiSection {
  id: string
  crn: string
  type: string
  instructors: string[]   // aggregated from meetings (may repeat across meetings)
  meetings: ApiMeeting[]
  // Note: Purdue.io does not expose enrollment counts — omitted intentionally
}

export interface ApiCourseWithSections extends ApiCourse {
  sections: ApiSection[]
}

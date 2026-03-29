// Purdue.io OData API — shared TypeScript interfaces
// Data model: Semester → Subject → Course → Class → Section → Meeting

export interface Semester {
  SemesterId: string
  Code: string       // e.g. "202510" for Spring 2025, "202580" for Fall 2025
  Name: string       // e.g. "Fall 2026"
}

export interface Subject {
  SubjectId: string
  Abbreviation: string  // e.g. "CS"
  Name: string          // e.g. "Computer Science"
}

export interface Course {
  CourseId: string
  Number: string        // e.g. "18200"
  Title: string         // e.g. "Foundations of Computer Science"
  Description: string
  CreditHours: number
  Subject: Subject
}

export interface Instructor {
  InstructorId: string
  Name: string
  Email: string | null
}

export interface Meeting {
  MeetingId: string
  Type: string           // e.g. "Lecture", "Lab", "Recitation"
  StartTime: string | null  // ISO time string, e.g. "10:30:00"
  EndTime: string | null    // ISO time string, e.g. "11:20:00"
  Monday: boolean
  Tuesday: boolean
  Wednesday: boolean
  Thursday: boolean
  Friday: boolean
  Saturday: boolean
  Sunday: boolean
  RoomId: string | null
}

export interface Section {
  SectionId: string
  Crn: string
  Type: string           // e.g. "Lecture", "Lab"
  RegistrationStatus: string
  EnrollmentCount: number
  EnrollmentMax: number
  WaitlistCount: number
  Meetings: Meeting[]
  Instructors: Instructor[]
}

export interface CourseWithSections extends Course {
  Sections: Section[]
}

// Normalized shape returned by our API routes (frontend-friendly)
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
  startTime: string | null
  endTime: string | null
  days: ('M' | 'T' | 'W' | 'R' | 'F' | 'Sa' | 'Su')[]
  room: string | null
}

export interface ApiSection {
  id: string
  crn: string
  type: string
  enrolled: number
  enrollMax: number
  waitlist: number
  open: boolean
  instructors: string[]
  meetings: ApiMeeting[]
}

export interface ApiCourseWithSections extends ApiCourse {
  sections: ApiSection[]
}

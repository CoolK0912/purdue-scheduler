import { NextRequest, NextResponse } from 'next/server'
import { searchCourses } from '@/lib/purdue'

// GET /api/courses?q=cs180&semester=<semesterId>
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')?.trim()
  const semester = searchParams.get('semester')?.trim()

  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
  }
  if (!semester) {
    return NextResponse.json({ error: 'Missing query parameter: semester' }, { status: 400 })
  }
  if (q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
  }

  try {
    const courses = await searchCourses(q, semester)
    return NextResponse.json(courses)
  } catch (err) {
    console.error('[/api/courses]', err)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 502 })
  }
}

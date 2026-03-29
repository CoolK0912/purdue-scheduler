import { NextRequest, NextResponse } from 'next/server'
import { getSections } from '@/lib/purdue'

// GET /api/courses/[id]/sections?semester=<semesterId>
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = req.nextUrl
  const semester = searchParams.get('semester')?.trim()
  const { id: courseId } = await params

  if (!semester) {
    return NextResponse.json({ error: 'Missing query parameter: semester' }, { status: 400 })
  }

  try {
    const sections = await getSections(courseId, semester)
    return NextResponse.json(sections)
  } catch (err) {
    console.error(`[/api/courses/${courseId}/sections]`, err)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 502 })
  }
}

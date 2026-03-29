import { NextResponse } from 'next/server'
import { getSemesters } from '@/lib/purdue'

export async function GET() {
  try {
    const semesters = await getSemesters()
    return NextResponse.json(semesters)
  } catch (err) {
    console.error('[/api/semesters]', err)
    return NextResponse.json({ error: 'Failed to fetch semesters' }, { status: 502 })
  }
}

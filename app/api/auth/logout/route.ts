import { NextResponse } from 'next/server'
import { getAuthCookieOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set({
    ...getAuthCookieOptions(),
    name: 'auth-token',
    value: '',
    maxAge: 0,
  })

  return response
}

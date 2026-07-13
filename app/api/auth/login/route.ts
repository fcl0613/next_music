import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, getAuthCookieOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    const token = await signToken({
      id: Number(user.id),
      username: user.username,
    })

    const response = NextResponse.json({
      id: Number(user.id),
      username: user.username,
    })

    response.cookies.set({
      ...getAuthCookieOptions(),
      value: token,
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}

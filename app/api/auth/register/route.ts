import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 })
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: '用户名长度需在 3-20 个字符之间' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少为 6 个字符' }, { status: 400 })
    }

    // 检查用户名是否已存在
    const existing = await prisma.user.findUnique({
      where: { username },
    })

    if (existing) {
      return NextResponse.json({ error: '用户名已被占用' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
      },
    })

    return NextResponse.json({
      id: Number(user.id),
      username: user.username,
    })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAuthFromCookies } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // 验证用户登录状态
    const auth = await getAuthFromCookies()
    if (!auth) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const { oldPassword, newPassword } = await request.json()

    // 参数校验
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: '请填写所有字段' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: '新密码长度至少为 6 个字符' }, { status: 400 })
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: '原密码错误' }, { status: 401 })
    }

    // 更新密码
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: auth.id },
      data: { password: hashed },
    })

    return NextResponse.json({ message: '密码修改成功' })
  } catch (err) {
    console.error('Change password error:', err)
    return NextResponse.json({ error: '服务器错误，请稍后重试' }, { status: 500 })
  }
}

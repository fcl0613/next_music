import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'next-music-secret-key-change-in-production'
)

// 不需要登录的路径
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/audio', // 音频流可以公开访问
]

// 检查路径是否公开
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路径直接放行
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // 获取 token
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // API 请求返回 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }
    // 页面跳转到登录
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 验证 token
  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    // token 无效或过期
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
    }
    // 清除无效 cookie 并跳转登录
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - _next/static (静态文件)
     * - _next/image (图片)
     * - favicon.ico (图标)
     * - public 文件夹下的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}

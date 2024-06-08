import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const privatePaths = ['/manage']
const unAuthPaths = ['/login']

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // pathname: /manage/dashboard
  // const cookieStore = cookies()
  const isAuth = Boolean(request.cookies.get('accessToken')?.value)
  // const refreshToken = cookieStore.get('refreshToken')?.value
  // Chưa đăng nhập thì không cho vào private paths
  if (privatePaths.some((path) => pathname.startsWith(path)) && !isAuth) {
    const url = new URL('/logout', request.url)
    url.searchParams.set('refreshToken', request.cookies.get('refreshToken')?.value ?? '')
    return NextResponse.redirect(url)
  }
  // Đăng nhập rồi thì sẽ không cho vào login nữa
  if (unAuthPaths.some((path) => pathname.startsWith(path)) && isAuth) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
// middleware này sẽ áp dụng cho những path đươc khai báo bên dưới
export const config = {
  matcher: ['/manage/:path*', '/login']
}

import { removeTokensFromLocalStorage } from '@/lib/utils'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const privatePaths = ['/manage']
const unAuthPaths = ['/login']

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Url người dùng vừa mới enter vào cái trình duyệt
  const { pathname } = request.nextUrl
  // pathname: /manage/dashboard
  // const cookieStore = cookies()
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  // const refreshToken = cookieStore.get('refreshToken')?.value

  // Chưa đăng nhập thì không cho vào private paths
  // Chỗ này chúng ta chưa xử lý accessToken nên là không để AT vào đây được, vì mà để vào đây thì nó giống như trường hợp là đang dùng mà hét hạn AT
  // Ở đây phải check là ko có RT mới là chưa đăng nhập vì khi mà để AT thì khi mà AT nó hết hạn mà nó đá ng dùng về login thì không đúng lắm vì chúng ta chưa làm gia hạn AT
  // Và cái case cũng đúng cho trường hợp là khi mà RT hết hạn thì bắt buộc người dùng phải đăng nhập lại
  if (privatePaths.some((path) => pathname.startsWith(path)) && !refreshToken) {
    const url = new URL('/login', request.url)
    url.searchParams.set('clearTokens', 'true')
    // const clearTokens = removeTokensFromLocalStorage()
    return NextResponse.redirect(url)
  }

  // Đăng nhập rồi thì sẽ không cho vào login nữa
  if (unAuthPaths.some((path) => pathname.startsWith(path)) && refreshToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Trường hợp đăng nhập rồi, nhưng accessToken lại hết hạn và cũng có thể là refreshToken
  // Do chưa xử lý refreshToken nên khi mà AT hết hạn và còn RT thì cho người dùng logout
  if (privatePaths.some((path) => pathname.startsWith(path)) && !accessToken && refreshToken) {
    const url = new URL('/refresh-token', request.url)
    url.searchParams.set('refreshToken', refreshToken)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
// middleware này sẽ áp dụng cho những path đươc khai báo bên dưới
export const config = {
  matcher: ['/manage/:path*', '/login']
}

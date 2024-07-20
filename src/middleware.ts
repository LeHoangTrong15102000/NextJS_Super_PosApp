import { decodeToken, removeTokensFromLocalStorage } from '@/lib/utils'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Role } from './constants/type'

const managePaths = ['/manage']
const guestPaths = ['/guest']
const privatePaths = [...managePaths, ...guestPaths]
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

  // 1.  Chưa đăng nhập thì không cho vào private paths
  if (privatePaths.some((path) => pathname.startsWith(path)) && !refreshToken) {
    const url = new URL('/login', request.url)
    url.searchParams.set('clearTokens', 'true')
    // const clearTokens = removeTokensFromLocalStorage()
    return NextResponse.redirect(url)
  }

  // 2. Trương hợp đã đăng nhập rồi
  if (refreshToken) {
    // 2.1 Nếu có tình vào trang login sẽ bị redirect về trang chủ
    if (unAuthPaths.some((path) => pathname.startsWith(path)) && refreshToken) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Trường hợp đăng nhập rồi, nhưng accessToken lại hết hạn và cũng có thể là refreshToken
    // Do chưa xử lý refreshToken nên khi mà AT hết hạn và còn RT thì cho người dùng logout
    // 2.2 Nhưng accessToken lại hết hạn
    if (privatePaths.some((path) => pathname.startsWith(path)) && !accessToken && refreshToken) {
      // Tạo ra url refresh-token
      const url = new URL('/refresh-token', request.url)
      url.searchParams.set('refreshToken', refreshToken)
      // Cần gửi cái pathname để mà sau khi mà nó refreshToken thì sẽ quay lại cái pathname hồi nảy
      url.searchParams.set('redirect', pathname)
      console.log('check đường dẫn url')
      return NextResponse.redirect(url)
    }

    // 2.3 Vào không đúng role thì redirect về trang chủ
    const role = decodeToken(refreshToken).role
    // guest nhưng mà cố vào trang manage của owner
    const isGuestGoToManagePath = role === Role.Guest && managePaths.some((path) => pathname.startsWith(path))
    // owner nhưng mà cố vào trang của guest
    const isNotGuestGoToGuestPath = role !== Role.Guest && guestPaths.some((path) => pathname.startsWith(path))
    if (isGuestGoToManagePath || isNotGuestGoToGuestPath) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
  }
}

// See "Matching Paths" below to learn more
// middleware này sẽ áp dụng cho những path đươc khai báo bên dưới
export const config = {
  matcher: ['/manage/:path*', '/guest/:path*', '/login']
}

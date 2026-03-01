import guestApiRequest from '@/apiRequests/guest'
import { cookies } from 'next/headers'
import { clearAuthCookies } from '@/lib/cookie-utils'
import { createApiResponse } from '@/lib/api-helpers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const refreshToken = cookieStore.get('refreshToken')?.value
  await clearAuthCookies()
  if (!accessToken || !refreshToken) {
    return createApiResponse(
      { message: 'Không nhận được access token hoặc refresh token' },
      200
    )
  }
  try {
    const result = await guestApiRequest.sLogout({
      accessToken,
      refreshToken
    })
    return Response.json(result.payload)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Guest logout error:', error)
    }
    return createApiResponse(
      { message: 'Lỗi khi gọi API đến server backend' },
      500
    )
  }
}

import authApiRequest from '@/apiRequests/auth'
import { cookies } from 'next/headers'
import { setAuthCookies } from '@/lib/cookie-utils'
import { createApiResponse } from '@/lib/api-helpers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value
  if (!refreshToken) {
    return createApiResponse({ message: 'Không tìm thấy refreshToken' }, 401)
  }
  try {
    const { payload } = await authApiRequest.sRefreshToken({ refreshToken })
    await setAuthCookies(payload.data.accessToken, payload.data.refreshToken)
    return Response.json(payload)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Refresh token error:', error)
    }
    const message = error instanceof Error ? error.message : 'Có lỗi xảy ra'
    return createApiResponse({ message }, 401)
  }
}

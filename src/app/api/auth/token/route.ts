import { setAuthCookies } from '@/lib/cookie-utils'
import { HttpError } from '@/lib/http'
import { createApiResponse } from '@/lib/api-helpers'

export async function POST(request: Request) {
  const body = (await request.json()) as {
    accessToken: string
    refreshToken: string
  }
  const { accessToken, refreshToken } = body
  try {
    await setAuthCookies(accessToken, refreshToken)
    return Response.json(body)
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return createApiResponse(error.payload, error.status)
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('Token set error:', error)
    }
    return createApiResponse({ message: 'Có lỗi xảy ra' }, 500)
  }
}

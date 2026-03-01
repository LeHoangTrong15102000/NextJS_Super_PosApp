import authApiRequest from '@/apiRequests/auth'
import { LoginBody, LoginBodyType } from '@/schemaValidations/auth.schema'
import { setAuthCookies } from '@/lib/cookie-utils'
import { HttpError } from '@/lib/http'
import { createApiResponse, validateRequestBody } from '@/lib/api-helpers'

export async function POST(request: Request) {
  const validation = await validateRequestBody<LoginBodyType>(request, LoginBody)
  if (validation.error) return validation.error
  try {
    const { payload } = await authApiRequest.sLogin(validation.data)
    const { accessToken, refreshToken } = payload.data
    await setAuthCookies(accessToken, refreshToken)
    return Response.json(payload)
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return createApiResponse(error.payload, error.status)
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', error)
    }
    return createApiResponse({ message: 'Có lỗi xảy ra' }, 500)
  }
}

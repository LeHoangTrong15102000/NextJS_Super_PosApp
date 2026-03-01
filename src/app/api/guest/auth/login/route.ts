import { HttpError } from '@/lib/http'
import { GuestLoginBody, GuestLoginBodyType } from '@/schemaValidations/guest.schema'
import guestApiRequest from '@/apiRequests/guest'
import { setAuthCookies } from '@/lib/cookie-utils'
import { createApiResponse, validateRequestBody } from '@/lib/api-helpers'

export async function POST(request: Request) {
  const validation = await validateRequestBody<GuestLoginBodyType>(request, GuestLoginBody)
  if (validation.error) return validation.error
  try {
    const { payload } = await guestApiRequest.sLogin(validation.data)
    const { accessToken, refreshToken } = payload.data
    await setAuthCookies(accessToken, refreshToken)
    return Response.json(payload)
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      return createApiResponse(error.payload, error.status)
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('Guest login error:', error)
    }
    return createApiResponse({ message: 'Có lỗi xảy ra' }, 500)
  }
}

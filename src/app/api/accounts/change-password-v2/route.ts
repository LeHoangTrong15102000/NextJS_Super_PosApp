import { cookies } from 'next/headers'
import { ChangePasswordV2Body, ChangePasswordV2BodyType } from '@/schemaValidations/account.schema'
import accountApiRequest from '@/apiRequests/account'
import { setAuthCookies } from '@/lib/cookie-utils'
import { createApiResponse, validateRequestBody } from '@/lib/api-helpers'

export async function PUT(request: Request) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  if (!accessToken) {
    return createApiResponse({ message: 'Không tìm thấy accessToken' }, 401)
  }
  const validation = await validateRequestBody<ChangePasswordV2BodyType>(request, ChangePasswordV2Body)
  if (validation.error) return validation.error
  try {
    const { payload } = await accountApiRequest.sChangePasswordV2(accessToken, validation.data)
    await setAuthCookies(payload.data.accessToken, payload.data.refreshToken)
    return Response.json(payload)
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Change password error:', error)
    }
    const message = error instanceof Error ? error.message : 'Có lỗi xảy ra'
    const status = (error as { status?: number }).status ?? 500
    return createApiResponse({ message }, status)
  }
}

import authApiRequest from '@/apiRequests/auth'
import { LoginBodyType } from '@/schemaValidations/auth.schema'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { HttpError } from '@/lib/http'

export async function POST(request: Request) {
  // res chính là cái body mà người dùng gửi lên và trả về dữ liệu dược định dạng
  // Tại vì người dùng gửi lên body ở dạng là `string`
  const body = (await request.json()) as LoginBodyType
  const cookieStore = cookies()
  try {
    // Từ serverNext gửi req lên serverBE
    const { payload } = await authApiRequest.sLogin(body)
    const { accessToken, refreshToken } = payload.data
    const decodedAccessToken = jwt.decode(accessToken) as { exp: number }
    const decodedRefreshToken = jwt.decode(refreshToken) as { exp: number }
    // set cookies cho client.com
    cookieStore.set('accessToken', accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedAccessToken.exp * 1000
    })
    cookieStore.set('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedRefreshToken.exp * 1000
    })

    // API từ serverBE trả về cho chúng ta cái gì thì routeHandler chúng ta trả về cho người dùng cái đấy luôn
    return Response.json(payload)
  } catch (error) {
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status
      })
    } else {
      return Response.json(
        {
          message: 'Có lỗi xảy ra!'
        },
        {
          status: 500
        }
      )
    }
  }
}

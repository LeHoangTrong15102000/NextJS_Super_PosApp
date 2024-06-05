import authApiRequest from '@/apiRequests/auth'
import { LoginBodyType } from '@/schemaValidations/auth.schema'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  // res chính là cái body mà người dùng gửi lên và trả về dữ liệu dược định dạng
  // Tại vì người dùng gửi lên body ở dạng là `string`
  console.log({ request })
  const body = (await request.json()) as LoginBodyType
  console.log('Check res', { body })
  const cookieStore = cookies()
  try {
    // Từ serverNext gửi req lên serverBE
    const { payload } = await authApiRequest.sLogin(body)
    const {
      data: { accessToken, refreshToken }
    } = payload
    // Chúng ta cần lấy mỗi thằng exp mà thôi
    const decodedAccessToken = jwt.decode(accessToken) as { exp: number }
    const decodedRefreshToken = jwt.decode(refreshToken) as { exp: number }
    // set cookies  cho client.com
    cookieStore.set('accessToken', accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedAccessToken.exp * 1000
    })

    return Response.json(payload)
  } catch (error) {}
}

import authApiRequest from '@/apiRequests/auth'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value
  // Khi mà gọi refreshToken mà bị lỗi thì chúng ta sẽ trả về lỗi là 401 để cho người dùng logout ra
  if (!refreshToken) {
    //
    return Response.json(
      {
        message: 'Không tìm thấy refreshToken'
      },
      {
        status: 401
      }
    )
  }
  try {
    const { payload } = await authApiRequest.sRefreshToken({ refreshToken })

    const decodedAccessToken = jwt.decode(payload.data.accessToken) as {
      exp: number
    }
    const decodedRefreshToken = jwt.decode(payload.data.refreshToken) as {
      exp: number
    }

    // console.log('Checkk time refreshToken', decodedRefreshToken.exp)

    // Gia hạn accessToken
    cookieStore.set('accessToken', payload.data.accessToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedAccessToken.exp * 1000
    })

    cookieStore.set('refreshToken', payload.data.refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: decodedRefreshToken.exp * 1000
    })

    return Response.json(payload)
  } catch (error: any) {
    // Nếu có cái vấn đề gì đó trong lúc gọi refreshToken thì cũng trả về lỗi 401 luôn
    console.log('Checkk error refreshToken', error)
    return Response.json(
      {
        message: error.message ?? 'Có lỗi xảy ra'
      },
      {
        status: 401
      }
    )
  }
}

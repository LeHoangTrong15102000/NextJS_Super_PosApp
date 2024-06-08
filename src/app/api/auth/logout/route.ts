// API Logout handler
// Đã lấy ra được như ở bên dưới rồi thì cũng chả cần tới cookies nữa
import authApiRequest from '@/apiRequests/auth'
import { LoginBodyType } from '@/schemaValidations/auth.schema'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { HttpError } from '@/lib/http'

export async function POST(request: Request) {
  // res chính là cái body mà người dùng gửi lên và trả về dữ liệu dược định dạng
  // Tại vì người dùng gửi lên body ở dạng là `string`
  const cookieStore = cookies()
  const accessToken = cookieStore.get('accessToken')?.value
  const refreshToken = cookieStore.get('refreshToken')?.value
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
  // Nếu không có AT và  RT trong cái cookie
  // Mặc dù là ngta có logout kiểu gì thì chúng ta vẫn cho là thành công mà thôi, mặc dù là không gửi lên AT và RT
  if (!accessToken || !refreshToken) {
    // Mặc dù là không nhận được AT và RT thì vẫn cho cái status là 200
    return Response.json(
      {
        // message: 'Không nhận được accessToken và refreshToken'
        message: 'Bắt buộc logout thành công!'
      },
      {
        status: 200
      }
    )
  }
  try {
    // Từ serverNext gửi req lên serverBE
    const result = await authApiRequest.sLogout({
      accessToken,
      refreshToken
    })
    // API từ serverBE trả về cho chúng ta cái gì thì routeHandler chúng ta trả về cho người dùng cái đấy luôn
    return Response.json(result.payload)
  } catch (error) {
    // Lỗi thì chúng ta cũng sẽ return về 200 cho người ta luôn
    return Response.json(
      {
        message: 'Có lỗi khi gọi API đến server Backend'
      },
      {
        status: 500
      }
    )
  }
}

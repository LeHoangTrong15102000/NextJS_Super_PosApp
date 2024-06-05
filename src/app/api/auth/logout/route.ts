// API Logout handler
// Đã lấy ra được như ở bên dưới rồi thì cũng chả cần tới cookies nữa
import { cookies } from 'next/headers'
import authApiRequest from '@/apiRequests/auth'
import { HttpError } from '@/lib/http'

export async function POST(request: Request) {
  const res = await request.json()
  const force = res.force as boolean | undefined
  if (force) {
    return Response.json(
      {
        message: 'Buộc đăng xuất thành công'
      },
      {
        status: 200,
        headers: {
          // Gửi request API từ next-client lên phía next-server
          //  Xóa cookie sessionToken
          'Set-Cookie': `sessionToken=; Path=/; HttpOnly; Max-Age=0`
        }
      }
    )
  }
  const cookieStore = cookies()
  const sessionToken = cookieStore.get('sessionToken')
  if (!sessionToken) {
    return Response.json(
      { message: 'Không nhận được session token' },
      {
        status: 401
      }
    )
  }

  // Try-catch để mà gọi đến server-BE của chúng ta
  try {
    // result.payload nó trả về unknown thì nó có hay cho lắm
    // Gửi request từ `next-server` lên `server-BE`
    const result = await authApiRequest.logoutFromNextServerToServer(sessionToken.value)
    return Response.json(result.payload, {
      status: 200,
      headers: {
        // Gửi request API từ next-client lên phía next-server
        //  Xóa cookie sessionToken
        'Set-Cookie': `sessionToken=; Path=/; HttpOnly; Max-Age=0`
      }
    })
  } catch (error) {
    // RouteHandler ở next-server này như là một cái proxy và khi có lỗi thì nó sẽ chạy vào trong đây và trả lỗi về cho thằng `client`
    // Nếu mà client nhận được status lỗi là 401 thì nó sẽ thực hiện việc logout người dùng
    // Chỉ cần xử lý logic throw lỗi chuẩn như thế này là được
    if (error instanceof HttpError) {
      return Response.json(error.payload, {
        status: error.status
      })
    } else {
      return Response.json(
        {
          message: 'Lỗi không xác định'
        },
        {
          status: 500
        }
      )
    }
  }
}

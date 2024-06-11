'use client'

import {
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage
} from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import jwt from 'jsonwebtoken'
import authApiRequest from '@/apiRequests/auth'

// Những page sau sẽ không refresh-token
const UNAUTHENTICATED_PATH = ['/login', '/register', '/refresh-token']
const RefreshToken = () => {
  const pathname = usePathname()

  // useEffect để mà chúng ta check set cái Interval các kiểu
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return
    let interval: any = null

    // Tiến hành check accessToken và refreshToken
    const checkAndRefreshToken = async () => {
      // Không nên đưa logic lấy accessToken và refreshToken ra khỏi cái function này
      // Vì để mỗi lần mà checkAndRefreshToken được gọi thì chúng ta sẽ có AT và RT mới
      // Tránh hiện tượng nó lấy AT và RT cũ rồi gọi cho lần tiếp theo
      const accessToken = getAccessTokenFromLocalStorage()
      const refreshToken = getRefreshTokenFromLocalStorage()
      // Chưa đăng nhập thì cũng không cho chạy
      if (!accessToken || !refreshToken) return

      const decodedAccessToken = jwt.decode(accessToken) as {
        exp: number
        iat: number
      }
      const decodedRefreshToken = jwt.decode(refreshToken) as {
        exp: number
        iat: number
      }
      //  Thời điểm hết hạn của token là tính theo epoch time (s)
      // Còn khi chúng ta dùng cú pháp new Date().getTime() thì nó sẽ trả về epoch time là (ms)

      // Lấy ra thời điểm hiện tại theo s, math.round là để nó làm tròn
      const now = Math.round(new Date().getTime() / 1000)
      // Trường hợp refreshToken hết hạn thì không xử lý nữa
      if (decodedRefreshToken.exp <= now) return
      // Ví dụ accessToken của chúng ta có thời gian hết hạn là 10s
      // Thì mình sẽ kiểm tra còn 1/3 thời gian thì chúng ta sẽ cho refreshToken lại
      // Thời gian còn lại sẽ dựa trên: decodedAccessToken.exp - now <= 3
      // Thời gian hết hạn AT decodedAccessToken.exp - decodedAccessToken.iat
      if (decodedAccessToken.exp - now < (decodedAccessToken.exp - decodedAccessToken.iat) / 3) {
        // Gọi API refreshToken
        try {
          const { payload } = await authApiRequest.refreshToken()
          setAccessTokenToLocalStorage(payload.data.accessToken)
          setRefreshTokenToLocalStorage(payload.data.refreshToken)
        } catch (error) {
          // Khi bị lỗi thì chúng ta sẽ logout vì đã handle ở bên route handler khi bị lỗi 401,
          // Cùng với đó là clearInterval
          clearInterval(interval)
        }
      }
    }
    // Phải gọi lần đầu tiên, vì cái interval sẽ chạy sau thời gian TIMEOUT
    // Chạy lần nếu có  hết hạn thì chúng ta sẽ refreshToken, còn không thì interval sau 1s thì nó sẽ check 1 lần
    // phải gọi lần đầu tiên để mà tránh trường hợp ngdung đang ở trang này rồi đổi qua trang khác rồi vô tình ở AT còn 2s hết hạn mà phải đợi 5s `callback-setInterval` nó mới chạy 1 lần
    checkAndRefreshToken()
    const TIMEOUT = 1000
    // Vì sau khi mà effect function nó chạy thì cái callback của Interval sau TIMEOUT thì nó mới chạy
    // AT thời gian hết hạn là 10s thì sau 1s sẽ check 1 lần
    interval = setInterval(checkAndRefreshToken, TIMEOUT)

    // Xoá interval khi mà unmount, qua component khác thì gọi lại
    return () => {
      clearInterval(interval)
    }
  }, [pathname])
  return null
}

export default RefreshToken

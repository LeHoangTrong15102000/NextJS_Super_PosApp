'use client'

import { toast } from '@/components/ui/use-toast'
import { checkAndRefreshToken } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Những page sau sẽ không refresh-token
const UNAUTHENTICATED_PATH = ['/login', '/register', '/refresh-token']
const RefreshToken = () => {
  const pathname = usePathname()
  const router = useRouter()

  // useEffect để mà chúng ta check set cái Interval các kiểu
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return
    let interval: any = null

    // Tiến hành check accessToken và refreshToken

    // Phải gọi lần đầu tiên, vì cái interval sẽ chạy sau thời gian TIMEOUT
    // Chạy lần nếu có  hết hạn thì chúng ta sẽ refreshToken, còn không thì interval sau 1s thì nó sẽ check 1 lần
    // phải gọi lần đầu tiên để mà tránh trường hợp ngdung đang ở trang này rồi đổi qua trang khác rồi vô tình ở AT còn 2s hết hạn mà phải đợi 5s `callback-setInterval` nó mới chạy 1 lần
    checkAndRefreshToken({
      onError: () => {
        clearInterval(interval)
        toast({
          description: 'Hết phiên đăng nhập!!'
        })
        router.push('/login')
      }
    })
    const TIMEOUT = 1000
    // Vì sau khi mà effect function nó chạy thì cái callback của Interval sau TIMEOUT thì nó mới chạy
    // AT thời gian hết hạn là 10s thì sau 1s sẽ check 1 lần
    interval = setInterval(
      () =>
        checkAndRefreshToken({
          onError: () => {
            clearInterval(interval)
            toast({
              description: 'Hết phiên đăng nhập!!'
            })
            router.push('/login')
          }
        }),
      TIMEOUT
    )

    // Xoá interval khi mà unmount, qua component khác thì gọi lại
    return () => {
      clearInterval(interval)
    }
  }, [pathname, router])
  return null
}

export default RefreshToken

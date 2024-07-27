'use client'

import { useAppContext } from '@/components/app-provider'
import { toast } from '@/components/ui/use-toast'
import socket from '@/lib/socket'
import { checkAndRefreshToken } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Những page sau sẽ không refresh-token
const UNAUTHENTICATED_PATH = ['/login', '/register', '/refresh-token']

// Component refresh token thì cứ 1s thì nó sẽ check liên tục cái refresh-token để mà lấy ra accessToken mới
const RefreshToken = () => {
  // Lấy ra cái pathname hiện tại trên thanh URL
  const pathname = usePathname()
  const router = useRouter()

  const { setRole } = useAppContext()

  // useEffect để mà chúng ta check set cái Interval các kiểu
  useEffect(() => {
    if (UNAUTHENTICATED_PATH.includes(pathname)) return
    let interval: any = null

    // Tiến hành check accessToken và refreshToken

    // Phải gọi lần đầu tiên, vì cái interval sẽ chạy sau thời gian TIMEOUT
    // Chạy lần nếu có  hết hạn thì chúng ta sẽ refreshToken, còn không thì interval sau 1s thì nó sẽ check 1 lần
    // phải gọi lần đầu tiên để mà tránh trường hợp ngdung đang ở trang này rồi đổi qua trang khác rồi vô tình ở AT còn 2s hết hạn mà phải đợi 5s `callback-setInterval` nó mới chạy 1 lần
    // checkAndRefreshToken({
    //   onError: () => {
    //     clearInterval(interval)
    //     toast({
    //       description: 'Hết phiên đăng nhập!!'
    //     })
    //     router.push('/login')
    //   }
    // })
    const onRefreshToken = (force?: boolean) => {
      checkAndRefreshToken({
        onError: () => {
          clearInterval(interval)
          router.push('/login')
        },
        force
      })
    }

    onRefreshToken()
    const TIMEOUT = 1000
    // Vì sau khi mà effect function nó chạy thì cái callback của Interval sau TIMEOUT thì nó mới chạy
    // AT thời gian hết hạn là 10s thì sau 1s sẽ check 1 lần

    // Vì chính cái function này chúng ta truyền vào cái `setInterval` nên là nó có lỗi gì thì chúng ta cùng phải clear cái Interval đi
    //   interval = setInterval(
    //     () =>
    //       checkAndRefreshToken({
    //         onError: () => {
    //           clearInterval(interval)
    //           toast({
    //             description: 'Hết phiên đăng nhập!!'
    //           })
    //           setRole()
    //           router.push('/login')
    //         }
    //       }),
    //     TIMEOUT
    //   )

    //   // Xoá interval khi mà unmount, qua component khác thì gọi lại
    //   return () => {
    //     clearInterval(interval)
    //   }
    // }, [pathname, router, setRole])
    // return null
    interval = setInterval(onRefreshToken, TIMEOUT)

    if (socket.connected) {
      onConnect()
    }

    function onConnect() {
      console.log(socket.id)
    }

    function onDisconnect() {
      console.log('disconnect')
    }

    function onRefreshTokenSocket() {
      onRefreshToken(true)
    }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('refresh-token', onRefreshTokenSocket)
    return () => {
      clearInterval(interval)
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('refresh-token', onRefreshTokenSocket)
    }
  }, [pathname, router])
}

export default RefreshToken

// 'use client'

// import { useAppStore } from '@/components/app-provider'
// import { checkAndRefreshToken } from '@/lib/utils'
// import { usePathname, useRouter } from 'next/navigation'
// import { useEffect } from 'react'

// // Những page sau sẽ không check refesh token
// const UNAUTHENTICATED_PATH = ['/login', '/logout', '/refresh-token']
// export default function RefreshToken() {
//   const pathname = usePathname()
//   const router = useRouter()
//   const socket = useAppStore((state) => state.socket)
//   const disconnectSocket = useAppStore((state) => state.disconnectSocket)
//   useEffect(() => {
//     if (UNAUTHENTICATED_PATH.includes(pathname)) return
//     let interval: any = null
//     // Phải gọi lần đầu tiên, vì interval sẽ chạy sau thời gian TIMEOUT
//     const onRefreshToken = (force?: boolean) => {
//       checkAndRefreshToken({
//         onError: () => {
//           clearInterval(interval)
//           disconnectSocket()
//           router.push('/login')
//         },
//         force
//       })
//     }

//     onRefreshToken()
//     // Timeout interval phải bé hơn thời gian hết hạn của access token
//     // Ví dụ thời gian hết hạn access token là 10s thì 1s mình sẽ cho check 1 lần
//     const TIMEOUT = 1000
//     interval = setInterval(onRefreshToken, TIMEOUT)

//     if (socket?.connected) {
//       onConnect()
//     }

//     function onConnect() {
//       console.log(socket?.id)
//     }

//     function onDisconnect() {
//       console.log('disconnect')
//     }

//     function onRefreshTokenSocket() {
//       onRefreshToken(true)
//     }
//     socket?.on('connect', onConnect)
//     socket?.on('disconnect', onDisconnect)
//     socket?.on('refresh-token', onRefreshTokenSocket)
//     return () => {
//       clearInterval(interval)
//       socket?.off('connect', onConnect)
//       socket?.off('disconnect', onDisconnect)
//       socket?.off('refresh-token', onRefreshTokenSocket)
//     }
//   }, [pathname, router, socket, disconnectSocket])
//   return null
// }

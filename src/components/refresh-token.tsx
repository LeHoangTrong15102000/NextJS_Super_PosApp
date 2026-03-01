'use client'

import { useAppStore } from '@/components/app-provider'
import { checkAndRefreshToken } from '@/lib/utils'
import { usePathname, useRouter } from '@/i18n/routing'
import { useEffect } from 'react'
import { UNAUTHENTICATED_PATHS } from '@/constants/routes'
import { REFRESH_CHECK_INTERVAL } from '@/constants/config'

export default function RefreshToken() {
  const pathname = usePathname()
  const router = useRouter()
  const socket = useAppStore((state) => state.socket)
  const disconnectSocket = useAppStore((state) => state.disconnectSocket)
  useEffect(() => {
    if (UNAUTHENTICATED_PATHS.includes(pathname)) return
    let interval: ReturnType<typeof setInterval> | null = null
    // Phải gọi lần đầu tiên, vì interval sẽ chạy sau thời gian TIMEOUT
    const onRefreshToken = (force?: boolean) => {
      checkAndRefreshToken({
        onError: () => {
          clearInterval(interval)
          disconnectSocket()
          router.push('/login')
        },
        force
      })
    }

    onRefreshToken()
    // Timeout interval phải bé hơn thời gian hết hạn của access token
    // Ví dụ thời gian hết hạn access token là 10s thì 1s mình sẽ cho check 1 lần
    interval = setInterval(onRefreshToken, REFRESH_CHECK_INTERVAL)

    if (socket?.connected) {
      onConnect()
    }

    function onConnect() {
      if (process.env.NODE_ENV === 'development') {
        console.log('Socket connected:', socket?.id)
      }
    }

    function onDisconnect() {
      if (process.env.NODE_ENV === 'development') {
        console.log('Socket disconnected')
      }
    }

    function onRefreshTokenSocket() {
      onRefreshToken(true)
    }
    socket?.on('connect', onConnect)
    socket?.on('disconnect', onDisconnect)
    socket?.on('refresh-token', onRefreshTokenSocket)
    return () => {
      clearInterval(interval)
      socket?.off('connect', onConnect)
      socket?.off('disconnect', onDisconnect)
      socket?.off('refresh-token', onRefreshTokenSocket)
    }
  }, [pathname, router, socket, disconnectSocket])
  return null
}

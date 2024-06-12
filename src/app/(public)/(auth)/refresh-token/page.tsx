'use client'

import { toast } from '@/components/ui/use-toast'
import { checkAndRefreshToken, getAccessTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

const RefreshTokenPage = () => {
  // ** Search params
  const searchParams = useSearchParams()

  // ** Router
  const router = useRouter()

  // ** Get localstorage
  const refreshTokenFromLocalStorage = getRefreshTokenFromLocalStorage()
  // ** Get value searchParams
  const refreshTokenFromUrl = searchParams.get('refreshToken')
  const redirectPathname = searchParams.get('redirect')

  useEffect(() => {
    // Nếu có refreshTokenFromUrl và RTFU === RTFL thì chúng ta sẽ tiến hành refreshToken cho người dùng
    if (refreshTokenFromUrl && refreshTokenFromUrl === refreshTokenFromLocalStorage) {
      checkAndRefreshToken({
        onSuccess: () => {
          router.push(redirectPathname || '/')
        }
      })
      // Sau khi mà refreshToken thành công thì redirect người dùng về trang ban đầu vào
      // refreshToken thất bại thì htt tự xử lý logout ra cho chúng ta
    }
  }, [router, refreshTokenFromUrl, redirectPathname])

  return <div>Refresh token...</div>
}

export default RefreshTokenPage

'use client'

import { toast } from '@/components/ui/use-toast'
import { checkAndRefreshToken, getAccessTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

const RefreshTokenLogic = () => {
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
    // Nếu như ai đó đưa cái đường link này và chúng ta check không đúng thì nó ko redirect được, không lẻ chúng ta bắt người dùng phải đợi mãi
    if (refreshTokenFromUrl && refreshTokenFromUrl === refreshTokenFromLocalStorage) {
      checkAndRefreshToken({
        onSuccess: () => {
          router.push(redirectPathname || '/')
        }
      })
      // Sau khi mà refreshToken thành công thì redirect người dùng về trang ban đầu vào
      // refreshToken thất bại thì htt tự xử lý logout ra cho chúng ta
    } else {
      // Có thằng ất ơ nào đó
      // Nên là lỡ nếu mà ng dùng vào refreshToken nó không chạy thì sẽ đá về home
      router.push('/')
    }
  }, [router, refreshTokenFromUrl, redirectPathname, refreshTokenFromLocalStorage])

  return <div>Refresh token...</div>
}

const RefreshTokenPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RefreshTokenLogic />
    </Suspense>
  )
}

export default RefreshTokenPage

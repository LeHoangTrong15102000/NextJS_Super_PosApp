'use client'

import { useAppContext } from '@/components/app-provider'
import { toast } from '@/components/ui/use-toast'
import { getAccessTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

const LogoutLogic = () => {
  const { mutateAsync } = useLogoutMutation()
  const searchParams = useSearchParams()
  const { setRole } = useAppContext()

  const refreshTokenFromUrl = searchParams.get('refreshToken')
  const accessTokenFromUrl = searchParams.get('accessToken')
  const refreshTokenFromLocalStorage = getRefreshTokenFromLocalStorage()
  const accessTokenFromLocalStorage = getAccessTokenFromLocalStorage()

  const router = useRouter()
  const ref = useRef<any>(null)

  useEffect(() => {
    // Ở trang logout cũng vậy nếu như mà có thằng nào đó gửi cái link logout
    if (
      !ref.current &&
      ((refreshTokenFromUrl && refreshTokenFromUrl !== refreshTokenFromLocalStorage) ||
        (accessTokenFromUrl && accessTokenFromUrl !== accessTokenFromLocalStorage))
    ) {
      ref.current = mutateAsync
      mutateAsync()
        .then((res) => {
          // console.log({ res })
          const messageResult = res.payload.message
          setTimeout(() => {
            ref.current = null
          }, 1000)
          setRole()
          toast({
            description: messageResult
          })
          router.push('/login')
          // router.refresh()
        })
        .catch((err) => {
          console.log('error', err)
        })
        .finally(() => {})
    } else {
      // Tránh trường hợp mà ng khác gửi cái đường link mà chúng ta cứ ở mãi cái trang này thì nó không hay
      router.push('/')
    }
  }, [
    mutateAsync,
    router,
    refreshTokenFromUrl,
    accessTokenFromUrl,
    setRole,
    accessTokenFromLocalStorage,
    refreshTokenFromLocalStorage
  ])
  return <div>Log out...</div>
}

const LogoutPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogoutLogic />
    </Suspense>
  )
}

export default LogoutPage

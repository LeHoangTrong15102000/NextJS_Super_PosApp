'use client'

import { toast } from '@/components/ui/use-toast'
import { getRefreshTokenFromLocalStorage } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

const LogoutPage = () => {
  const { mutateAsync } = useLogoutMutation()
  const searchParams = useSearchParams()
  const refreshTokenFromUrl = searchParams.get('refreshToken')
  const refreshTokenFromLocalStorage = getRefreshTokenFromLocalStorage()
  const router = useRouter()
  const ref = useRef<any>(null)
  useEffect(() => {
    if (ref.current || refreshTokenFromUrl !== refreshTokenFromLocalStorage) return
    ref.current = mutateAsync
    mutateAsync()
      .then((res) => {
        // console.log({ res })
        const messageResult = res.payload.message
        setTimeout(() => {
          ref.current = null
        }, 1000)
        toast({
          description: messageResult
        })
        router.push('/login')
      })
      .catch((err) => {
        console.log('error', err)
      })
      .finally(() => {
        router.push('/login')
      })
  }, [mutateAsync, router, refreshTokenFromLocalStorage])
  return <div>Log out...</div>
}

export default LogoutPage

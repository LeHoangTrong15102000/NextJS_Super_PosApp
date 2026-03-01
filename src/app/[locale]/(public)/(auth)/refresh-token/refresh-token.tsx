'use client'

import {
  checkAndRefreshToken,
  getRefreshTokenFromLocalStorage
} from '@/lib/utils'
import { useRouter } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function RefreshToken() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPathname = searchParams.get('redirect')
  useEffect(() => {
    const refreshTokenFromLocalStorage = getRefreshTokenFromLocalStorage()
    if (refreshTokenFromLocalStorage) {
      checkAndRefreshToken({
        onSuccess: () => {
          router.push(redirectPathname || '/')
        }
      })
    } else {
      router.push('/')
    }
  }, [router, redirectPathname])
  return <div>Refresh token....</div>
}

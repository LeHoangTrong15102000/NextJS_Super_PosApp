'use client'

import { useAppStore } from '@/components/app-provider'
import {
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage
} from '@/lib/utils'
import { useRouter } from '@/i18n/routing'
import { useLogoutMutation } from '@/queries/useAuth'
import { useSearchParams } from 'next/navigation'
import { memo, Suspense, useEffect, useRef } from 'react'

function LogoutComponent() {
  const { mutateAsync } = useLogoutMutation()
  const router = useRouter()
  const disconnectSocket = useAppStore((state) => state.disconnectSocket)
  const setRole = useAppStore((state) => state.setRole)
  const searchParams = useSearchParams()
  const clearTokens = searchParams.get('clearTokens')
  const ref = useRef<(() => Promise<unknown>) | null>(null)
  useEffect(() => {
    if (
      !ref.current &&
      clearTokens &&
      (getRefreshTokenFromLocalStorage() || getAccessTokenFromLocalStorage())
    ) {
      ref.current = mutateAsync
      mutateAsync().then(() => {
        setTimeout(() => {
          ref.current = null
        }, 1000)
        setRole()
        disconnectSocket()
      })
    }
    // Only redirect if clearTokens param was provided but no tokens exist
    // Don't redirect when no clearTokens param at all (normal login page visit)
  }, [
    mutateAsync,
    router,
    clearTokens,
    setRole,
    disconnectSocket
  ])
  return null
}

const Logout = memo(function LogoutInner() {
  return (
    <Suspense>
      <LogoutComponent />
    </Suspense>
  )
})

export default Logout

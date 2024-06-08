'use client'

import { toast } from '@/components/ui/use-toast'
import { useLogoutMutation } from '@/queries/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

const LogoutPage = () => {
  const { mutateAsync } = useLogoutMutation()
  const router = useRouter()
  const ref = useRef<any>(null)
  useEffect(() => {
    if (ref.current) return
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
  }, [mutateAsync, router])
  return <div>Logout page</div>
}

export default LogoutPage

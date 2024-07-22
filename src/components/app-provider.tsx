'use client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RefreshToken from '@/components/refresh-token'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { decodeToken, getAccessTokenFromLocalStorage, removeTokensFromLocalStorage } from '@/lib/utils'
import { RoleType } from '@/types/jwt.types'

// Default
// staleTime: 0
// gc: 5 phút (5 * 1000* 60)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
      // refetchOnMount: false
    }
  }
})

const AppContext = createContext({
  isAuth: false,
  role: undefined as RoleType | undefined,
  setRole: (role?: RoleType | undefined) => {}
})

export const useAppContext = () => {
  return useContext(AppContext)
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<RoleType | undefined>()

  // Khi mà isAuth thay đổi thì cái contextApi này sẽ render lại thì lúc này nó sẽ check lại useEffect
  // Cái useEffect này chỉ chạy lần đầu khi mà app được render
  useEffect(() => {
    const accessToken = getAccessTokenFromLocalStorage()
    if (accessToken) {
      const role = decodeToken(accessToken).role
      setRoleState(role)
    }
  }, [])

  // Hàm set lại isAuth
  const setRole = useCallback((role?: RoleType | undefined) => {
    setRoleState(role)
    if (!role) {
      removeTokensFromLocalStorage()
    }
  }, [])
  const isAuth = Boolean(role)

  // Nếu sử dụng React19 và Nextjs15 thì không cần dùng AppContext.Provider nữa chỉ cần AppContext là đủ rồi
  return (
    <AppContext.Provider
      value={{
        isAuth,
        role,
        setRole
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Component RefreshToken nằm cạnh children thì nó sẽ check liên tục */}
        <RefreshToken />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AppContext.Provider>
  )
}

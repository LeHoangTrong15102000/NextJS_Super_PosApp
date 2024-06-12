'use client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RefreshToken from '@/components/refresh-token'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getAccessTokenFromLocalStorage, removeTokensFromLocalStorage } from '@/lib/utils'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  }
})

const AppContext = createContext({
  isAuth: false,
  setIsAuth: (isAuth: boolean) => {}
})

export const useAppContext = () => {
  return useContext(AppContext)
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuthState] = useState(false)

  // Khi mà isAuth thay đổi thì cái contextApi này sẽ render lại thì lúc này nó sẽ check lại useEffect
  // Cái useEffect này chỉ chạy lần đầu khi mà app được render
  useEffect(() => {
    const accessToken = getAccessTokenFromLocalStorage()
    if (accessToken) {
      setIsAuthState(true)
    }
  }, [])

  // Hàm set lại isAuth
  const setIsAuth = useCallback((isAuth: boolean) => {
    if (isAuth) {
      setIsAuthState(true)
    } else {
      setIsAuthState(false)
      removeTokensFromLocalStorage()
    }
  }, [])

  // Nếu sử dụng React19 và Nextjs15 thì không cần dùng AppContext.Provider nữa chỉ cần AppContext là đủ rồi
  return (
    <AppContext.Provider
      value={{
        isAuth,
        setIsAuth
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <RefreshToken />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AppContext.Provider>
  )
}

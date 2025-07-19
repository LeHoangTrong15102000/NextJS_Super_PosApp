import React, { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })

interface AllTheProvidersProps {
  children: ReactNode
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient()

  return React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const customRender = (ui: ReactElement, options?: RenderOptions) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from testing library
export * from '@testing-library/react'

// Export our custom render
export { customRender as render }

// Helper functions for testing
export const createMockQueryClient = createTestQueryClient

// Mock data generators
export const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'Owner' as const,
  avatar: null
}

export const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token'
}

export const mockLoginResponse = {
  data: {
    accessToken: mockTokens.accessToken,
    refreshToken: mockTokens.refreshToken,
    account: mockUser
  },
  message: 'Đăng nhập thành công'
}

// Helper to wait for async operations
export const waitForLoadingToFinish = () => new Promise((resolve) => setTimeout(resolve, 0))

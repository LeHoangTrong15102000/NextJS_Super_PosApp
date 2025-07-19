import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useLoginMutation, useLogoutMutation, useSetTokenToCookieMutation } from '../useAuth'
import authApiRequest from '@/apiRequests/auth'

// Mock authApiRequest
jest.mock('@/apiRequests/auth', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  setTokenToCookie: jest.fn()
}))

const mockAuthApiRequest = authApiRequest as jest.Mocked<typeof authApiRequest>

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  TestWrapper.displayName = 'TestWrapper'
  return TestWrapper
}

describe('useAuth Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useLoginMutation', () => {
    it('should handle successful login', async () => {
      const mockLoginResponse = {
        payload: {
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            account: {
              id: 1,
              name: 'Test User',
              email: 'test@example.com',
              role: 'Owner' as const,
              avatar: null
            }
          },
          message: 'Đăng nhập thành công'
        }
      }

      mockAuthApiRequest.login.mockResolvedValueOnce(mockLoginResponse)

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper()
      })

      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      }

      result.current.mutate(loginData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockAuthApiRequest.login).toHaveBeenCalledWith(loginData)
      expect(result.current.data).toEqual(mockLoginResponse)
    })

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials')
      mockAuthApiRequest.login.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper()
      })

      const loginData = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      }

      result.current.mutate(loginData)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(mockAuthApiRequest.login).toHaveBeenCalledWith(loginData)
      expect(result.current.error).toEqual(mockError)
    })

    it('should have correct initial state', () => {
      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper()
      })

      expect(result.current.isIdle).toBe(true)
      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeNull()
    })

    it('should track loading state correctly', async () => {
      // Mock a delayed response
      mockAuthApiRequest.login.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  payload: {
                    data: {
                      accessToken: 'token',
                      refreshToken: 'token',
                      account: {
                        id: 1,
                        name: 'User',
                        email: 'user@example.com',
                        role: 'Owner' as const,
                        avatar: null
                      }
                    },
                    message: 'Success'
                  }
                }),
              100
            )
          )
      )

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        email: 'test@example.com',
        password: 'password123'
      })

      // Should be pending immediately after mutation
      expect(result.current.isPending).toBe(true)
      expect(result.current.isIdle).toBe(false)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useLogoutMutation', () => {
    it('should handle successful logout', async () => {
      const mockLogoutResponse = {
        payload: {
          message: 'Đăng xuất thành công'
        }
      }

      mockAuthApiRequest.logout.mockResolvedValueOnce(mockLogoutResponse)

      const { result } = renderHook(() => useLogoutMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockAuthApiRequest.logout).toHaveBeenCalledWith()
      expect(result.current.data).toEqual(mockLogoutResponse)
    })

    it('should handle logout failure', async () => {
      const mockError = new Error('Logout failed')
      mockAuthApiRequest.logout.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useLogoutMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(mockAuthApiRequest.logout).toHaveBeenCalledWith()
      expect(result.current.error).toEqual(mockError)
    })

    it('should call logout without parameters', async () => {
      mockAuthApiRequest.logout.mockResolvedValueOnce({
        payload: { message: 'Success' }
      })

      const { result } = renderHook(() => useLogoutMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate()

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify logout was called without any arguments
      expect(mockAuthApiRequest.logout).toHaveBeenCalledWith()
      expect(mockAuthApiRequest.logout).toHaveBeenCalledTimes(1)
    })
  })

  describe('useSetTokenToCookieMutation', () => {
    it('should handle successful token setting', async () => {
      const mockTokenResponse = {
        payload: {
          message: 'Token set successfully'
        }
      }

      mockAuthApiRequest.setTokenToCookie.mockResolvedValueOnce(mockTokenResponse)

      const { result } = renderHook(() => useSetTokenToCookieMutation(), {
        wrapper: createWrapper()
      })

      const tokenData = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }

      result.current.mutate(tokenData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockAuthApiRequest.setTokenToCookie).toHaveBeenCalledWith(tokenData)
      expect(result.current.data).toEqual(mockTokenResponse)
    })

    it('should handle token setting failure', async () => {
      const mockError = new Error('Failed to set tokens')
      mockAuthApiRequest.setTokenToCookie.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useSetTokenToCookieMutation(), {
        wrapper: createWrapper()
      })

      const tokenData = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }

      result.current.mutate(tokenData)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(mockAuthApiRequest.setTokenToCookie).toHaveBeenCalledWith(tokenData)
      expect(result.current.error).toEqual(mockError)
    })

    it('should pass correct token data structure', async () => {
      mockAuthApiRequest.setTokenToCookie.mockResolvedValueOnce({
        payload: { message: 'Success' }
      })

      const { result } = renderHook(() => useSetTokenToCookieMutation(), {
        wrapper: createWrapper()
      })

      const tokenData = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }

      result.current.mutate(tokenData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockAuthApiRequest.setTokenToCookie).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String)
        })
      )
    })
  })

  describe('Mutation State Management', () => {
    it('should reset mutation state correctly', async () => {
      mockAuthApiRequest.login.mockResolvedValueOnce({
        payload: {
          data: {
            accessToken: 'token',
            refreshToken: 'token',
            account: {
              id: 1,
              name: 'User',
              email: 'user@example.com',
              role: 'Owner' as const,
              avatar: null
            }
          },
          message: 'Success'
        }
      })

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper()
      })

      // First mutation
      result.current.mutate({
        email: 'test@example.com',
        password: 'password123'
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Reset the mutation
      result.current.reset()

      expect(result.current.isIdle).toBe(true)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeNull()
    })

    it('should handle multiple consecutive mutations', async () => {
      const responses = [
        {
          payload: {
            data: {
              accessToken: 'token1',
              refreshToken: 'token1',
              account: {
                id: 1,
                name: 'User1',
                email: 'user1@example.com',
                role: 'Owner' as const,
                avatar: null
              }
            },
            message: 'Success 1'
          }
        },
        {
          payload: {
            data: {
              accessToken: 'token2',
              refreshToken: 'token2',
              account: {
                id: 2,
                name: 'User2',
                email: 'user2@example.com',
                role: 'Employee' as const,
                avatar: null
              }
            },
            message: 'Success 2'
          }
        }
      ]

      mockAuthApiRequest.login.mockResolvedValueOnce(responses[0]).mockResolvedValueOnce(responses[1])

      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: createWrapper()
      })

      // First mutation
      result.current.mutate({
        email: 'user1@example.com',
        password: 'password123'
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(responses[0])

      // Second mutation
      result.current.mutate({
        email: 'user2@example.com',
        password: 'password456'
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(responses[1])
      expect(mockAuthApiRequest.login).toHaveBeenCalledTimes(2)
    })
  })
})

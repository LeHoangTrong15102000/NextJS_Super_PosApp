import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import LoginForm from '../login-form'
import { useLoginMutation } from '@/queries/useAuth'
import { useAppStore } from '@/components/app-provider'
import { useRouter } from '@/i18n/routing'

// Mock dependencies
jest.mock('@/queries/useAuth')
jest.mock('@/components/app-provider')
jest.mock('@/i18n/routing', () => {
  const mockReact = require('react')
  return {
    useRouter: jest.fn(),
    Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => {
      return mockReact.createElement('a', { href, ...props }, children)
    }
  }
})
jest.mock('@/components/search-params-loader', () => {
  const { useEffect } = require('react')
  return {
    __esModule: true,
    default: function MockSearchParamsLoader({
      onParamsReceived
    }: {
      onParamsReceived: (params: URLSearchParams) => void
    }) {
      // Simulate component mounting and calling onParamsReceived
      useEffect(() => {
        onParamsReceived(new URLSearchParams(''))
      }, [onParamsReceived])
      return null
    },
    useSearchParamsLoader: () => ({
      searchParams: new URLSearchParams(''),
      setSearchParams: jest.fn()
    })
  }
})

const mockUseLoginMutation = useLoginMutation as jest.MockedFunction<typeof useLoginMutation>
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

const mockPush = jest.fn()
const mockSetRole = jest.fn()
const mockSetSocket = jest.fn()
const mockMutateAsync = jest.fn()

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn()
    })

    mockUseAppStore.mockImplementation((selector) => {
      const state = {
        setRole: mockSetRole,
        setSocket: mockSetSocket,
        role: undefined,
        isAuth: false,
        socket: undefined,
        disconnectSocket: jest.fn()
      }
      return selector ? selector(state) : state
    })

    mockUseLoginMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      mutate: jest.fn(),
      reset: jest.fn()
    } as any)
  })

  it('should render login form correctly', () => {
    render(<LoginForm />)

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /buttonLogin/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /loginWithGoogle/i })).toBeInTheDocument()
  })

  it('should display form labels and placeholders', () => {
    render(<LoginForm />)

    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('m@example.com')).toBeInTheDocument()
  })

  it('should validate required fields on submit', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    await user.click(submitButton)

    // In Zod 4, email shows 'required' (from .min(1)) and password shows 'minmaxPassword' (from .min(6))
    await waitFor(() => {
      expect(screen.getByText('required')).toBeInTheDocument()
      expect(screen.getByText('minmaxPassword')).toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('invalidEmail')).toBeInTheDocument()
    })
  })

  it('should validate password length', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, '12345') // Too short
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('minmaxPassword')).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const mockSuccessResponse = {
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

    mockMutateAsync.mockResolvedValueOnce(mockSuccessResponse)

    render(<LoginForm />)

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    await user.type(emailInput, 'admin@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123'
      })
    })

    expect(mockSetRole).toHaveBeenCalledWith('Owner')
    expect(mockPush).toHaveBeenCalledWith('/manage/dashboard')
    expect(mockSetSocket).toHaveBeenCalled()
  })

  it('should show loading state during submission', async () => {
    // Mock pending state
    mockUseLoginMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      mutate: jest.fn(),
      reset: jest.fn()
    } as any)

    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    // LoaderCircle renders an SVG with class 'animate-spin'
    const spinner = submitButton.querySelector('svg.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should handle login error gracefully', async () => {
    const user = userEvent.setup()
    const mockError = {
      payload: {
        message: 'Invalid credentials'
      }
    }

    mockMutateAsync.mockRejectedValueOnce(mockError)

    render(<LoginForm />)

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
    })

    // Should not redirect or set role on error
    expect(mockSetRole).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should prevent multiple submissions when pending', async () => {
    const user = userEvent.setup()

    // Mock pending state
    mockUseLoginMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      mutate: jest.fn(),
      reset: jest.fn()
    } as any)

    render(<LoginForm />)

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Try to submit multiple times
    await user.click(submitButton)
    await user.click(submitButton)
    await user.click(submitButton)

    // Should only call once due to isPending check
    expect(mockMutateAsync).toHaveBeenCalledTimes(0) // Not called because isPending is true
  })

  it('should have correct Google OAuth link', () => {
    render(<LoginForm />)

    const googleLink = screen.getByRole('link', { name: /loginWithGoogle/i })

    expect(googleLink).toHaveAttribute('href')
    const href = googleLink.getAttribute('href')
    expect(href).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(href).toContain('client_id=')
    expect(href).toContain('redirect_uri=')
    expect(href).toContain('response_type=code')
  })

  it('should clear role when clearTokens parameter is present', () => {
    // Override the useSearchParamsLoader mock to return clearTokens=true
    const mockSearchParamsLoaderModule = require('@/components/search-params-loader')
    const originalUseSearchParamsLoader = mockSearchParamsLoaderModule.useSearchParamsLoader

    mockSearchParamsLoaderModule.useSearchParamsLoader = () => ({
      searchParams: new URLSearchParams('clearTokens=true'),
      setSearchParams: jest.fn()
    })

    render(<LoginForm />)

    expect(mockSetRole).toHaveBeenCalledWith()

    // Restore original mock
    mockSearchParamsLoaderModule.useSearchParamsLoader = originalUseSearchParamsLoader
  })

  it('should have proper form accessibility', () => {
    render(<LoginForm />)

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    // Check for proper labels
    expect(emailInput).toHaveAttribute('id', 'email')
    expect(passwordInput).toHaveAttribute('id', 'password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Check for required attributes
    expect(emailInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')

    // Check button type
    expect(submitButton).toHaveAttribute('type', 'submit')
  })

  it('should handle form validation errors display', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const emailInput = screen.getByRole('textbox', { name: /email/i })
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /buttonLogin/i })

    // Test email validation
    await user.type(emailInput, 'invalid')
    await user.type(passwordInput, '123') // Too short
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('invalidEmail')).toBeInTheDocument()
      expect(screen.getByText('minmaxPassword')).toBeInTheDocument()
    })

    // Fix email, keep invalid password
    await user.clear(emailInput)
    await user.type(emailInput, 'valid@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('invalidEmail')).not.toBeInTheDocument()
      expect(screen.getByText('minmaxPassword')).toBeInTheDocument()
    })
  })
})

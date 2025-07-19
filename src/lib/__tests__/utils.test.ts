import {
  decodeToken,
  checkAndRefreshToken,
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
  removeTokensFromLocalStorage,
  formatCurrency,
  getVietnameseDishStatus,
  getVietnameseOrderStatus,
  getVietnameseTableStatus,
  handleErrorApi,
  normalizePath,
  simpleMatchText,
  removeAccents,
  getTableLink,
  generateSlugUrl,
  getIdFromSlugUrl
} from '../utils'
import { DishStatus, OrderStatus, TableStatus, Role } from '@/constants/type'
import { EntityError } from '../http'
import { toast } from '@/components/ui/use-toast'

// Mock các dependencies
jest.mock('@/components/ui/use-toast')
jest.mock('@/apiRequests/auth')
jest.mock('@/apiRequests/guest')

const mockToast = toast as jest.MockedFunction<typeof toast>

describe('Authentication Utilities', () => {
  beforeEach(() => {
    // Clear localStorage trước mỗi test
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('decodeToken', () => {
    it('should decode valid JWT token correctly', () => {
      // JWT token với payload: {"role": "Owner", "exp": 1234567890, "iat": 1234567800}
      const validToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiT3duZXIiLCJleHAiOjEyMzQ1Njc4OTAsImlhdCI6MTIzNDU2NzgwMH0.W8YZwHkSU8WQKVfPUxIwM-4pGCSAHs4o7NJfL-AwpZI'

      const decoded = decodeToken(validToken)

      expect(decoded).toHaveProperty('role', 'Owner')
      expect(decoded).toHaveProperty('exp', 1234567890)
      expect(decoded).toHaveProperty('iat', 1234567800)
    })

    it('should handle invalid token gracefully', () => {
      expect(() => decodeToken('invalid-token')).toThrow()
    })

    it('should handle malformed JWT token', () => {
      expect(() => decodeToken('not.a.jwt')).toThrow()
    })
  })

  describe('Token Storage Functions', () => {
    describe('getAccessTokenFromLocalStorage', () => {
      it('should return token from localStorage', () => {
        localStorage.setItem('accessToken', 'test-access-token')

        const token = getAccessTokenFromLocalStorage()

        expect(token).toBe('test-access-token')
      })

      it('should return null when no token exists', () => {
        const token = getAccessTokenFromLocalStorage()

        expect(token).toBeNull()
      })
    })

    describe('setAccessTokenToLocalStorage', () => {
      it('should store token in localStorage', () => {
        setAccessTokenToLocalStorage('new-access-token')

        expect(localStorage.getItem('accessToken')).toBe('new-access-token')
      })
    })

    describe('removeTokensFromLocalStorage', () => {
      it('should remove both access and refresh tokens', () => {
        localStorage.setItem('accessToken', 'access-token')
        localStorage.setItem('refreshToken', 'refresh-token')

        removeTokensFromLocalStorage()

        expect(localStorage.getItem('accessToken')).toBeNull()
        expect(localStorage.getItem('refreshToken')).toBeNull()
      })
    })
  })
})

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format Vietnamese currency correctly', () => {
      expect(formatCurrency(100000)).toBe('100.000 ₫')
      expect(formatCurrency(50000)).toBe('50.000 ₫')
      expect(formatCurrency(0)).toBe('0 ₫')
    })

    it('should handle decimal numbers', () => {
      expect(formatCurrency(99999.99)).toBe('100.000 ₫') // VND không có decimal
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-50000)).toBe('-50.000 ₫')
    })
  })

  describe('getVietnameseDishStatus', () => {
    it('should return correct Vietnamese status for Available', () => {
      expect(getVietnameseDishStatus(DishStatus.Available)).toBe('Có sẵn')
    })

    it('should return correct Vietnamese status for Unavailable', () => {
      expect(getVietnameseDishStatus(DishStatus.Unavailable)).toBe('Không có sẵn')
    })

    it('should return correct Vietnamese status for Hidden', () => {
      expect(getVietnameseDishStatus(DishStatus.Hidden)).toBe('Ẩn')
    })
  })

  describe('getVietnameseOrderStatus', () => {
    it('should return correct Vietnamese status for each order status', () => {
      expect(getVietnameseOrderStatus(OrderStatus.Pending)).toBe('Chờ xử lý')
      expect(getVietnameseOrderStatus(OrderStatus.Processing)).toBe('Đang nấu')
      expect(getVietnameseOrderStatus(OrderStatus.Delivered)).toBe('Đã phục vụ')
      expect(getVietnameseOrderStatus(OrderStatus.Paid)).toBe('Đã thanh toán')
      expect(getVietnameseOrderStatus(OrderStatus.Rejected)).toBe('Từ chối')
    })
  })

  describe('getVietnameseTableStatus', () => {
    it('should return correct Vietnamese status for each table status', () => {
      expect(getVietnameseTableStatus(TableStatus.Available)).toBe('Có sẵn')
      expect(getVietnameseTableStatus(TableStatus.Reserved)).toBe('Đã đặt')
      expect(getVietnameseTableStatus(TableStatus.Hidden)).toBe('Ẩn')
    })
  })
})

describe('Text Processing Utilities', () => {
  describe('normalizePath', () => {
    it('should remove leading slash from path', () => {
      expect(normalizePath('/api/auth/login')).toBe('api/auth/login')
      expect(normalizePath('/path/to/resource')).toBe('path/to/resource')
    })

    it('should return unchanged path if no leading slash', () => {
      expect(normalizePath('api/auth/login')).toBe('api/auth/login')
      expect(normalizePath('no-slash')).toBe('no-slash')
    })

    it('should handle empty string', () => {
      expect(normalizePath('')).toBe('')
    })
  })

  describe('removeAccents', () => {
    it('should remove Vietnamese accents correctly', () => {
      expect(removeAccents('ăâêôưđ')).toBe('aaeoud')
      expect(removeAccents('àáảãạ')).toBe('aaaaa')
      expect(removeAccents('ÀÁẢÃẠ')).toBe('AAAAA')
      expect(removeAccents('Đông Hồ')).toBe('Dong Ho')
    })

    it('should handle mixed Vietnamese and English text', () => {
      expect(removeAccents('Phở Bò Việt Nam')).toBe('Pho Bo Viet Nam')
      expect(removeAccents('Bánh mì thịt nướng')).toBe('Banh mi thit nuong')
    })

    it('should return unchanged for text without accents', () => {
      expect(removeAccents('Hello World')).toBe('Hello World')
      expect(removeAccents('123 ABC')).toBe('123 ABC')
    })
  })

  describe('simpleMatchText', () => {
    it('should match text ignoring accents and case', () => {
      expect(simpleMatchText('Phở Bò Huế', 'pho bo')).toBe(true)
      expect(simpleMatchText('Bánh mì thịt nướng', 'banh mi')).toBe(true)
      expect(simpleMatchText('Cà phê sữa đá', 'ca phe')).toBe(true)
    })

    it('should not match unrelated text', () => {
      expect(simpleMatchText('Phở Bò', 'bánh mì')).toBe(false)
      expect(simpleMatchText('Hello', 'World')).toBe(false)
    })

    it('should handle empty search text', () => {
      expect(simpleMatchText('Any text', '')).toBe(true)
      expect(simpleMatchText('Any text', '   ')).toBe(true)
    })
  })
})

describe('URL Generation Utilities', () => {
  describe('getTableLink', () => {
    it('should generate correct table link', () => {
      const result = getTableLink({
        token: 'table-token-123',
        tableNumber: 5
      })

      expect(result).toBe('http://localhost:3000/vi/tables/5?token=table-token-123')
    })

    it('should handle different table numbers', () => {
      const result = getTableLink({
        token: 'test-token',
        tableNumber: 10
      })

      expect(result).toBe('http://localhost:3000/vi/tables/10?token=test-token')
    })
  })

  describe('generateSlugUrl', () => {
    it('should generate slug URL correctly', () => {
      expect(generateSlugUrl({ name: 'Phở Bò Huế', id: 123 })).toBe('pho-bo-hue-123')
      expect(generateSlugUrl({ name: 'Bánh mì thịt nướng', id: 456 })).toBe('banh-mi-thit-nuong-456')
    })

    it('should handle special characters', () => {
      expect(generateSlugUrl({ name: 'Món ăn #1 (Đặc biệt)', id: 1 })).toBe('mon-an-1-dac-biet-1')
    })
  })

  describe('getIdFromSlugUrl', () => {
    it('should extract ID from slug URL correctly', () => {
      expect(getIdFromSlugUrl('pho-bo-hue-123')).toBe(123)
      expect(getIdFromSlugUrl('banh-mi-thit-nuong-456')).toBe(456)
    })

    it('should handle malformed slug', () => {
      expect(getIdFromSlugUrl('invalid-slug')).toBeNaN()
      expect(getIdFromSlugUrl('no-id-here-abc')).toBeNaN()
    })
  })
})

describe('Error Handling Utilities', () => {
  describe('handleErrorApi', () => {
    const mockSetError = jest.fn()

    beforeEach(() => {
      mockSetError.mockClear()
      mockToast.mockClear()
    })

    it('should handle EntityError with setError function', () => {
      const entityError = new EntityError({
        status: 422,
        payload: {
          message: 'Validation failed',
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password too short' }
          ]
        }
      })

      handleErrorApi({
        error: entityError,
        setError: mockSetError
      })

      expect(mockSetError).toHaveBeenCalledTimes(2)
      expect(mockSetError).toHaveBeenCalledWith('email', {
        type: 'server',
        message: 'Email is required'
      })
      expect(mockSetError).toHaveBeenCalledWith('password', {
        type: 'server',
        message: 'Password too short'
      })
      expect(mockToast).not.toHaveBeenCalled()
    })

    it('should show toast for non-EntityError', () => {
      const genericError = {
        payload: {
          message: 'Something went wrong'
        }
      }

      handleErrorApi({
        error: genericError
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Lỗi',
        description: 'Something went wrong',
        variant: 'destructive',
        duration: 5000
      })
    })

    it('should show default error message for unknown error', () => {
      handleErrorApi({
        error: {}
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Lỗi',
        description: 'Lỗi không xác định',
        variant: 'destructive',
        duration: 5000
      })
    })

    it('should use custom duration', () => {
      const error = {
        payload: {
          message: 'Test error'
        }
      }

      handleErrorApi({
        error,
        duration: 3000
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Lỗi',
        description: 'Test error',
        variant: 'destructive',
        duration: 3000
      })
    })
  })
})

import {
  formatCurrency,
  getVietnameseDishStatus,
  getVietnameseOrderStatus,
  getVietnameseTableStatus,
  getTableLink,
  removeAccents,
  simpleMatchText,
  formatDateTimeToLocaleString,
  formatDateTimeToTimeString,
  generateSlugUrl,
  getIdFromSlugUrl
} from '../utils'
import { DishStatus, OrderStatus, TableStatus } from '@/constants/type'
import envConfig, { defaultLocale } from '@/config'

// Mock environment config
jest.mock('@/config', () => ({
  __esModule: true,
  default: {
    NEXT_PUBLIC_URL: 'http://localhost:3000'
  },
  defaultLocale: 'vi'
}))

describe('Business Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format Vietnamese currency correctly', () => {
      expect(formatCurrency(100000)).toContain('100.000')
      expect(formatCurrency(100000)).toContain('₫')
      expect(formatCurrency(50000)).toContain('50.000')
      expect(formatCurrency(1500000)).toContain('1.500.000')
    })

    it('should handle zero amount', () => {
      expect(formatCurrency(0)).toContain('0')
      expect(formatCurrency(0)).toContain('₫')
    })

    it('should handle decimal amounts', () => {
      expect(formatCurrency(99999.99)).toContain('100.000') // Should round
      expect(formatCurrency(50000.5)).toContain('50.001')
    })

    it('should handle negative amounts', () => {
      expect(formatCurrency(-100000)).toContain('-100.000')
      expect(formatCurrency(-100000)).toContain('₫')
    })

    it('should handle large amounts', () => {
      expect(formatCurrency(1000000000)).toContain('1.000.000.000')
    })

    it('should handle small amounts', () => {
      expect(formatCurrency(1)).toContain('1')
      expect(formatCurrency(999)).toContain('999')
    })
  })

  describe('getVietnameseDishStatus', () => {
    it('should return correct Vietnamese text for Available status', () => {
      expect(getVietnameseDishStatus(DishStatus.Available)).toBe('Có sẵn')
    })

    it('should return correct Vietnamese text for Unavailable status', () => {
      expect(getVietnameseDishStatus(DishStatus.Unavailable)).toBe('Không có sẵn')
    })

    it('should return correct Vietnamese text for Hidden status', () => {
      expect(getVietnameseDishStatus(DishStatus.Hidden)).toBe('Ẩn')
    })

    it('should handle default case for unknown status', () => {
      // Test with invalid status that falls back to default
      expect(getVietnameseDishStatus('InvalidStatus' as any)).toBe('Ẩn')
    })

    it('should handle all enum values', () => {
      const allStatuses = Object.values(DishStatus)
      const translations = allStatuses.map((status) => getVietnameseDishStatus(status))

      expect(translations).toHaveLength(3)
      expect(translations).toContain('Có sẵn')
      expect(translations).toContain('Không có sẵn')
      expect(translations).toContain('Ẩn')
    })
  })

  describe('getVietnameseOrderStatus', () => {
    it('should return correct Vietnamese text for Pending status', () => {
      expect(getVietnameseOrderStatus(OrderStatus.Pending)).toBe('Chờ xử lý')
    })

    it('should return correct Vietnamese text for Processing status', () => {
      expect(getVietnameseOrderStatus(OrderStatus.Processing)).toBe('Đang nấu')
    })

    it('should return correct Vietnamese text for Delivered status', () => {
      expect(getVietnameseOrderStatus(OrderStatus.Delivered)).toBe('Đã phục vụ')
    })

    it('should return correct Vietnamese text for Paid status', () => {
      expect(getVietnameseOrderStatus(OrderStatus.Paid)).toBe('Đã thanh toán')
    })

    it('should return correct Vietnamese text for Rejected status', () => {
      expect(getVietnameseOrderStatus(OrderStatus.Rejected)).toBe('Từ chối')
    })

    it('should handle default case for unknown status', () => {
      expect(getVietnameseOrderStatus('InvalidStatus' as any)).toBe('Từ chối')
    })

    it('should handle all enum values', () => {
      const allStatuses = Object.values(OrderStatus)
      const translations = allStatuses.map((status) => getVietnameseOrderStatus(status))

      expect(translations).toHaveLength(5)
      expect(translations).toContain('Chờ xử lý')
      expect(translations).toContain('Đang nấu')
      expect(translations).toContain('Đã phục vụ')
      expect(translations).toContain('Đã thanh toán')
      expect(translations).toContain('Từ chối')
    })

    it('should provide meaningful status progression', () => {
      // Test logical status flow
      expect(getVietnameseOrderStatus(OrderStatus.Pending)).toBe('Chờ xử lý')
      expect(getVietnameseOrderStatus(OrderStatus.Processing)).toBe('Đang nấu')
      expect(getVietnameseOrderStatus(OrderStatus.Delivered)).toBe('Đã phục vụ')
      expect(getVietnameseOrderStatus(OrderStatus.Paid)).toBe('Đã thanh toán')
    })
  })

  describe('getVietnameseTableStatus', () => {
    it('should return correct Vietnamese text for Available status', () => {
      expect(getVietnameseTableStatus(TableStatus.Available)).toBe('Có sẵn')
    })

    it('should return correct Vietnamese text for Reserved status', () => {
      expect(getVietnameseTableStatus(TableStatus.Reserved)).toBe('Đã đặt')
    })

    it('should return correct Vietnamese text for Hidden status', () => {
      expect(getVietnameseTableStatus(TableStatus.Hidden)).toBe('Ẩn')
    })

    it('should handle default case for unknown status', () => {
      expect(getVietnameseTableStatus('InvalidStatus' as any)).toBe('Ẩn')
    })

    it('should handle all enum values', () => {
      const allStatuses = Object.values(TableStatus)
      const translations = allStatuses.map((status) => getVietnameseTableStatus(status))

      expect(translations).toHaveLength(3)
      expect(translations).toContain('Có sẵn')
      expect(translations).toContain('Đã đặt')
      expect(translations).toContain('Ẩn')
    })
  })

  describe('getTableLink', () => {
    it('should generate correct table link with token', () => {
      const token = 'abc123def456'
      const tableNumber = 5

      const link = getTableLink({ token, tableNumber })

      expect(link).toBe('http://localhost:3000/vi/tables/5?token=abc123def456')
    })

    it('should handle different table numbers', () => {
      const token = 'test-token'

      expect(getTableLink({ token, tableNumber: 1 })).toBe('http://localhost:3000/vi/tables/1?token=test-token')

      expect(getTableLink({ token, tableNumber: 99 })).toBe('http://localhost:3000/vi/tables/99?token=test-token')
    })

    it('should handle different tokens', () => {
      const tableNumber = 10

      expect(getTableLink({ token: 'short', tableNumber })).toBe('http://localhost:3000/vi/tables/10?token=short')

      expect(getTableLink({ token: 'very-long-token-123456789', tableNumber })).toBe(
        'http://localhost:3000/vi/tables/10?token=very-long-token-123456789'
      )
    })

    it('should handle special characters in token', () => {
      const tableNumber = 5
      const tokenWithSpecialChars = 'token-with_special.chars'

      const link = getTableLink({
        token: tokenWithSpecialChars,
        tableNumber
      })

      expect(link).toBe('http://localhost:3000/vi/tables/5?token=token-with_special.chars')
    })

    it('should use environment config correctly', () => {
      const token = 'test'
      const tableNumber = 1

      const link = getTableLink({ token, tableNumber })

      expect(link).toContain(envConfig.NEXT_PUBLIC_URL)
      expect(link).toContain(`/${defaultLocale}/`)
    })
  })

  describe('removeAccents', () => {
    it('should remove Vietnamese accents correctly', () => {
      expect(removeAccents('áàảãạ')).toBe('aaaaa')
      expect(removeAccents('éèẻẽẹ')).toBe('eeeee')
      expect(removeAccents('íìỉĩị')).toBe('iiiii')
      expect(removeAccents('óòỏõọ')).toBe('ooooo')
      expect(removeAccents('úùủũụ')).toBe('uuuuu')
      expect(removeAccents('ýỳỷỹỵ')).toBe('yyyyy')
    })

    it('should handle Vietnamese specific characters', () => {
      expect(removeAccents('đ')).toBe('d')
      expect(removeAccents('Đ')).toBe('D')
    })

    it('should handle complex Vietnamese text', () => {
      expect(removeAccents('Phở Bò Tái')).toBe('Pho Bo Tai')
      expect(removeAccents('Bún Bò Huế')).toBe('Bun Bo Hue')
      expect(removeAccents('Cơm tấm sườn nướng')).toBe('Com tam suon nuong')
      expect(removeAccents('Bánh mì thịt nướng')).toBe('Banh mi thit nuong')
    })

    it('should handle mixed case Vietnamese text', () => {
      expect(removeAccents('PHỞ BÒ TÁI')).toBe('PHO BO TAI')
      expect(removeAccents('Bún Bò Huế')).toBe('Bun Bo Hue')
      expect(removeAccents('bánh mì THỊT nướng')).toBe('banh mi THIT nuong')
    })

    it('should handle text without accents', () => {
      expect(removeAccents('Hello World')).toBe('Hello World')
      expect(removeAccents('123456')).toBe('123456')
      expect(removeAccents('test-string_123')).toBe('test-string_123')
    })

    it('should handle empty and edge cases', () => {
      expect(removeAccents('')).toBe('')
      expect(removeAccents(' ')).toBe(' ')
      expect(removeAccents('   ')).toBe('   ')
    })

    it('should preserve numbers and special characters', () => {
      expect(removeAccents('Món ăn số 1: Phở - 85.000đ')).toBe('Mon an so 1: Pho - 85.000d')
      expect(removeAccents('Email: test@example.com')).toBe('Email: test@example.com')
    })
  })

  describe('simpleMatchText', () => {
    it('should match text ignoring accents', () => {
      expect(simpleMatchText('Phở Bò Tái', 'pho')).toBe(true)
      expect(simpleMatchText('Phở Bò Tái', 'bo')).toBe(true)
      expect(simpleMatchText('Phở Bò Tái', 'tai')).toBe(true)
    })

    it('should match text ignoring case', () => {
      expect(simpleMatchText('Phở Bò Tái', 'PHO')).toBe(true)
      expect(simpleMatchText('Phở Bò Tái', 'pho bo')).toBe(true)
      expect(simpleMatchText('Món Ăn Ngon', 'MON AN')).toBe(true)
    })

    it('should match partial text', () => {
      expect(simpleMatchText('Cơm tấm sườn nướng', 'com tam')).toBe(true)
      expect(simpleMatchText('Cơm tấm sườn nướng', 'suon')).toBe(true)
      expect(simpleMatchText('Cơm tấm sườn nướng', 'nuong')).toBe(true)
    })

    it('should handle whitespace in search text', () => {
      expect(simpleMatchText('Phở Bò Tái', '  pho  ')).toBe(true)
      expect(simpleMatchText('Phở Bò Tái', '\tbo\t')).toBe(true)
      expect(simpleMatchText('Phở Bò Tái', ' tai ')).toBe(true)
    })

    it('should return false for non-matching text', () => {
      expect(simpleMatchText('Phở Bò Tái', 'bun')).toBe(false)
      expect(simpleMatchText('Phở Bò Tái', 'mien')).toBe(false)
      expect(simpleMatchText('Cơm tấm', 'pho')).toBe(false)
    })

    it('should handle empty search text', () => {
      expect(simpleMatchText('Phở Bò Tái', '')).toBe(true)
      expect(simpleMatchText('Any text', '   ')).toBe(true)
    })

    it('should handle empty full text', () => {
      expect(simpleMatchText('', 'test')).toBe(false)
      expect(simpleMatchText('', '')).toBe(true)
    })

    it('should handle complex Vietnamese dish names', () => {
      const dishNames = ['Bánh mì thịt nướng', 'Bún bò Huế', 'Gỏi cuốn tôm thịt', 'Chả cá Lă Vọng']

      expect(simpleMatchText(dishNames[0], 'banh mi')).toBe(true)
      expect(simpleMatchText(dishNames[1], 'bun bo hue')).toBe(true)
      expect(simpleMatchText(dishNames[2], 'goi cuon')).toBe(true)
      expect(simpleMatchText(dishNames[3], 'cha ca')).toBe(true)
    })

    it('should handle search across word boundaries', () => {
      expect(simpleMatchText('Phở Bò Tái Chin', 'bo tai')).toBe(true)
      expect(simpleMatchText('Cơm tấm sườn nướng', 'tam suon')).toBe(true)
    })
  })

  describe('formatDateTimeToLocaleString', () => {
    it('should format Date object to locale string', () => {
      const date = new Date('2024-01-15T10:30:00')
      const formatted = formatDateTimeToLocaleString(date)

      // Should format to Vietnamese locale
      expect(formatted).toMatch(/15\/01\/2024/)
      expect(formatted).toMatch(/10:30/)
    })

    it('should format date string to locale string', () => {
      const dateString = '2024-01-15T10:30:00'
      const formatted = formatDateTimeToLocaleString(dateString)

      expect(formatted).toMatch(/15\/01\/2024/)
      expect(formatted).toMatch(/10:30/)
    })

    it('should handle different date formats', () => {
      const isoString = '2024-12-25T23:45:30Z'
      const formatted = formatDateTimeToLocaleString(isoString)

      // In Vietnam timezone, this might show as next day
      expect(formatted).toMatch(/2[5-6]\/12\/2024/)
    })

    it('should handle edge dates', () => {
      const newYear = new Date('2024-01-01T00:00:00')
      const newYearFormatted = formatDateTimeToLocaleString(newYear)

      expect(newYearFormatted).toMatch(/01\/01\/2024/)
      expect(newYearFormatted).toMatch(/00:00/)
    })
  })

  describe('formatDateTimeToTimeString', () => {
    it('should format Date object to time string', () => {
      const date = new Date('2024-01-15T10:30:45')
      const formatted = formatDateTimeToTimeString(date)

      expect(formatted).toBe('10:30')
    })

    it('should format date string to time string', () => {
      const dateString = '2024-01-15T14:45:30'
      const formatted = formatDateTimeToTimeString(dateString)

      expect(formatted).toBe('14:45')
    })

    it('should handle midnight time', () => {
      const midnight = new Date('2024-01-15T00:00:00')
      const formatted = formatDateTimeToTimeString(midnight)

      expect(formatted).toBe('00:00')
    })

    it('should handle noon time', () => {
      const noon = new Date('2024-01-15T12:00:00')
      const formatted = formatDateTimeToTimeString(noon)

      expect(formatted).toBe('12:00')
    })

    it('should handle late evening time', () => {
      const evening = new Date('2024-01-15T23:59:59')
      const formatted = formatDateTimeToTimeString(evening)

      expect(formatted).toBe('23:59')
    })
  })

  describe('generateSlugUrl', () => {
    it('should generate slug URL with Vietnamese dish names', () => {
      // Test actual slugify behavior
      const result1 = generateSlugUrl({ name: 'Phở Bò Tái', id: 1 })
      expect(result1).toContain('-1')
      expect(result1.toLowerCase()).toContain('pho')

      const result2 = generateSlugUrl({ name: 'Bún Bò Huế', id: 5 })
      expect(result2).toContain('-5')
      expect(result2.toLowerCase()).toContain('bun')

      const result3 = generateSlugUrl({ name: 'Cơm tấm sườn nướng', id: 10 })
      expect(result3).toContain('-10')
      expect(result3.toLowerCase()).toContain('com')
    })

    it('should handle special characters', () => {
      const result1 = generateSlugUrl({ name: 'Bánh mì & pate', id: 2 })
      expect(result1).toContain('-2')
      expect(result1.toLowerCase()).toContain('banh')

      const result2 = generateSlugUrl({ name: 'Gỏi cuốn (2 cuốn)', id: 3 })
      expect(result2).toContain('-3')
      expect(result2.toLowerCase()).toContain('goi')
    })

    it('should handle long names', () => {
      const longName = 'Cơm tấm sườn nướng chả trứng bì với nước mắm'
      const result = generateSlugUrl({ name: longName, id: 15 })
      expect(result).toContain('-15')
      expect(result.toLowerCase()).toContain('com')
    })

    it('should handle names with numbers', () => {
      const result1 = generateSlugUrl({ name: 'Combo 1 người', id: 7 })
      expect(result1).toContain('-7')
      expect(result1.toLowerCase()).toContain('combo')

      const result2 = generateSlugUrl({ name: 'Set menu 2-3 người', id: 8 })
      expect(result2).toContain('-8')
      expect(result2.toLowerCase()).toContain('set')
    })

    it('should handle different ID formats', () => {
      const result1 = generateSlugUrl({ name: 'Phở Bò', id: 999 })
      expect(result1).toContain('-999')

      const result2 = generateSlugUrl({ name: 'Test Dish', id: 0 })
      expect(result2).toContain('-0')
    })

    it('should handle edge cases', () => {
      expect(generateSlugUrl({ name: '', id: 1 })).toBe('1')

      expect(generateSlugUrl({ name: '   ', id: 2 })).toBe('2')

      // Special characters get converted by slugify
      const result = generateSlugUrl({ name: '!@#$%', id: 3 })
      expect(result).toContain('-3')
    })
  })

  describe('getIdFromSlugUrl', () => {
    it('should extract ID from valid slug URLs', () => {
      expect(getIdFromSlugUrl('pho-bo-tai-1')).toBe(1)
      expect(getIdFromSlugUrl('bun-bo-hue-5')).toBe(5)
      expect(getIdFromSlugUrl('com-tam-suon-nuong-10')).toBe(10)
    })

    it('should extract ID from complex slug URLs', () => {
      expect(getIdFromSlugUrl('com-tam-suon-nuong-cha-trung-bi-999')).toBe(999)
      expect(getIdFromSlugUrl('banh-mi-thit-nuong-pate-123')).toBe(123)
    })

    it('should handle large ID numbers', () => {
      expect(getIdFromSlugUrl('test-dish-123456789')).toBe(123456789)
    })

    it('should handle zero ID', () => {
      expect(getIdFromSlugUrl('test-dish-0')).toBe(0)
    })

    it('should handle slug with only ID', () => {
      expect(getIdFromSlugUrl('1')).toBe(1)
      expect(getIdFromSlugUrl('999')).toBe(999)
    })

    it('should handle invalid slug formats', () => {
      expect(getIdFromSlugUrl('no-id-here')).toBeNaN()
      expect(getIdFromSlugUrl('invalid-slug-abc')).toBeNaN()
      expect(getIdFromSlugUrl('')).toBeNaN()
    })

    it('should handle malformed URLs', () => {
      expect(getIdFromSlugUrl('dish-name-')).toBeNaN()
      expect(getIdFromSlugUrl('-123')).toBe(123)
      expect(getIdFromSlugUrl('dish--name--123')).toBe(123)
    })

    it('should round-trip with generateSlugUrl', () => {
      const testCases = [
        { name: 'Phở Bò Tái', id: 1 },
        { name: 'Bún Bò Huế', id: 25 },
        { name: 'Cơm tấm sườn nướng', id: 999 }
      ]

      testCases.forEach(({ name, id }) => {
        const slug = generateSlugUrl({ name, id })
        const extractedId = getIdFromSlugUrl(slug)
        expect(extractedId).toBe(id)
      })
    })
  })
})

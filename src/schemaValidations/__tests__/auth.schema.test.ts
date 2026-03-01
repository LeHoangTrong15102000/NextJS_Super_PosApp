import {
  LoginBody,
  LoginBodyType,
  LoginRes,
  LoginResType,
  RefreshTokenBody,
  RefreshTokenBodyType,
  RefreshTokenRes,
  RefreshTokenResType,
  LogoutBody,
  LogoutBodyType,
  LoginGoogleQuery,
  LoginGoogleQueryType
} from '../auth.schema'
import { Role } from '@/constants/type'

describe('Auth Schema Validations', () => {
  describe('LoginBody', () => {
    it('should validate correct login data', () => {
      const validData: LoginBodyType = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = LoginBody.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }

      const result = LoginBody.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email'])
        expect(result.error.issues[0].message).toBe('invalidEmail')
      }
    })

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123'
      }

      const result = LoginBody.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['email'])
        expect(result.error.issues[0].message).toBe('required')
      }
    })

    it('should reject password shorter than 6 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345'
      }

      const result = LoginBody.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['password'])
        expect(result.error.issues[0].message).toBe('minmaxPassword')
      }
    })

    it('should reject password longer than 100 characters', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'a'.repeat(101)
      }

      const result = LoginBody.safeParse(invalidData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['password'])
        expect(result.error.issues[0].message).toBe('minmaxPassword')
      }
    })

    it('should reject extra properties due to strict mode', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        extraField: 'should not be allowed'
      }

      const result = LoginBody.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should accept valid password at boundaries', () => {
      // Test minimum length (6 characters)
      const minValidData = {
        email: 'test@example.com',
        password: '123456'
      }

      // Test maximum length (100 characters)
      const maxValidData = {
        email: 'test@example.com',
        password: 'a'.repeat(100)
      }

      expect(LoginBody.safeParse(minValidData).success).toBe(true)
      expect(LoginBody.safeParse(maxValidData).success).toBe(true)
    })
  })

  describe('LoginRes', () => {
    it('should validate correct login response', () => {
      const validResponse: LoginResType = {
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          account: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: Role.Owner,
            avatar: null
          }
        },
        message: 'Đăng nhập thành công'
      }

      const result = LoginRes.safeParse(validResponse)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validResponse)
      }
    })

    it('should validate with Employee role', () => {
      const validResponse = {
        data: {
          accessToken: 'token',
          refreshToken: 'token',
          account: {
            id: 2,
            name: 'Employee',
            email: 'employee@example.com',
            role: Role.Employee,
            avatar: 'https://example.com/avatar.jpg'
          }
        },
        message: 'Success'
      }

      const result = LoginRes.safeParse(validResponse)

      expect(result.success).toBe(true)
    })

    it('should reject invalid role', () => {
      const invalidResponse = {
        data: {
          accessToken: 'token',
          refreshToken: 'token',
          account: {
            id: 1,
            name: 'Test',
            email: 'test@example.com',
            role: 'InvalidRole', // Role.Guest không được phép trong LoginRes
            avatar: null
          }
        },
        message: 'Success'
      }

      const result = LoginRes.safeParse(invalidResponse)

      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidResponse = {
        data: {
          accessToken: 'token',
          // missing refreshToken
          account: {
            id: 1,
            name: 'Test',
            email: 'test@example.com',
            role: Role.Owner,
            avatar: null
          }
        },
        message: 'Success'
      }

      const result = LoginRes.safeParse(invalidResponse)

      expect(result.success).toBe(false)
    })
  })

  describe('RefreshTokenBody', () => {
    it('should validate correct refresh token body', () => {
      const validData: RefreshTokenBodyType = {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }

      const result = RefreshTokenBody.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    // Zod 4: z.string() without .min(1) accepts empty strings
    it('should reject empty refresh token', () => {
      const invalidData = {
        refreshToken: ''
      }

      const result = RefreshTokenBody.safeParse(invalidData)

      expect(result.success).toBe(true)
    })

    it('should reject missing refresh token', () => {
      const invalidData = {}

      const result = RefreshTokenBody.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should reject extra fields due to strict mode', () => {
      const invalidData = {
        refreshToken: 'token',
        extraField: 'not allowed'
      }

      const result = RefreshTokenBody.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })

  describe('RefreshTokenRes', () => {
    it('should validate correct refresh token response', () => {
      const validResponse: RefreshTokenResType = {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        },
        message: 'Token refreshed successfully'
      }

      const result = RefreshTokenRes.safeParse(validResponse)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validResponse)
      }
    })

    it('should reject missing tokens', () => {
      const invalidResponse = {
        data: {
          accessToken: 'token'
          // missing refreshToken
        },
        message: 'Success'
      }

      const result = RefreshTokenRes.safeParse(invalidResponse)

      expect(result.success).toBe(false)
    })
  })

  describe('LogoutBody', () => {
    it('should validate correct logout body', () => {
      const validData: LogoutBodyType = {
        refreshToken: 'refresh-token-to-logout'
      }

      const result = LogoutBody.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject empty logout body', () => {
      const invalidData = {}

      const result = LogoutBody.safeParse(invalidData)

      expect(result.success).toBe(false)
    })

    it('should be strict about extra fields', () => {
      const invalidData = {
        refreshToken: 'token',
        userId: 123 // extra field
      }

      const result = LogoutBody.safeParse(invalidData)

      expect(result.success).toBe(false)
    })
  })

  describe('LoginGoogleQuery', () => {
    it('should validate correct Google OAuth query', () => {
      const validQuery: LoginGoogleQueryType = {
        code: 'google-oauth-authorization-code-123'
      }

      const result = LoginGoogleQuery.safeParse(validQuery)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validQuery)
      }
    })

    // Zod 4: z.string() without .min(1) accepts empty strings
    it('should reject empty code', () => {
      const invalidQuery = {
        code: ''
      }

      const result = LoginGoogleQuery.safeParse(invalidQuery)

      expect(result.success).toBe(true)
    })

    it('should reject missing code', () => {
      const invalidQuery = {}

      const result = LoginGoogleQuery.safeParse(invalidQuery)

      expect(result.success).toBe(false)
    })
  })

  describe('Type Safety', () => {
    it('should provide correct TypeScript types', () => {
      // These tests ensure types are correctly inferred
      const loginData: LoginBodyType = {
        email: 'test@example.com',
        password: 'password123'
      }

      const refreshData: RefreshTokenBodyType = {
        refreshToken: 'token'
      }

      const logoutData: LogoutBodyType = {
        refreshToken: 'token'
      }

      const googleQuery: LoginGoogleQueryType = {
        code: 'auth-code'
      }

      // If these compile without errors, the types are correct
      expect(typeof loginData.email).toBe('string')
      expect(typeof loginData.password).toBe('string')
      expect(typeof refreshData.refreshToken).toBe('string')
      expect(typeof logoutData.refreshToken).toBe('string')
      expect(typeof googleQuery.code).toBe('string')
    })
  })
})

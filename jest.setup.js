// Jest setup file
import '@testing-library/jest-dom'
import React from 'react'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn()
      }
    }
  }
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn()
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  }
}))

// Mock @/i18n/routing
jest.mock('@/i18n/routing', () => {
  const mockReact = require('react')
  return {
    useRouter() {
      return {
        push: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        prefetch: jest.fn()
      }
    },
    Link: ({ children, href, ...props }) => {
      return mockReact.createElement('a', { href, ...props }, children)
    },
    redirect: jest.fn()
  }
})

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'vi',
  useMessages: () => ({})
}))

// Mock next-intl/server
jest.mock('next-intl/server', () => ({
  getTranslations: () => Promise.resolve((key) => key),
  getLocale: () => Promise.resolve('vi'),
  getMessages: () => Promise.resolve({})
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_ENDPOINT = 'http://localhost:4000'
process.env.NEXT_PUBLIC_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'mock-google-client-id'
process.env.NEXT_PUBLIC_GOOGLE_AUTHORIZED_REDIRECT_URI = 'http://localhost:3000/vi/login/oauth'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.sessionStorage = sessionStorageMock

// Mock window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn()
}

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn()
  }))
}))

// Suppress console warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render is no longer supported')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

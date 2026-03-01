// Locale-prefixed paths used in middleware
export const MANAGE_PATHS = ['/vi/manage', '/en/manage']
export const GUEST_PATHS = ['/vi/guest', '/en/guest']
export const ONLY_OWNER_PATHS = ['/vi/manage/accounts', '/en/manage/accounts']
export const PRIVATE_PATHS = [...MANAGE_PATHS, ...GUEST_PATHS]
export const UNAUTH_PATHS = ['/vi/login', '/en/login']
export const LOGIN_PATHS = ['/vi/login', '/en/login']

// Non-locale paths used in client components
export const UNAUTHENTICATED_PATHS = ['/login', '/logout', '/refresh-token']

// API path patterns used in HTTP client interceptor
export const AUTH_API_PATHS = {
  LOGIN: ['api/auth/login', 'api/guest/auth/login'] as string[],
  LOGOUT: ['api/auth/logout', 'api/guest/auth/logout'] as string[],
  TOKEN: 'api/auth/token'
} as const


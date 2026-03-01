export const AUTH_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: true
}

export const REFRESH_CHECK_INTERVAL = 1000
export const STALE_TIME_MS = 5 * 60 * 1000
export const GC_TIME_MS = 10 * 60 * 1000
export const LOGOUT_CLEANUP_DELAY = 1000


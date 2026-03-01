import { cookies } from 'next/headers'
import { verifyTokenExpiry } from '@/lib/jwt-utils'
import { AUTH_COOKIE_OPTIONS } from '@/constants/config'

/**
 * Set both accessToken and refreshToken cookies with verified expiry.
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  const decodedAccessToken = verifyTokenExpiry(accessToken)
  const decodedRefreshToken = verifyTokenExpiry(refreshToken)

  cookieStore.set('accessToken', accessToken, {
    ...AUTH_COOKIE_OPTIONS,
    expires: decodedAccessToken.exp * 1000
  })
  cookieStore.set('refreshToken', refreshToken, {
    ...AUTH_COOKIE_OPTIONS,
    expires: decodedRefreshToken.exp * 1000
  })
}

/**
 * Remove both auth cookies.
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('accessToken')
  cookieStore.delete('refreshToken')
}


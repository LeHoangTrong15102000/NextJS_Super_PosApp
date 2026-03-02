import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { AUTH_COOKIE_OPTIONS } from '@/constants/config'

interface DecodedTokenExpiry {
  exp: number
}

/**
 * Set both accessToken and refreshToken cookies with verified expiry.
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  const decodedAccessToken = jwt.decode(accessToken) as DecodedTokenExpiry
  const decodedRefreshToken = jwt.decode(refreshToken) as DecodedTokenExpiry

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


import jwt from 'jsonwebtoken'
import { TokenPayload } from '@/types/jwt.types'
import envConfig from '@/config'

export interface DecodedTokenExpiry {
  exp: number
}

/**
 * Verify a JWT token's signature and return the decoded payload.
 * Throws if the token is invalid, expired, or has a bad signature.
 */
export function verifyToken<T = TokenPayload>(token: string, secret?: string): T {
  return jwt.verify(token, secret ?? envConfig.JWT_SECRET) as T
}

/**
 * Verify a token and extract only the expiry information.
 * Used when setting cookie expiration from token payload.
 */
export function verifyTokenExpiry(token: string, secret?: string): DecodedTokenExpiry {
  const payload = verifyToken<DecodedTokenExpiry>(token, secret)
  if (typeof payload.exp !== 'number') {
    throw new Error('Token payload missing exp field')
  }
  return payload
}


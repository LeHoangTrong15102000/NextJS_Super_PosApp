import { Role } from '@/constants/type'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { TokenPayload } from '@/types/jwt.types'
import createMiddleware from 'next-intl/middleware'
import { defaultLocale } from '@/config'
import { routing } from './i18n/routing'
import { verifyToken } from '@/lib/jwt-utils'
import {
  MANAGE_PATHS,
  GUEST_PATHS,
  ONLY_OWNER_PATHS,
  PRIVATE_PATHS,
  UNAUTH_PATHS,
  LOGIN_PATHS
} from '@/constants/routes'

const decodeToken = (token: string) => {
  return verifyToken<TokenPayload>(token)
}

type MiddlewareContext = {
  request: NextRequest
  pathname: string
  searchParams: URLSearchParams
  accessToken: string | undefined
  refreshToken: string | undefined
  locale: string
}

/** 1. Redirect unauthenticated users away from private paths */
function handlePrivateRoutes(ctx: MiddlewareContext): NextResponse | null {
  if (
    PRIVATE_PATHS.some((path) => ctx.pathname.startsWith(path)) &&
    !ctx.refreshToken
  ) {
    const url = new URL(`/${ctx.locale}/login`, ctx.request.url)
    url.searchParams.set('clearTokens', 'true')
    return NextResponse.redirect(url)
  }
  return null
}

/** 2.1 Redirect authenticated users away from login pages */
function handleAuthRedirects(ctx: MiddlewareContext): NextResponse | null {
  if (UNAUTH_PATHS.some((path) => ctx.pathname.startsWith(path))) {
    if (
      LOGIN_PATHS.some((path) => ctx.pathname.startsWith(path)) &&
      ctx.searchParams.get('clearTokens')
    ) {
      return null // Allow through — clearing tokens
    }
    return NextResponse.redirect(new URL(`/${ctx.locale}`, ctx.request.url))
  }
  return null
}

/** 2.2 Redirect to refresh-token page when access token expired */
function handleRefreshFlow(ctx: MiddlewareContext): NextResponse | null {
  if (
    PRIVATE_PATHS.some((path) => ctx.pathname.startsWith(path)) &&
    !ctx.accessToken
  ) {
    const url = new URL(`/${ctx.locale}/refresh-token`, ctx.request.url)
    url.searchParams.set('redirect', ctx.pathname)
    return NextResponse.redirect(url)
  }
  return null
}

/** 2.3 Enforce role-based access control */
function handleRoleBasedAccess(ctx: MiddlewareContext): NextResponse | null {
  const role = decodeToken(ctx.refreshToken!).role

  const isGuestGoToManagePath =
    role === Role.Guest &&
    MANAGE_PATHS.some((path) => ctx.pathname.startsWith(path))

  const isNotGuestGoToGuestPath =
    role !== Role.Guest &&
    GUEST_PATHS.some((path) => ctx.pathname.startsWith(path))

  const isNotOwnerGoToOwnerPath =
    role !== Role.Owner &&
    ONLY_OWNER_PATHS.some((path) => ctx.pathname.startsWith(path))

  if (
    isGuestGoToManagePath ||
    isNotGuestGoToGuestPath ||
    isNotOwnerGoToOwnerPath
  ) {
    return NextResponse.redirect(new URL(`/${ctx.locale}`, ctx.request.url))
  }
  return null
}

export function proxy(request: NextRequest) {
  const handleI18nRouting = createMiddleware(routing)
  const response = handleI18nRouting(request)
  const { pathname, searchParams } = request.nextUrl

  const ctx: MiddlewareContext = {
    request,
    pathname,
    searchParams,
    accessToken: request.cookies.get('accessToken')?.value,
    refreshToken: request.cookies.get('refreshToken')?.value,
    locale: request.cookies.get('NEXT_LOCALE')?.value ?? defaultLocale
  }

  // 1. Unauthenticated → block private paths
  const privateResult = handlePrivateRoutes(ctx)
  if (privateResult) return privateResult

  // 2. Authenticated flow
  if (ctx.refreshToken) {
    const authResult = handleAuthRedirects(ctx)
    if (authResult) return authResult

    const refreshResult = handleRefreshFlow(ctx)
    if (refreshResult) return refreshResult

    const roleResult = handleRoleBasedAccess(ctx)
    if (roleResult) return roleResult
  }

  return response
}

export const config = {
  matcher: ['/', '/(vi|en)/:path*']
}


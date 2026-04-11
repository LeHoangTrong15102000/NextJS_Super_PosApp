# Cơ chế Render và Hydration trong NextJS - Phân tích chi tiết (Cập nhật Next.js 16)

## 📋 Tổng quan

Dựa trên phân tích chi tiết source code của dự án **NextJS Super PosApp**, tài liệu này sẽ giải thích cơ chế render, hydration và React Server Components (RSC) trong NextJS App Router một cách đầy đủ và chính xác.

## 🏗️ Kiến trúc NextJS App Router trong dự án

### Cấu trúc thư mục và Routing

```
src/app/
├── [locale]/                    # Dynamic Route cho đa ngôn ngữ
│   ├── layout.tsx              # Root Layout (Server Component)
│   ├── (public)/               # Route Group
│   │   ├── layout.tsx          # Public Layout
│   │   ├── @modal/             # Parallel Route (Slot)
│   │   │   ├── default.tsx     # Default UI cho slot
│   │   │   └── (.)dishes/      # Intercepting Route
│   │   ├── page.tsx            # Homepage
│   │   └── dishes/[slug]/      # Dynamic Route
│   ├── guest/                  # Guest routes
│   └── manage/                 # Management routes
└── api/                        # API Routes (Route Handlers)
```

### Đặc điểm quan trọng:

1. **App Router**: Sử dụng file-system based routing
2. **Server Components**: Mặc định tất cả components là Server Components
3. **Parallel Routes**: Modal system với `@modal` slot
4. **Intercepting Routes**: Modal intercept navigation với `(.)`
5. **Internationalization**: Dynamic route `[locale]` cho đa ngôn ngữ

## 🔄 Quá trình Render trong NextJS

### 1. Initial Page Load (Request đầu tiên)

Khi user truy cập lần đầu tiên (ví dụ: `/vi/manage/dashboard`):

#### Bước 1: Proxy/Middleware Execution

> **Lưu ý về kiến trúc dự án**: Dự án PosApp dùng file `src/proxy.ts` với export function `proxy()` thay vì file `middleware.ts` chuẩn. File này được configured ở `next.config.ts` hoặc wired vào middleware pipeline. Logic proxy có 4 tầng bảo vệ: unauthenticated redirect, authenticated redirect, access token refresh redirect, và role-based access control.

```typescript
// src/proxy.ts — Middleware-equivalent cho dự án PosApp
export function proxy(request: NextRequest) {
  const handleI18nRouting = createMiddleware(routing)
  const response = handleI18nRouting(request)
  const { pathname, searchParams } = request.nextUrl

  const ctx = {
    request,
    pathname,
    searchParams,
    // Đọc token từ HTTP-only cookie (không phải localStorage)
    accessToken: request.cookies.get('accessToken')?.value,
    refreshToken: request.cookies.get('refreshToken')?.value,
    locale: request.cookies.get('NEXT_LOCALE')?.value ?? defaultLocale
  }

  // 1. Chưa đăng nhập (không có RT) + vào private path → redirect login
  if (PRIVATE_PATHS.some((p) => ctx.pathname.startsWith(p)) && !ctx.refreshToken) {
    const url = new URL(`/${ctx.locale}/login`, request.url)
    url.searchParams.set('clearTokens', 'true')
    return NextResponse.redirect(url)
  }

  if (ctx.refreshToken) {
    // 2. Đã đăng nhập mà vào trang login → redirect về home
    if (UNAUTH_PATHS.some((p) => ctx.pathname.startsWith(p))) {
      return NextResponse.redirect(new URL(`/${ctx.locale}`, request.url))
    }

    // 3. Có RT nhưng AT đã hết hạn (cookie expired) → redirect /refresh-token
    //    Client Component tại đó sẽ gọi Route Handler để refresh token
    if (PRIVATE_PATHS.some((p) => ctx.pathname.startsWith(p)) && !ctx.accessToken) {
      const url = new URL(`/${ctx.locale}/refresh-token`, request.url)
      url.searchParams.set('redirect', ctx.pathname)
      return NextResponse.redirect(url)
    }

    // 4. Decode RT để lấy role → kiểm tra quyền truy cập
    const role = verifyToken<TokenPayload>(ctx.refreshToken).role
    const isGuest = role === Role.Guest
    if (isGuest && MANAGE_PATHS.some((p) => ctx.pathname.startsWith(p))) {
      return NextResponse.redirect(new URL(`/${ctx.locale}`, request.url)) // Guest không vào /manage
    }
    if (!isGuest && GUEST_PATHS.some((p) => ctx.pathname.startsWith(p))) {
      return NextResponse.redirect(new URL(`/${ctx.locale}`, request.url)) // Staff không vào /guest
    }
  }

  return response
}

export const config = {
  matcher: ['/', '/(vi|en)/:path*']
}
```

> **Điểm quan trọng**: Middleware đọc token từ **cookie** (không phải localStorage) vì localStorage không tồn tại ở Edge/Node.js runtime. Đây là lý do cookie song song với localStorage là bắt buộc.

#### Bước 2: Server-Side Rendering (SSR)

**Root Layout Rendering:**

```typescript
// src/app/[locale]/layout.tsx - Server Component
export default async function RootLayout(props: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const params = await props.params
  const { locale } = params

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Fetch messages cho i18n
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AppProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

**Page Component Rendering:**

```typescript
// src/app/[locale]/manage/dashboard/page.tsx — Server Component
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Dynamic import: DashboardMain là Client Component nặng
// Được lazy-load để tránh block initial HTML
const DashboardMain = dynamic(() => import('./dashboard-main'), {
  loading: () => (
    <div className='space-y-4'>
      {/* Skeleton loading hiển thị trong khi JS bundle đang tải */}
      <div className='h-10 w-32 bg-gray-200 rounded animate-pulse'></div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-24 bg-gray-200 rounded animate-pulse'></div>
        ))}
      </div>
    </div>
  )
})

// Server Component: không fetch data — data được fetch bên trong DashboardMain (Client)
export default async function Dashboard() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardMain />  {/* Client Component — hydrate sau khi HTML load */}
        </CardContent>
      </Card>
    </main>
  )
}
```

> **Pattern quan trọng**: Dashboard page là Server Component nhưng **không fetch data** — nó chỉ render skeleton và dynamic-import `DashboardMain`. Toàn bộ data fetching (React Query, API calls) xảy ra bên trong `DashboardMain` ở client-side sau hydration.

#### Bước 3: HTML Generation và Response

Server NextJS sẽ:

1. **Render Server Components** thành HTML
2. **Tạo RSC Payload** cho Client Components
3. **Bundle CSS/JS** cần thiết
4. **Trả về Response** chứa:
   - HTML đầy đủ (để SEO)
   - RSC Payload (để hydration)
   - JavaScript bundles
   - CSS files

### 2. Hydration Process (Quá trình "tiếp nước")

#### Bước 1: HTML First Render

- Browser nhận HTML và hiển thị ngay (Static content)
- User có thể thấy UI nhưng chưa tương tác được

#### Bước 2: JavaScript Loading và Execution

```typescript
// src/components/app-provider.tsx - Client Component
'use client'
export default function AppProvider({ children }: { children: React.ReactNode }) {
  const setRole = useAppStore((state) => state.setRole)
  const setSocket = useAppStore((state) => state.setSocket)
  // useRef để đảm bảo effect chỉ chạy MỘT LẦN duy nhất
  // (tránh bug với React 18 StrictMode double-invocation)
  const count = useRef(0)

  useEffect(() => {
    if (count.current === 0) {
      // Restore auth state từ localStorage sau khi JS bundle load
      const accessToken = getAccessTokenFromLocalStorage()
      if (accessToken) {
        const role = decodeToken(accessToken).role
        setRole(role)
        // Khởi tạo WebSocket connection với token
        setSocket(generateSocketInstance(accessToken))  // ✅ generateSocketInstance (không phải "Instace")
      }
      count.current++
    }
  }, [setRole, setSocket])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <RefreshToken />          {/* Tự động refresh AT mỗi 1 giây */}
      <ListenLogoutSocket />    {/* Lắng nghe sự kiện logout từ server */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

#### Bước 3: React Hydration

1. **React "hydrates"** static HTML
2. **Attach event listeners**
3. **Initialize client state** (Zustand, React Query)
4. **Setup real-time connections** (Socket.io)
5. **Enable interactivity**

## 🔄 Subsequent Navigations (Navigation tiếp theo)

### Khi navigate từ `/vi/manage/dashboard` → `/vi/manage/orders`:

#### ✅ Đúng - Không trả HTML đầy đủ nữa

Server NextJS sẽ **KHÔNG** trả về HTML hoàn chỉnh, thay vào đó:

1. **RSC Payload**: Data serialized của React Server Component
2. **JavaScript chunks**: Chỉ những phần cần thiết
3. **CSS**: Incremental styles

#### ✅ Client-side Rendering

```typescript
// Navigation được handle bởi Next.js Router
import { useRouter } from '@/i18n/routing'

const router = useRouter()
router.push('/manage/orders') // Client-side navigation
```

**Quá trình:**

1. **Router captures** navigation
2. **Fetch RSC payload** từ server
3. **Client renders** component tree
4. **Update DOM** incrementally
5. **Maintain state** (không reload page)

## 🧩 React Server Components (RSC) trong dự án

### Server Components Examples

```typescript
// src/app/[locale]/(public)/page.tsx - Server Component
export default async function Home() {
  // Có thể fetch data trực tiếp
  let dishList: DishListResType['data'] = []
  try {
    const result = await dishApiRequest.list()
    dishList = result.payload.data
  } catch (error) {
    return <div>Something went wrong</div>
  }

  return (
    <div className='w-full space-y-4'>
      {/* Render data */}
      {dishList.map((dish) => (
        <DishCard key={dish.id} dish={dish} />
      ))}
    </div>
  )
}
```

### Client Components Examples

```typescript
// src/app/[locale]/guest/orders/orders-cart.tsx - Client Component
'use client'
export default function OrdersCart() {
  // Client-side data fetching với React Query
  const { data, refetch } = useGuestGetOrderListQuery()
  const socket = useAppStore((state) => state.socket)

  useEffect(() => {
    // Real-time updates
    function onUpdateOrder(data: UpdateOrderResType['data']) {
      toast({ description: `Món ${data.dishSnapshot.name} đã được cập nhật` })
      refetch()
    }

    socket?.on('update-order', onUpdateOrder)
    return () => socket?.off('update-order', onUpdateOrder)
  }, [socket, refetch])

  return <div>{/* Interactive UI */}</div>
}
```

### RSC Payload Structure

Khi navigate, server trả về RSC payload dạng:

```json
{
  "1": {
    "type": "component",
    "props": { "data": [...] },
    "children": [...]
  },
  "2": {
    "type": "element",
    "tag": "div",
    "props": { "className": "..." },
    "children": [...]
  }
}
```

## 🔄 Cơ chế Hydration Nâng cao

### 1. Progressive Hydration

Dự án sử dụng **Dynamic Imports** để tối ưu hydration:

```typescript
// src/app/[locale]/manage/dashboard/page.tsx
const DashboardMain = dynamic(() => import('./dashboard-main'), {
  loading: () => (
    <div className='space-y-4'>
      {/* Skeleton loading */}
      <div className='h-10 w-32 bg-gray-200 rounded animate-pulse'></div>
    </div>
  )
})
```

**Lợi ích:**

- ✅ **Faster initial load** - Heavy components load sau
- ✅ **Better user experience** - Show content ngay
- ✅ **Code splitting** - Giảm bundle size

### 2. Selective Hydration

```typescript
// Chart components chỉ hydrate khi cần
const RevenueLineChart = dynamic(() => import('./revenue-line-chart'), {
  ssr: false, // Không render ở server
  loading: () => <ChartSkeleton />
})
```

### 3. State Restoration

```typescript
// src/components/refresh-token.tsx — Client Component
'use client'
export default function RefreshToken() {
  const pathname = usePathname()
  const router = useRouter()
  const socket = useAppStore((state) => state.socket)
  const disconnectSocket = useAppStore((state) => state.disconnectSocket)

  useEffect(() => {
    // Không chạy ở các trang public (login, logout, refresh-token)
    if (UNAUTHENTICATED_PATHS.includes(pathname)) return

    let interval: ReturnType<typeof setInterval> | null = null

    const onRefreshToken = (force?: boolean) => {
      checkAndRefreshToken({
        onError: () => {
          if (interval) clearInterval(interval)
          disconnectSocket()          // Ngắt WebSocket khi session hết hạn
          router.push('/login')
        },
        force
      })
    }

    // Chạy ngay lập tức lần đầu tiên sau khi hydration
    onRefreshToken()
    // Kiểm tra mỗi 1 giây (REFRESH_CHECK_INTERVAL = 1000ms)
    interval = setInterval(onRefreshToken, REFRESH_CHECK_INTERVAL)

    // Lắng nghe Socket event: server có thể yêu cầu refresh ngay lập tức
    // (ví dụ: admin thay đổi quyền user)
    function onRefreshTokenSocket() {
      onRefreshToken(true)  // force=true: bỏ qua check 1/3 thời gian, refresh ngay
    }
    socket?.on('refresh-token', onRefreshTokenSocket)

    return () => {
      if (interval) clearInterval(interval)
      socket?.off('refresh-token', onRefreshTokenSocket)
    }
  }, [pathname, router, socket, disconnectSocket])

  return null  // Component này không render gì, chỉ chạy logic
}
```

> **Logic "1/3 thời gian"**: `checkAndRefreshToken` trong `src/lib/utils.ts` chỉ gọi API refresh khi AT còn lại ít hơn 1/3 tổng thời gian sống. Ví dụ AT sống 30s → refresh khi còn < 10s. Điều này đảm bảo refresh **trước khi** AT hết hạn, tránh user bị gián đoạn.
> 
> **Dual trigger**: RefreshToken được trigger qua 2 cơ chế: (1) `setInterval` proactive mỗi 1s, (2) Socket event `refresh-token` từ server cho immediate forced refresh.

## 🎯 Parallel Routes và Intercepting Routes

### Parallel Routes (@modal)

```typescript
// src/app/[locale]/(public)/layout.tsx
export default async function Layout({
  children,
  modal // Parallel route slot
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <div>
      <main>
        {children}
        {modal} {/* Render cùng lúc */}
      </main>
    </div>
  )
}
```

### Intercepting Routes (.)

```typescript
// src/app/[locale]/(public)/@modal/(.)dishes/[slug]/page.tsx
export default async function DishPage({ params }) {
  const dish = await getDishDetail(params.slug)

  return (
    <Modal>
      <DishDetail dish={dish} />
    </Modal>
  )
}
```

**Cách hoạt động:**

1. **Link click** từ `/` → `/dishes/abc`
2. **Intercepting route** bắt navigation
3. **Render modal** thay vì navigate
4. **URL vẫn thay đổi** nhưng page không reload
5. **F5 browser** → Render actual page

## 🔧 Tối ưu Performance

### 1. Bundle Splitting

```typescript
// next.config.ts (Next.js 16)
export default {
  // optimizePackageImports đã ra khỏi experimental
  optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', 'recharts'],

  // Turbopack là default bundler trong Next.js 16
  // Webpack config chỉ áp dụng khi dùng --webpack flag
  webpack: (config) => {
    config.optimization.splitChunks = {
      cacheGroups: {
        recharts: {
          test: /[\\/]node_modules[\\/]recharts[\\/]/,
          name: 'recharts',
          chunks: 'all',
          priority: 10
        }
      }
    }
  }
}
```

### 2. React Query Integration

```typescript
// src/components/app-provider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      gcTime: 10 * 60 * 1000, // 10 phút
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false
        return failureCount < 2
      }
    }
  }
})
```

### 3. Socket.io Real-time

```typescript
// src/components/app-provider.tsx
// Socket chỉ được tạo MỘT LẦN sau khi hydration hoàn tất (count.current guard)
useEffect(() => {
  if (count.current === 0) {
    const accessToken = getAccessTokenFromLocalStorage()
    if (accessToken) {
      // generateSocketInstance tạo socket.io kết nối đến Backend
      // với Authorization header chứa accessToken
      setSocket(generateSocketInstance(accessToken))  // ✅ đúng tên hàm
    }
    count.current++
  }
}, [setRole, setSocket])

// src/lib/utils.ts — generateSocketInstance
export const generateSocketInstance = (accessToken: string) => {
  return io(envConfig.NEXT_PUBLIC_API_ENDPOINT, {
    auth: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}
```

## 🔍 So sánh với nhận xét Mentor

### ✅ Những điều ĐÚNG trong nhận xét mentor:

1. **"Subsequent navigations không trả HTML"** - ✅ Chính xác
2. **"Trả RSC Payload và bundles JS/CSS"** - ✅ Đúng
3. **"Client tự render HTML"** - ✅ Chính xác
4. **"Navigation nhanh hơn"** - ✅ Đúng
5. **"Vẫn đảm bảo SEO"** - ✅ Chính xác (initial load có HTML đầy đủ)

### 📝 Bổ sung thêm:

1. **Initial load** vẫn trả HTML đầy đủ cho SEO
2. **Hydration** không chỉ dùng RSC mà còn có nhiều cơ chế khác
3. **Progressive hydration** với dynamic imports
4. **State restoration** sau hydration
5. **Selective hydration** cho performance

## 🎯 Kết luận

### NextJS App Router hoạt động theo mô hình:

1. **First Load**: SSR → HTML đầy đủ → Hydration → Interactive
2. **Navigation**: Client-side → RSC Payload → Incremental update
3. **Real-time**: Socket.io → State update → Re-render
4. **State**: Zustand (client) + React Query (server state)
5. **Caching (Next.js 16)**: Cache Components với `"use cache"` directive — explicit, opt-in caching

### Ưu điểm:

- ✅ **SEO-friendly** với SSR
- ✅ **Fast navigation** với client-side routing
- ✅ **Performance** với code splitting
- ✅ **Real-time** capabilities
- ✅ **Type safety** với TypeScript
- ✅ **Explicit caching** với Cache Components (Next.js 16)

### Thay đổi quan trọng trong Next.js 16:

- ⚠️ `src/proxy.ts` là **kiến trúc riêng của dự án PosApp** — không phải Next.js 16 feature. Dự án export function `proxy()` thay vì standard `middleware()` để tổ chức code sạch hơn.
- 🔄 `experimental.ppr` → `cacheComponents: true`
- 🔄 `experimental.turbopack` → `turbopack` (top-level, out of experimental)
- 🔄 Turbopack là default bundler trong Next.js 16
- 🆕 Cache Components với `"use cache"` directive
- 🆕 `updateTag()`, `refresh()` APIs cho cache invalidation
- 🆕 React 19.2: View Transitions, `<Activity/>`, `useEffectEvent()`

### Nhận xét của mentor về cơ bản là **CHÍNH XÁC** và phù hợp với lý thuyết NextJS App Router!

---

**Tác giả**: AI Assistant
**Dựa trên**: Phân tích chi tiết NextJS Super PosApp source code
**Cập nhật**: Tháng 3/2026 — Phù hợp với Next.js 16.x

# Phân Tích Chi Tiết: Cơ Chế Refresh Token Trong Client Component và Server Component

## Mục Lục

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Dual Storage Strategy: localStorage + Cookie](#2-dual-storage-strategy-localstorage--cookie)
3. [Client Component: Refresh Token Flow](#3-client-component-refresh-token-flow)
4. [Server Component: Refresh Token Flow](#4-server-component-refresh-token-flow)
5. [Middleware: Bảo Vệ Routes và Redirect Flow](#5-middleware-bảo-vệ-routes-và-redirect-flow)
6. [Luồng Đầy Đủ: Từ Login Đến Refresh Đến Logout](#6-luồng-đầy-đủ-từ-login-đến-refresh-đến-logout)
7. [Kỹ Thuật Chống Duplicate Request (Deduplication)](#7-kỹ-thuật-chống-duplicate-request-deduplication)
8. [Socket.io và Refresh Token](#8-socketio-và-refresh-token)
9. [Sơ Đồ Kiến Trúc Tổng Hợp](#9-sơ-đồ-kiến-trúc-tổng-hợp)
10. [Tổng Kết](#10-tổng-kết)

---

## 1. Tổng Quan Kiến Trúc

### Vấn Đề Cần Giải Quyết

Trong NextJS App Router, có **hai môi trường runtime hoàn toàn khác nhau**:

| Đặc điểm | Client Component | Server Component / Route Handler |
|-----------|-----------------|----------------------------------|
| **Chạy ở đâu** | Browser (trình duyệt) | Node.js server |
| **Truy cập được gì** | `localStorage`, `window`, DOM | `cookies()`, `headers()`, filesystem |
| **Không truy cập được** | HTTP-only cookies (qua JS) | `localStorage`, `window`, DOM |

Vấn đề lớn nhất: **Client Component không thể đọc HTTP-only cookies**, và **Server Component không thể đọc localStorage**. Vì vậy, dự án PosApp sử dụng chiến lược **lưu token ở CẢ HAI nơi**, mỗi nơi phục vụ một runtime khác nhau.

### Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                            │
│                                                                     │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ localStorage  │    │ Client Component │    │  RefreshToken    │  │
│  │              │◄───│ (đọc AT/RT từ    │    │  Component       │  │
│  │ • accessToken │    │  localStorage)   │    │  (check mỗi 1s) │  │
│  │ • refreshToken│    └──────────────────┘    └────────┬─────────┘  │
│  └──────────────┘                                      │            │
│                                                        │ gọi API   │
│  ┌──────────────────────────────────────────────────────▼─────────┐ │
│  │              HTTP Request (browser tự gửi cookie)              │ │
│  └──────────────────────────────────────────────────────┬─────────┘ │
└─────────────────────────────────────────────────────────┼───────────┘
                                                          │
┌─────────────────────────────────────────────────────────▼───────────┐
│                      NEXT.JS SERVER                                 │
│                                                                     │
│  ┌───────────────────┐    ┌──────────────────────────────────────┐  │
│  │  Route Handler    │    │  Middleware (proxy.ts)                │  │
│  │  /api/auth/       │    │  - Đọc accessToken cookie            │  │
│  │  refresh-token    │    │  - Đọc refreshToken cookie           │  │
│  │                   │    │  - Redirect nếu AT hết hạn           │  │
│  │  Đọc RT từ cookie │    │  - Check role từ RT                  │  │
│  │  Gọi Backend API  │    └──────────────────────────────────────┘  │
│  │  Set cookie mới   │                                              │
│  └─────────┬─────────┘                                              │
└────────────┼────────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────────┐
│                    BACKEND API SERVER                                │
│                                                                     │
│  POST /auth/refresh-token   { refreshToken: "..." }                 │
│  → Xác thực RT → Tạo AT + RT mới → Trả về                         │
│                                                                     │
│  POST /guest/auth/refresh-token  { refreshToken: "..." }            │
│  → Tương tự cho Guest                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dual Storage Strategy: localStorage + Cookie

### Tại Sao Cần Lưu Ở Hai Nơi?

```
┌─────────────────────────────────────────────────────┐
│              TOKEN STORAGE MATRIX                    │
│                                                     │
│  localStorage:                                      │
│  ├── accessToken   ←── Client Component đọc         │
│  └── refreshToken  ←── Client Component đọc         │
│                                                     │
│  HTTP-only Cookie:                                  │
│  ├── accessToken   ←── Server Component đọc         │
│  │                 ←── Middleware đọc                │
│  │                 ←── Route Handler đọc             │
│  └── refreshToken  ←── Server Component đọc         │
│                    ←── Middleware đọc                │
│                    ←── Route Handler đọc             │
└─────────────────────────────────────────────────────┘
```

**localStorage** phục vụ cho:
- Client Component cần đọc token để gắn vào header `Authorization` khi gọi API trực tiếp đến Backend
- `checkAndRefreshToken()` chạy trên browser decode JWT để kiểm tra thời gian hết hạn
- Socket.io authentication cần token để kết nối

**HTTP-only Cookie** phục vụ cho:
- Middleware (Edge Runtime) kiểm tra authentication và phân quyền role
- Route Handler đọc refreshToken để gọi Backend API refresh
- Bảo mật hơn vì JavaScript ở browser không đọc được HTTP-only cookie (chống XSS)

### Nơi Token Được Lưu Vào localStorage

File `src/lib/http.ts` - HTTP client interceptor:

```typescript
if (isClient) {
  const normalizeUrl = normalizePath(url)
  if (AUTH_API_PATHS.LOGIN.includes(normalizeUrl)) {
    // Khi login thành công, lưu token vào localStorage
    const { accessToken, refreshToken } = (payload as LoginResType).data
    setAccessTokenToLocalStorage(accessToken)
    setRefreshTokenToLocalStorage(refreshToken)
  } else if (AUTH_API_PATHS.TOKEN === normalizeUrl) {
    // Khi set token (OAuth flow), lưu token vào localStorage
    const { accessToken, refreshToken } = payload as {
      accessToken: string
      refreshToken: string
    }
    setAccessTokenToLocalStorage(accessToken)
    setRefreshTokenToLocalStorage(refreshToken)
  } else if (AUTH_API_PATHS.LOGOUT.includes(normalizeUrl)) {
    // Khi logout, xóa token khỏi localStorage
    removeTokensFromLocalStorage()
  }
}
```

Đoạn code này hoạt động như một **interceptor** (bộ chặn) - nó tự động xử lý token sau mỗi response mà không cần component phải làm gì thêm.

### Nơi Token Được Lưu Vào Cookie

File `src/lib/cookie-utils.ts`:

```typescript
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  const decodedAccessToken = verifyTokenExpiry(accessToken)
  const decodedRefreshToken = verifyTokenExpiry(refreshToken)

  cookieStore.set('accessToken', accessToken, {
    path: '/',
    httpOnly: true,        // JavaScript không đọc được
    sameSite: 'strict',    // Chống CSRF
    secure: true,          // Chỉ gửi qua HTTPS
    expires: decodedAccessToken.exp * 1000   // Hết hạn theo JWT exp
  })
  cookieStore.set('refreshToken', refreshToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    expires: decodedRefreshToken.exp * 1000
  })
}
```

Hàm `setAuthCookies` chỉ được gọi **ở server side** (Route Handlers), vì `cookies()` là API của NextJS chỉ hoạt động trên server. Cookie được set với `httpOnly: true` nghĩa là client-side JavaScript **hoàn toàn không thể đọc** được cookie này.

---

## 3. Client Component: Refresh Token Flow

### 3.1. Component `RefreshToken` - Trái Tim Của Cơ Chế Client-Side

File `src/components/refresh-token.tsx`:

```
┌──────────────────────────────────────────────────────────┐
│           RefreshToken Component Lifecycle                │
│                                                          │
│  Mount ──► Kiểm tra pathname có cần auth không?          │
│            │                                             │
│            ├── Pathname = /login, /logout, /refresh-token │
│            │   → SKIP (không cần refresh)                │
│            │                                             │
│            └── Pathname = /manage/*, /guest/*             │
│                │                                         │
│                ├── Gọi checkAndRefreshToken() NGAY LẬP TỨC│
│                │                                         │
│                ├── Đặt setInterval (mỗi 1 giây)          │
│                │   └── Gọi checkAndRefreshToken() lặp lại│
│                │                                         │
│                └── Lắng nghe Socket event "refresh-token" │
│                    └── Gọi checkAndRefreshToken(force)   │
│                                                          │
│  Unmount ──► clearInterval + off socket listeners        │
└──────────────────────────────────────────────────────────┘
```

Component này được render bởi `AppProvider` (trong layout gốc), nên nó **luôn tồn tại trên mọi trang** khi app đang chạy. Nó render `null` - không hiển thị gì trên giao diện, chỉ chạy logic.

### 3.2. Hàm `checkAndRefreshToken` - Logic Kiểm Tra và Refresh

File `src/lib/utils.ts`:

```
┌───────────────────────────────────────────────────────────┐
│             checkAndRefreshToken() Flow                    │
│                                                           │
│  START                                                    │
│    │                                                      │
│    ▼                                                      │
│  Lấy AT + RT từ localStorage                              │
│    │                                                      │
│    ├── AT hoặc RT = null → RETURN (chưa đăng nhập)        │
│    │                                                      │
│    ▼                                                      │
│  Decode cả AT và RT (dùng jwt-decode, không verify)       │
│    │                                                      │
│    ▼                                                      │
│  Tính thời gian hiện tại: now = Date.now() / 1000         │
│    │                                                      │
│    ├── RT.exp <= now → RT đã hết hạn                      │
│    │   → Xóa token khỏi localStorage                     │
│    │   → Gọi onError() (redirect về /login)               │
│    │   → RETURN                                           │
│    │                                                      │
│    ▼                                                      │
│  Kiểm tra AT cần refresh chưa:                            │
│                                                           │
│  Thời gian còn lại = AT.exp - now                         │
│  Tổng thời gian sống = AT.exp - AT.iat                    │
│                                                           │
│  Nếu force=true HOẶC (thời gian còn lại < 1/3 tổng):     │
│    │                                                      │
│    ├── Role = Guest → guestApiRequest.refreshToken()      │
│    │                                                      │
│    └── Role != Guest → authApiRequest.refreshToken()      │
│         │                                                 │
│         ▼                                                 │
│    API trả về AT mới + RT mới                             │
│         │                                                 │
│         ▼                                                 │
│    Lưu AT + RT mới vào localStorage                       │
│    (Cookie cũng đã được Route Handler cập nhật)           │
│         │                                                 │
│         ▼                                                 │
│    Gọi onSuccess()                                        │
│                                                           │
│  Nếu thời gian còn lại >= 1/3 tổng:                      │
│    → SKIP (AT vẫn còn dùng tốt, chưa cần refresh)        │
└───────────────────────────────────────────────────────────┘
```

**Điểm quan trọng về rule "1/3 thời gian":**

Ví dụ Access Token có thời gian sống là 30 giây:
- Từ 0s - 20s: AT vẫn còn dùng tốt, không cần refresh
- Từ 20s - 30s: Còn < 1/3 (10s) → Trigger refresh
- Khi refresh, AT mới sẽ có thêm 30s nữa

Điều này đảm bảo token được refresh **trước khi hết hạn**, tránh việc user bị gián đoạn.

### 3.3. Luồng API Client → Route Handler → Backend

Khi `checkAndRefreshToken` cần refresh, nó gọi API theo chuỗi:

```
Browser (Client Component)
    │
    │  POST /api/auth/refresh-token   (không gửi body)
    │  Cookie: accessToken=...; refreshToken=...  (browser TỰ ĐỘNG gửi)
    │
    ▼
Next.js Route Handler (src/app/api/auth/refresh-token/route.ts)
    │
    │  1. Đọc refreshToken từ cookie
    │  2. Gọi Backend API:
    │     POST /auth/refresh-token  { refreshToken: "..." }
    │
    ▼
Backend API Server
    │
    │  1. Xác thực refreshToken
    │  2. Tạo accessToken mới + refreshToken mới
    │  3. Trả về: { data: { accessToken, refreshToken } }
    │
    ▼
Next.js Route Handler
    │
    │  1. Nhận AT + RT mới từ Backend
    │  2. Gọi setAuthCookies(AT, RT) → Set HTTP-only cookie mới
    │  3. Trả JSON response về browser
    │
    ▼
Browser (HTTP client interceptor trong http.ts)
    │
    │  Response đi qua interceptor, nhưng URL là /api/auth/refresh-token
    │  → Không match LOGIN hay TOKEN paths → Không tự set localStorage
    │
    ▼
Hàm checkAndRefreshToken (trong utils.ts)
    │
    │  Nhận response → Tự lưu AT + RT mới vào localStorage:
    │  setAccessTokenToLocalStorage(res.payload.data.accessToken)
    │  setRefreshTokenToLocalStorage(res.payload.data.refreshToken)
```

**Tại sao Client không gọi trực tiếp Backend API?** Vì cần Route Handler làm trung gian để:
1. Đọc refreshToken từ HTTP-only cookie (client JS không đọc được)
2. Set cookie mới sau khi refresh (cần server-side `cookies()` API)
3. Giữ cookie và localStorage đồng bộ

---

## 4. Server Component: Refresh Token Flow

### 4.1. Route Handler Refresh Token

File `src/app/api/auth/refresh-token/route.ts`:

```typescript
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (!refreshToken) {
    return createApiResponse({ message: 'Không tìm thấy refreshToken' }, 401)
  }

  try {
    // Gọi trực tiếp Backend API (server-to-server, không qua browser)
    const { payload } = await authApiRequest.sRefreshToken({ refreshToken })

    // Set cookie mới cho cả AT và RT
    await setAuthCookies(payload.data.accessToken, payload.data.refreshToken)

    // Trả response về cho client (client sẽ tự lưu vào localStorage)
    return Response.json(payload)
  } catch (error) {
    return createApiResponse({ message }, 401)
  }
}
```

**Luồng hoạt động:**

```
Route Handler (Server)
    │
    ├── 1. cookies().get('refreshToken')
    │      → Đọc RT từ HTTP-only cookie
    │
    ├── 2. authApiRequest.sRefreshToken({ refreshToken })
    │      → Gọi Backend: POST /auth/refresh-token
    │      → Gửi RT trong body request
    │      → Nhận lại AT mới + RT mới
    │
    ├── 3. setAuthCookies(newAT, newRT)
    │      → Cập nhật cả 2 cookie với token mới
    │      → Cookie expires được tính từ JWT exp
    │
    └── 4. Response.json(payload)
           → Trả response về browser
           → Browser code sẽ lưu vào localStorage
```

### 4.2. Sự Khác Biệt: sRefreshToken vs refreshToken

Trong `src/apiRequests/auth.ts`, có **2 hàm refresh khác nhau** cho 2 context khác nhau:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     API Request Methods                             │
│                                                                     │
│  sRefreshToken (server-side)                                        │
│  ├── Gọi trực tiếp đến Backend: POST /auth/refresh-token           │
│  ├── Gửi refreshToken trong body: { refreshToken: "..." }          │
│  ├── Dùng bởi: Route Handler                                       │
│  └── baseUrl: envConfig.NEXT_PUBLIC_API_ENDPOINT (Backend URL)      │
│                                                                     │
│  refreshToken (client-side)                                         │
│  ├── Gọi đến Next.js Route Handler: POST /api/auth/refresh-token   │
│  ├── KHÔNG gửi body (Route Handler tự đọc cookie)                  │
│  ├── Dùng bởi: checkAndRefreshToken() trên browser                 │
│  ├── baseUrl: '' (gọi đến cùng origin = Next.js server)            │
│  └── CÓ deduplication logic (xem phần 7)                           │
└─────────────────────────────────────────────────────────────────────┘
```

Pattern tương tự áp dụng cho Guest:

| Method | Endpoint | Gọi bởi ai | Gửi gì |
|--------|----------|-------------|---------|
| `authApiRequest.sRefreshToken()` | `POST /auth/refresh-token` | Route Handler (server) | `{ refreshToken }` trong body |
| `authApiRequest.refreshToken()` | `POST /api/auth/refresh-token` | Client Component (browser) | Không gửi body, cookie tự gửi |
| `guestApiRequest.sRefreshToken()` | `POST /guest/auth/refresh-token` | Route Handler (server) | `{ refreshToken }` trong body |
| `guestApiRequest.refreshToken()` | `POST /api/guest/auth/refresh-token` | Client Component (browser) | Không gửi body, cookie tự gửi |

### 4.3. Hàm sLogin và sLogout (Server-Side)

Ngoài refresh, login và logout cũng có pattern tương tự:

```
Login Flow (Server-Side):
  authApiRequest.sLogin(body)
    → POST /auth/login  (đến Backend)
    → Backend trả về { accessToken, refreshToken, account }

Logout Flow (Server-Side):
  authApiRequest.sLogout({ accessToken, refreshToken })
    → POST /auth/logout
    → Gửi refreshToken trong body + accessToken trong header
    → Backend invalidate cả 2 token
```

---

## 5. Middleware: Bảo Vệ Routes và Redirect Flow

### 5.1. Middleware Logic

File `src/proxy.ts` chứa logic middleware:

```
┌───────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE FLOW                             │
│                                                               │
│  Request vào ──► Đọc cookies: AT + RT + NEXT_LOCALE           │
│       │                                                       │
│       ▼                                                       │
│  ┌─ STEP 1: handlePrivateRoutes ─────────────────────────┐   │
│  │  Path = /manage/* hoặc /guest/* ?                     │   │
│  │  └── Có RT? → OK, tiếp tục                           │   │
│  │  └── Không có RT? → Redirect về /login?clearTokens=true│  │
│  └───────────────────────────────────────────────────────┘   │
│       │                                                       │
│       ▼ (nếu có RT)                                           │
│  ┌─ STEP 2.1: handleAuthRedirects ──────────────────────┐   │
│  │  Path = /login ?                                      │   │
│  │  └── Có clearTokens param? → Cho qua (đang logout)   │   │
│  │  └── Không? → Redirect về / (đã đăng nhập rồi)       │   │
│  └───────────────────────────────────────────────────────┘   │
│       │                                                       │
│       ▼                                                       │
│  ┌─ STEP 2.2: handleRefreshFlow ────────────────────────┐   │
│  │  Path = private path VÀ KHÔNG có AT?                  │   │
│  │  (Có RT nhưng AT đã hết hạn/cookie expired)           │   │
│  │  └── Redirect đến /refresh-token?redirect={pathname}  │   │
│  └───────────────────────────────────────────────────────┘   │
│       │                                                       │
│       ▼                                                       │
│  ┌─ STEP 2.3: handleRoleBasedAccess ────────────────────┐   │
│  │  Decode RT → lấy role                                 │   │
│  │  ├── Guest đi vào /manage/* ? → Redirect về /         │   │
│  │  ├── Non-Guest đi vào /guest/* ? → Redirect về /      │   │
│  │  └── Non-Owner đi vào /manage/accounts ? → Redirect / │   │
│  └───────────────────────────────────────────────────────┘   │
│       │                                                       │
│       ▼                                                       │
│  Response (cho phép request đi tiếp)                          │
└───────────────────────────────────────────────────────────────┘
```

### 5.2. Trang /refresh-token - Cầu Nối Giữa Middleware và Client

Khi middleware phát hiện **có RT nhưng không có AT** (AT cookie đã hết hạn), nó redirect đến `/refresh-token`. Trang này hoạt động như sau:

File `src/app/[locale]/(public)/(auth)/refresh-token/page.tsx` (Server Component):

```typescript
// Server Component - chỉ render wrapper
export default function RefreshTokenPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RefreshToken />    {/* Client Component bên trong */}
    </Suspense>
  )
}
```

File `src/app/[locale]/(public)/(auth)/refresh-token/refresh-token.tsx` (Client Component):

```
┌──────────────────────────────────────────────────────────┐
│           /refresh-token Page Flow                        │
│                                                          │
│  1. Middleware redirect đến đây với ?redirect=/manage/..  │
│     (vì AT cookie hết hạn nhưng RT cookie vẫn còn)       │
│                                                          │
│  2. Client Component mount                                │
│     │                                                    │
│     ├── Đọc RT từ localStorage                           │
│     │   (nếu có → RT vẫn hợp lệ ở client)               │
│     │                                                    │
│     ├── Gọi checkAndRefreshToken()                       │
│     │   → API: POST /api/auth/refresh-token              │
│     │   → Route Handler đọc RT từ cookie                 │
│     │   → Backend trả AT + RT mới                        │
│     │   → Route Handler set cookie mới                   │
│     │   → Client lưu vào localStorage                    │
│     │                                                    │
│     └── onSuccess: router.push(redirectPathname || '/')  │
│         → Navigate về trang ban đầu                      │
│         → Middleware lần này thấy AT cookie hợp lệ       │
│         → Cho phép truy cập                              │
│                                                          │
│  3. Nếu không có RT trong localStorage                   │
│     → router.push('/') (về trang chủ)                    │
└──────────────────────────────────────────────────────────┘
```

**Tại sao cần trang /refresh-token riêng?**

Middleware chạy ở Edge Runtime - nó **không thể gọi Backend API** phức tạp (có những hạn chế về runtime). Thay vào đó:
1. Middleware detect AT hết hạn
2. Redirect sang trang `/refresh-token`
3. Client Component trên trang đó thực hiện refresh qua Route Handler
4. Sau khi refresh thành công, redirect về trang ban đầu

---

## 6. Luồng Đầy Đủ: Từ Login Đến Refresh Đến Logout

### 6.1. Login Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ User nhập email/password → Submit form                           │
│   │                                                              │
│   ▼                                                              │
│ Client Component gọi: authApiRequest.login(body)                 │
│   │  POST /api/auth/login  (Next.js Route Handler)               │
│   │                                                              │
│   ▼                                                              │
│ Route Handler (src/app/api/auth/login/route.ts):                 │
│   ├── Validate body với Zod schema                               │
│   ├── Gọi Backend: authApiRequest.sLogin(body)                   │
│   │   → POST /auth/login → Backend trả { AT, RT, account }      │
│   ├── setAuthCookies(AT, RT)  ←── LƯU VÀO COOKIE               │
│   └── Response.json(payload)                                     │
│   │                                                              │
│   ▼                                                              │
│ HTTP Client Interceptor (http.ts):                               │
│   URL match AUTH_API_PATHS.LOGIN                                 │
│   ├── setAccessTokenToLocalStorage(AT)  ←── LƯU VÀO LOCALSTORAGE│
│   └── setRefreshTokenToLocalStorage(RT)                          │
│   │                                                              │
│   ▼                                                              │
│ Login Form Component:                                            │
│   ├── setRole(role)  → Zustand store                             │
│   ├── setSocket(...)  → Kết nối WebSocket                        │
│   └── router.push('/manage/dashboard')                           │
│                                                                  │
│ KẾT QUẢ: Token lưu ở CẢ localStorage VÀ cookie                 │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2. OAuth Login Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ User click "Đăng nhập với Google"                                │
│   │                                                              │
│   ▼                                                              │
│ Redirect đến Backend OAuth → Google → Callback                   │
│ Backend redirect về: /login/oauth?accessToken=...&refreshToken=..│
│   │                                                              │
│   ▼                                                              │
│ OAuth Client Component (oauth.tsx):                              │
│   ├── Đọc AT + RT từ URL search params                          │
│   ├── Gọi: authApiRequest.setTokenToCookie({ AT, RT })          │
│   │   → POST /api/auth/token                                    │
│   │   → Route Handler gọi setAuthCookies(AT, RT)                │
│   │   → LƯU VÀO COOKIE                                         │
│   │                                                              │
│   ▼                                                              │
│ HTTP Client Interceptor:                                         │
│   URL match AUTH_API_PATHS.TOKEN                                 │
│   ├── setAccessTokenToLocalStorage(AT)  ←── LƯU VÀO LOCALSTORAGE│
│   └── setRefreshTokenToLocalStorage(RT)                          │
│   │                                                              │
│   ▼                                                              │
│ OAuth Component:                                                 │
│   ├── setRole(role)                                              │
│   ├── setSocket(...)                                             │
│   └── router.push('/manage/dashboard')                           │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3. Automatic Refresh Flow (Trong Khi Sử Dụng App)

```
┌──────────────────────────────────────────────────────────────────┐
│ User đang sử dụng app (ví dụ: /manage/orders)                   │
│                                                                  │
│ RefreshToken Component chạy mỗi 1 giây:                         │
│   │                                                              │
│   ▼                                                              │
│ checkAndRefreshToken():                                          │
│   ├── Đọc AT từ localStorage → decode                            │
│   ├── AT còn > 2/3 thời gian → SKIP (chưa cần refresh)          │
│   │                                                              │
│   │  ... (sau nhiều lần check) ...                               │
│   │                                                              │
│   ├── AT còn < 1/3 thời gian → CẦN REFRESH!                     │
│   │   │                                                          │
│   │   ▼                                                          │
│   │  authApiRequest.refreshToken()                               │
│   │   → POST /api/auth/refresh-token (đến Route Handler)        │
│   │   → Route Handler đọc RT từ cookie                          │
│   │   → Backend verify RT → trả AT mới + RT mới                 │
│   │   → Route Handler set cookie mới                            │
│   │   → Trả response về browser                                 │
│   │   │                                                          │
│   │   ▼                                                          │
│   │  Lưu AT + RT mới vào localStorage                            │
│   │                                                              │
│   └── User KHÔNG bị gián đoạn, session tiếp tục                 │
│                                                                  │
│ Quá trình này lặp lại mãi cho đến khi:                          │
│   • User logout                                                  │
│   • RefreshToken hết hạn                                         │
│   • App bị đóng                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4. Logout Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ CASE 1: User click "Đăng xuất"                                  │
│   │                                                              │
│   ▼                                                              │
│ authApiRequest.logout()                                          │
│   POST /api/auth/logout (Route Handler)                          │
│   │                                                              │
│   ▼                                                              │
│ Route Handler:                                                   │
│   ├── Đọc AT + RT từ cookie                                     │
│   ├── clearAuthCookies()  → Xóa cookie                          │
│   ├── authApiRequest.sLogout({ AT, RT })                         │
│   │   → POST /auth/logout (Backend)                              │
│   │   → Backend invalidate RT                                   │
│   └── Response                                                   │
│   │                                                              │
│   ▼                                                              │
│ HTTP Client Interceptor:                                         │
│   URL match AUTH_API_PATHS.LOGOUT                                │
│   └── removeTokensFromLocalStorage()  → Xóa localStorage        │
│   │                                                              │
│   ▼                                                              │
│ Component:                                                       │
│   ├── setRole(undefined)  → Zustand                              │
│   ├── disconnectSocket()  → Ngắt WebSocket                      │
│   └── router.push('/')                                           │
│                                                                  │
│ KẾT QUẢ: Token bị xóa ở CẢ localStorage, cookie, VÀ backend    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ CASE 2: Bị kick bởi 401 Error                                   │
│   │                                                              │
│   ▼                                                              │
│ HTTP Client Interceptor phát hiện res.status === 401:            │
│   ├── Gọi POST /api/auth/logout (cleanup)                       │
│   ├── removeTokensFromLocalStorage()                             │
│   └── location.href = '/login' (hard redirect)                  │
│                                                                  │
│ CASE 3: Socket event "logout" (bị logout từ server/admin)       │
│   │                                                              │
│   ▼                                                              │
│ ListenLogoutSocket component nhận event:                         │
│   ├── authApiRequest.logout()                                    │
│   ├── setRole(undefined)                                         │
│   ├── disconnectSocket()                                         │
│   └── router.push('/')                                           │
└──────────────────────────────────────────────────────────────────┘
```

### 6.5. Change Password Flow (Đặc Biệt)

Khi đổi mật khẩu, Backend sẽ trả về token mới (vì token cũ bị invalidate):

```
┌──────────────────────────────────────────────────────────────────┐
│ User đổi mật khẩu thành công                                    │
│   │                                                              │
│   ▼                                                              │
│ Route Handler /api/accounts/change-password-v2:                  │
│   ├── Gọi Backend API → nhận AT mới + RT mới                    │
│   ├── setAuthCookies(newAT, newRT)  → Cập nhật cookie            │
│   └── Response.json(payload)                                     │
│   │                                                              │
│   ▼                                                              │
│ ChangePasswordForm (Client Component):                           │
│   ├── setAccessTokenToLocalStorage(newAT)  → Cập nhật localStorage│
│   └── setRefreshTokenToLocalStorage(newRT)                       │
│                                                                  │
│ → Token cũ bị invalidate ở backend, token mới hoạt động ở cả 2  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 7. Kỹ Thuật Chống Duplicate Request (Deduplication)

### Vấn Đề

`checkAndRefreshToken()` chạy **mỗi 1 giây**. Nếu refresh API mất 500ms để hoàn thành, trong khoảng thời gian đó, interval sẽ gọi thêm 1 lần nữa → **2 request refresh cùng lúc** → Backend có thể reject request thứ 2 vì RT đã bị sử dụng.

### Giải Pháp: Promise Caching

File `src/apiRequests/auth.ts`:

```typescript
const authApiRequest = {
  // Biến lưu promise đang chạy
  refreshTokenRequest: null as Promise<{ status: number; payload: RefreshTokenResType }> | null,

  async refreshToken() {
    // Nếu đã có request đang chạy → trả về CÙNG promise đó
    if (this.refreshTokenRequest) {
      return this.refreshTokenRequest
    }

    // Tạo request mới và lưu promise
    this.refreshTokenRequest = http.post<RefreshTokenResType>(
      '/api/auth/refresh-token',
      null,
      { baseUrl: '' }
    )

    // Chờ kết quả
    const result = await this.refreshTokenRequest

    // Reset để lần sau tạo request mới
    this.refreshTokenRequest = null

    return result
  }
}
```

**Cách hoạt động:**

```
Timeline:  0ms    100ms   200ms   500ms
           │       │       │       │
Call 1 ────┤       │       │       │
           │  API request đang chạy...     ──────► Response
           │       │       │       │
Call 2 ────────────┤       │       │
           │  Thấy refreshTokenRequest     │
           │  !== null → return cùng       │
           │  promise → chờ cùng kết quả   ──────► Cùng Response
           │       │       │       │
Call 3 ────────────────────┤       │
           │  Tương tự → return cùng       │
           │  promise                      ──────► Cùng Response
```

Kỹ thuật này gọi là **Promise deduplication** - nhiều caller nhận cùng một kết quả từ một request duy nhất.

---

## 8. Socket.io và Refresh Token

### Socket Event "refresh-token"

Backend có thể gửi event `refresh-token` qua WebSocket để **yêu cầu client refresh ngay lập tức**:

```
Backend Server
    │
    │  socket.emit('refresh-token')
    │  (ví dụ: khi admin thay đổi quyền user)
    │
    ▼
Browser - RefreshToken Component
    │
    │  socket.on('refresh-token', () => {
    │    onRefreshToken(true)   // force = true
    │  })
    │
    ▼
checkAndRefreshToken({ force: true })
    │
    │  force = true → Bỏ qua check 1/3 thời gian
    │  → Refresh ngay lập tức
    │
    ▼
AT + RT mới được lưu cả localStorage và cookie
```

### Socket Authentication

Socket.io kết nối với Backend sử dụng accessToken:

```typescript
// src/lib/utils.ts
export const generateSocketInstance = (accessToken: string) => {
  return io(envConfig.NEXT_PUBLIC_API_ENDPOINT, {
    auth: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}
```

Socket được tạo **một lần duy nhất** khi app khởi động (trong `AppProvider`), và lưu trong Zustand store. Khi token được refresh, socket **không tự động reconnect** với token mới - nhưng vì socket connection đã established, nó tiếp tục hoạt động cho đến khi bị disconnect.

---

## 9. Sơ Đồ Kiến Trúc Tổng Hợp

### Toàn Bộ Hệ Thống Token Management

```
┌────────────────────────────────────────────────────────────────────────┐
│                            BROWSER                                     │
│                                                                        │
│  ┌──── Zustand Store ────┐  ┌──── localStorage ────┐                  │
│  │ isAuth: true          │  │ accessToken: "eyJ..." │                  │
│  │ role: "Owner"         │  │ refreshToken: "eyJ..."│                  │
│  │ socket: Socket        │  └──────────┬────────────┘                  │
│  └───────────────────────┘             │                               │
│                                        │ đọc                           │
│  ┌─────────────────────────────────────▼───────────────────────────┐   │
│  │                    AppProvider (Client Component)                │   │
│  │                                                                 │   │
│  │   ┌─────────────┐  ┌───────────────────┐  ┌─────────────────┐  │   │
│  │   │ QueryClient  │  │ RefreshToken      │  │ ListenLogout    │  │   │
│  │   │ Provider     │  │ Component         │  │ Socket          │  │   │
│  │   │              │  │                   │  │                 │  │   │
│  │   │ Quản lý      │  │ • setInterval 1s  │  │ • socket.on     │  │   │
│  │   │ server state │  │ • check AT expiry │  │   ('logout')    │  │   │
│  │   │ + caching    │  │ • auto refresh    │  │ • force logout  │  │   │
│  │   │              │  │ • socket listener │  │                 │  │   │
│  │   └──────────────┘  └────────┬──────────┘  └─────────────────┘  │   │
│  │                              │                                   │   │
│  └──────────────────────────────┼───────────────────────────────────┘   │
│                                 │                                       │
│  ┌──────────────────────────────▼───────────────────────────────────┐   │
│  │                      HTTP Client (http.ts)                       │   │
│  │                                                                  │   │
│  │  Request:  Tự gắn Authorization: Bearer {AT từ localStorage}     │   │
│  │  Response: Interceptor tự xử lý login/logout/token paths         │   │
│  │  Error:    401 → auto logout + redirect /login                   │   │
│  └──────────────────────────────┬───────────────────────────────────┘   │
│                                 │                                       │
│               Cookie tự động gửi theo mỗi request                      │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                        NEXT.JS SERVER                                   │
│                                                                         │
│  ┌─ Middleware (proxy.ts) ───────────────────────────────────────────┐  │
│  │  Chạy ĐẦU TIÊN trước mọi request                                │  │
│  │  • Đọc AT + RT cookie                                            │  │
│  │  • No RT + private path → redirect /login                        │  │
│  │  • RT + no AT + private path → redirect /refresh-token           │  │
│  │  • RT → decode role → check quyền truy cập                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Route Handlers ─────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  POST /api/auth/login          → sLogin → setAuthCookies         │  │
│  │  POST /api/auth/logout         → clearCookies → sLogout          │  │
│  │  POST /api/auth/refresh-token  → đọc RT cookie → sRefreshToken   │  │
│  │                                  → setAuthCookies (cả AT + RT)   │  │
│  │  POST /api/auth/token          → setAuthCookies (OAuth flow)     │  │
│  │                                                                   │  │
│  │  POST /api/guest/auth/login          → tương tự cho guest        │  │
│  │  POST /api/guest/auth/logout         → tương tự cho guest        │  │
│  │  POST /api/guest/auth/refresh-token  → tương tự cho guest        │  │
│  │                                                                   │  │
│  │  PUT /api/accounts/change-password-v2 → setAuthCookies mới       │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Server Components ──────────────────────────────────────────────┐  │
│  │  • Không trực tiếp xử lý refresh token                          │  │
│  │  • Có thể đọc cookie qua cookies() nếu cần check auth           │  │
│  │  • Nếu gọi API backend mà bị 401 → redirect /login              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Server-to-Server API calls
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                        BACKEND API SERVER                               │
│                                                                         │
│  POST /auth/login          → Tạo AT + RT → Trả về                      │
│  POST /auth/logout         → Invalidate RT                              │
│  POST /auth/refresh-token  → Verify RT → Tạo AT + RT mới → Trả về     │
│                                                                         │
│  POST /guest/auth/login          → Tương tự cho guest                   │
│  POST /guest/auth/logout         → Tương tự cho guest                   │
│  POST /guest/auth/refresh-token  → Tương tự cho guest                   │
│                                                                         │
│  WebSocket: emit 'refresh-token' → Yêu cầu client refresh ngay         │
│  WebSocket: emit 'logout' → Yêu cầu client logout ngay                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Bảng Tóm Tắt: Ai Đọc/Ghi Token Ở Đâu

| Thao tác | localStorage | Cookie | Ai thực hiện |
|----------|-------------|--------|--------------|
| Login - Lưu token | http.ts interceptor GHI | Route Handler GHI | Client + Server |
| Refresh - Đọc RT | checkAndRefreshToken ĐỌC | Route Handler ĐỌC | Client + Server |
| Refresh - Lưu token mới | checkAndRefreshToken GHI | Route Handler GHI | Client + Server |
| Logout - Xóa token | http.ts interceptor XÓA | Route Handler XÓA | Client + Server |
| Middleware - Check auth | N/A | Middleware ĐỌC | Server only |
| HTTP request - Gắn header | http.ts ĐỌC AT | Browser tự gửi cookie | Client |
| Change password - Cập nhật | Component GHI | Route Handler GHI | Client + Server |
| OAuth - Lưu token | http.ts interceptor GHI | Route Handler GHI | Client + Server |

---

## 10. Tổng Kết

### Những Điểm Hay Của Kiến Trúc Này

1. **Dual storage đồng bộ**: Token luôn được lưu ở cả localStorage và cookie, phục vụ cả hai runtime environment

2. **Route Handler làm proxy**: Client Component không bao giờ gọi trực tiếp Backend API cho auth operations - luôn qua Route Handler để đồng bộ cookie

3. **Proactive refresh**: Refresh token **trước khi AT hết hạn** (rule 1/3 thời gian) thay vì đợi 401 error

4. **Deduplication**: Promise caching ngăn multiple refresh requests chồng chéo

5. **Middleware protection**: Bảo vệ routes ở Edge level trước khi request đến app code

6. **Socket integration**: Backend có thể force refresh token qua WebSocket event

7. **Guest/Staff separation**: Hai luồng auth riêng biệt với cùng cơ chế, phân biệt bởi role trong JWT

### Luồng Tóm Gọn Nhất

```
CLIENT COMPONENT muốn refresh:
  → checkAndRefreshToken()
  → gọi POST /api/auth/refresh-token (Route Handler)
  → Route Handler đọc RT từ COOKIE, gọi Backend
  → Backend trả token mới
  → Route Handler set COOKIE mới
  → Client lưu LOCALSTORAGE mới
  → Cả hai nơi đều có token mới ✓

SERVER (Middleware) cần check auth:
  → Đọc RT từ COOKIE
  → Decode để lấy role
  → Quyết định redirect hoặc cho qua

SERVER (Route Handler) cần gọi Backend API có auth:
  → Đọc AT từ COOKIE
  → Gắn vào Authorization header
  → Gọi Backend API trực tiếp
```

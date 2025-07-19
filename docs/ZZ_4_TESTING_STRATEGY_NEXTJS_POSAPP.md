# CHIẾN LƯỢC TESTING CHO NEXTJS POSAPP

## 📋 TỔNG QUAN DỰ ÁN

**NextJS Super PosApp** là một ứng dụng Point of Sale (POS) quản lý nhà hàng được xây dựng với:

- **Next.js 15** với **React 19** và **TypeScript**
- **Authentication System**: JWT-based với role-based access control
- **Real-time Communication**: Socket.io cho orders và notifications
- **State Management**: Zustand cho global state, React Query cho server state
- **UI Framework**: Radix UI components với Tailwind CSS
- **Internationalization**: next-intl cho đa ngôn ngữ (vi/en)
- **Data Validation**: Zod schemas cho form validation
- **Image Handling**: Next.js Image optimization với file upload

### 🎯 CÁC MODULE CHÍNH CẦN TEST

1. **Authentication & Authorization** (Critical)
2. **Order Management** (Business Critical)
3. **Dish Management** (Business Critical)
4. **Table Management** (Business Critical)
5. **Account Management** (Business Critical)
6. **Real-time Features** (Socket.io)
7. **Multi-language Support** (i18n)
8. **File Upload & Media** (Images)

---

## 🎯 MỤC TIÊU TESTING

### 1. Độ Bao Phủ (Coverage Goals)

- **Authentication & Security**: **95%+**
- **Business Logic** (Orders, Dishes, Tables): **90%+**
- **API Routes & Middleware**: **85%+**
- **UI Components**: **80%+**
- **Integration Tests**: **85%+**
- **E2E Critical Flows**: **90%+**

### 2. Loại Test Cần Thực Hiện

- **Unit Tests**: Components, utilities, schemas, hooks
- **Integration Tests**: API routes, middleware, authentication flows
- **E2E Tests**: Complete user journeys, role-based workflows
- **Visual Regression Tests**: UI consistency
- **Performance Tests**: Page load, real-time features

---

## 📊 KIM TỰ THÁP TESTING CHO NEXTJS

```
                    🔺 E2E Tests (25%)
                   /   Playwright/Cypress   \
                  /                          \
                 /    Integration Tests       \
                /        (35%)                \
               /   API Routes + Middleware     \
              /                                \
             /________________________________\
            |      Unit Tests (40%)            |
            |  Components + Hooks + Utils      |
```

---

## 🗺️ LỘ TRÌNH THỰC HIỆN CHI TIẾT

### Phase 1: Thiết Lập Môi Trường Test (Tuần 1) 🔧

**Setup cơ bản và infrastructure**

#### 1.1 Cài Đặt Testing Tools

```bash
# Testing frameworks và utilities
pnpm add -D jest @jest/environment-jsdom
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D jest-environment-jsdom

# API và Integration testing
pnpm add -D supertest @types/supertest
pnpm add -D msw@2 # Mock Service Worker

# E2E Testing
pnpm add -D @playwright/test
# hoặc pnpm add -D cypress

# Visual Regression Testing
pnpm add -D @storybook/react @storybook/addon-essentials
```

#### 1.2 Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './'
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/api/**' // Sẽ test riêng với integration tests
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}

module.exports = createJestConfig(customJestConfig)
```

#### 1.3 Testing Utilities Setup

```typescript
// src/test-utils/index.ts
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { ReactElement } from 'react'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  const messages = {
    /* test messages */
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale='vi' messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  )
}

const customRender = (ui: ReactElement, options?: RenderOptions) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

### Phase 2: Authentication & Security Testing (Tuần 2-3) 🔐

**Ưu tiên cao nhất - Critical security components**

#### 2.1 Unit Tests cho Authentication Logic

```typescript
// src/lib/__tests__/utils.test.ts
describe('Authentication Utils', () => {
  describe('decodeToken', () => {
    it('should decode valid JWT token correctly', () => {
      const validToken = 'eyJ...' // Valid JWT
      const decoded = decodeToken(validToken)
      expect(decoded).toHaveProperty('role')
      expect(decoded).toHaveProperty('exp')
    })

    it('should handle invalid token gracefully', () => {
      expect(() => decodeToken('invalid')).toThrow()
    })
  })

  describe('checkAndRefreshToken', () => {
    beforeEach(() => {
      localStorage.clear()
      jest.clearAllMocks()
    })

    it('should refresh token when near expiry', async () => {
      // Mock localStorage with token near expiry
      // Test refresh logic
    })

    it('should logout when refresh token expired', async () => {
      // Test logout flow when refresh token invalid
    })
  })
})
```

#### 2.2 API Routes Testing

```typescript
// src/app/api/auth/__tests__/login.test.ts
import { POST } from '../login/route'
import { NextRequest } from 'next/server'

// Mock external API calls
jest.mock('@/apiRequests/auth')

describe('/api/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('data.accessToken')
  })

  it('should return 401 for invalid credentials', async () => {
    // Test invalid login
  })
})
```

#### 2.3 Middleware Testing

```typescript
// src/__tests__/middleware.test.ts
import { middleware } from '../middleware'
import { NextRequest } from 'next/server'

describe('Middleware', () => {
  describe('Route Protection', () => {
    it('should redirect unauthenticated users from protected routes', () => {
      const req = new NextRequest('http://localhost:3000/vi/manage/dashboard')
      // No cookies set

      const response = middleware(req)

      expect(response?.status).toBe(307) // Redirect
      expect(response?.headers.get('location')).toContain('/vi/login')
    })

    it('should allow authenticated users to access protected routes', () => {
      const req = new NextRequest('http://localhost:3000/vi/manage/dashboard')
      req.cookies.set('refreshToken', 'valid-refresh-token')
      req.cookies.set('accessToken', 'valid-access-token')

      const response = middleware(req)

      expect(response).toBeUndefined() // No redirect
    })

    it('should enforce role-based access control', () => {
      // Test Guest trying to access /manage
      // Test Employee trying to access /manage/accounts
    })
  })
})
```

### Phase 3: Business Logic Components (Tuần 4-5) 📊

#### 3.1 Form Components Testing

```typescript
// src/app/[locale]/(public)/(auth)/login/__tests__/login-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import LoginForm from '../login-form'

describe('LoginForm', () => {
  it('should render login form correctly', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should validate form fields', async () => {
    render(<LoginForm />)

    const submitBtn = screen.getByRole('button', { name: /login/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument()
      expect(screen.getByText(/password.*required/i)).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    // Mock successful login
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })

    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      // Assert successful login behavior
    })
  })
})
```

#### 3.2 React Query Hooks Testing

```typescript
// src/queries/__tests__/useAuth.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLoginMutation } from '../useAuth'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useLoginMutation', () => {
  it('should handle successful login', async () => {
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: createWrapper()
    })

    result.current.mutate({
      email: 'test@example.com',
      password: 'password123'
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})
```

#### 3.3 State Management Testing

```typescript
// src/components/__tests__/app-provider.test.tsx
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '../app-provider'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().setRole(undefined)
  })

  it('should set role and auth state correctly', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.setRole('Owner')
    })

    expect(result.current.role).toBe('Owner')
    expect(result.current.isAuth).toBe(true)
  })

  it('should clear auth state on logout', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.setRole('Owner')
    })

    act(() => {
      result.current.setRole(undefined)
    })

    expect(result.current.role).toBeUndefined()
    expect(result.current.isAuth).toBe(false)
  })
})
```

### Phase 4: API Integration Testing (Tuần 6) 🔄

#### 4.1 Full API Route Testing

```typescript
// src/app/api/__tests__/integration/auth-flow.test.ts
import { NextRequest } from 'next/server'
import { POST as loginPOST } from '../auth/login/route'
import { POST as logoutPOST } from '../auth/logout/route'

describe('Authentication Integration', () => {
  it('should complete full auth flow', async () => {
    // 1. Login
    const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    })

    const loginRes = await loginPOST(loginReq)
    expect(loginRes.status).toBe(200)

    // 2. Verify cookies set
    const setCookieHeader = loginRes.headers.get('set-cookie')
    expect(setCookieHeader).toContain('accessToken')
    expect(setCookieHeader).toContain('refreshToken')

    // 3. Logout
    const logoutReq = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        cookie: setCookieHeader!
      }
    })

    const logoutRes = await logoutPOST(logoutReq)
    expect(logoutRes.status).toBe(200)
  })
})
```

#### 4.2 Mock Service Worker Setup

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth handlers
  http.post('*/auth/login', ({ request }) => {
    return HttpResponse.json({
      message: 'Đăng nhập thành công',
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        account: {
          id: 1,
          email: 'test@example.com',
          role: 'Owner'
        }
      }
    })
  }),

  // Dishes handlers
  http.get('*/dishes', () => {
    return HttpResponse.json({
      data: [{ id: 1, name: 'Test Dish', price: 100000 }]
    })
  })
]
```

### Phase 5: E2E Testing (Tuần 7-8) 🎭

#### 5.1 Critical User Journeys

```typescript
// tests/e2e/auth-flow.spec.ts (Playwright)
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('Owner login and dashboard access', async ({ page }) => {
    await page.goto('/vi/login')

    // Login
    await page.fill('[data-testid="email"]', 'owner@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/vi\/manage\/dashboard/)

    // Verify dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Test navigation
    await page.click('[data-testid="orders-nav"]')
    await expect(page).toHaveURL(/\/vi\/manage\/orders/)
  })

  test('Guest ordering flow', async ({ page }) => {
    // Navigate to table
    await page.goto('/vi/tables/1')

    // Guest login
    await page.fill('[data-testid="guest-name"]', 'Test Guest')
    await page.fill('[data-testid="guest-table"]', '1')
    await page.click('[data-testid="guest-login"]')

    // Browse menu
    await expect(page).toHaveURL(/\/vi\/guest\/menu/)

    // Add items to order
    await page.click('[data-testid="dish-1"] [data-testid="add-to-cart"]')

    // Go to orders
    await page.click('[data-testid="orders-nav"]')
    await expect(page.locator('[data-testid="cart-items"]')).toContainText('1')

    // Place order
    await page.click('[data-testid="place-order"]')
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible()
  })
})
```

#### 5.2 Real-time Features Testing

```typescript
// tests/e2e/realtime.spec.ts
test.describe('Real-time Features', () => {
  test('Order updates in real-time', async ({ browser }) => {
    // Create two browser contexts (guest and admin)
    const guestContext = await browser.newContext()
    const adminContext = await browser.newContext()

    const guestPage = await guestContext.newPage()
    const adminPage = await adminContext.newPage()

    // Admin login
    await adminPage.goto('/vi/login')
    // ... login as admin
    await adminPage.goto('/vi/manage/orders')

    // Guest places order
    await guestPage.goto('/vi/tables/1')
    // ... place order

    // Verify admin sees new order in real-time
    await expect(adminPage.locator('[data-testid="new-order"]')).toBeVisible()
  })
})
```

---

## 🧪 TESTING PATTERNS & BEST PRACTICES

### 1. Component Testing Pattern

```typescript
// Component test template
describe('ComponentName', () => {
  // Setup
  const defaultProps = {
    // required props
  }

  const renderComponent = (props = {}) => {
    return render(<ComponentName {...defaultProps} {...props} />)
  }

  // Tests
  describe('Rendering', () => {
    it('should render with default props', () => {
      renderComponent()
      // assertions
    })
  })

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const onClickMock = jest.fn()
      renderComponent({ onClick: onClickMock })

      fireEvent.click(screen.getByRole('button'))
      expect(onClickMock).toHaveBeenCalled()
    })
  })

  describe('Error States', () => {
    it('should display error message', () => {
      renderComponent({ error: 'Test error' })
      expect(screen.getByText('Test error')).toBeInTheDocument()
    })
  })
})
```

### 2. API Route Testing Pattern

```typescript
// API route test template
describe('/api/route-name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should handle valid request', async () => {
      const req = new NextRequest('http://localhost/api/route-name', {
        method: 'POST',
        body: JSON.stringify(validData)
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject(expectedResponse)
    })

    it('should validate request body', async () => {
      const req = new NextRequest('http://localhost/api/route-name', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
    })
  })
})
```

### 3. Schema Validation Testing

```typescript
// src/schemaValidations/__tests__/auth.schema.test.ts
describe('Auth Schemas', () => {
  describe('LoginBody', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }

      const result = LoginBody.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }

      const result = LoginBody.safeParse(invalidData)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toEqual(['email'])
    })
  })
})
```

---

## 📈 PERFORMANCE TESTING

### 1. Page Load Performance

```typescript
// tests/performance/page-load.spec.ts
test.describe('Performance Tests', () => {
  test('Dashboard should load within 2 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/vi/manage/dashboard')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(2000)
  })

  test('Menu page should handle 100 dishes efficiently', async ({ page }) => {
    // Mock API with 100 dishes
    await page.route('**/dishes**', (route) => {
      route.fulfill({
        json: { data: generateMockDishes(100) }
      })
    })

    await page.goto('/vi/guest/menu')

    // Verify all dishes are rendered
    await expect(page.locator('[data-testid="dish-card"]')).toHaveCount(100)

    // Test scroll performance
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(100) // Should be smooth
  })
})
```

### 2. Socket.io Performance

```typescript
// tests/performance/socket-performance.test.ts
test('Socket connection should handle multiple rapid events', async ({ page }) => {
  await page.goto('/vi/manage/orders')

  // Simulate rapid order updates
  await page.evaluate(() => {
    const events = Array.from({ length: 50 }, (_, i) => ({
      type: 'new-order',
      data: { id: i, table: Math.floor(i / 10) + 1 }
    }))

    events.forEach((event, index) => {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('socket-message', { detail: event }))
      }, index * 10) // 10ms intervals
    })
  })

  // Verify UI updates correctly
  await expect(page.locator('[data-testid="order-count"]')).toHaveText('50')
})
```

---

## 🛡️ SECURITY TESTING

### 1. Authentication Security

```typescript
// tests/security/auth-security.test.ts
describe('Authentication Security', () => {
  test('should prevent SQL injection in login', async () => {
    const maliciousInput = "admin@example.com'; DROP TABLE users; --"

    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: maliciousInput,
        password: 'password123'
      })
    })

    const response = await POST(req)
    expect(response.status).toBe(400) // Should be rejected by validation
  })

  test('should prevent XSS in form inputs', async ({ page }) => {
    await page.goto('/vi/login')

    const xssPayload = '<script>alert("xss")</script>'
    await page.fill('[data-testid="email"]', xssPayload)

    // Verify script is not executed
    const emailValue = await page.inputValue('[data-testid="email"]')
    expect(emailValue).toBe(xssPayload) // Should be treated as text
  })
})
```

### 2. Authorization Testing

```typescript
test('should enforce role-based access control', async ({ page }) => {
  // Login as Employee
  await loginAs(page, 'employee@example.com', 'password123')

  // Try to access Owner-only page
  await page.goto('/vi/manage/accounts')

  // Should be redirected or show access denied
  await expect(page).not.toHaveURL(/\/vi\/manage\/accounts/)
})
```

---

## 📊 TEST MONITORING & REPORTING

### 1. Coverage Reports

```json
// package.json scripts
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:ci": "jest --coverage --watchAll=false",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:all": "npm run test:ci && npm run test:e2e"
}
```

### 2. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:ci
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:e2e
```

---

## 🎯 TESTING PRIORITIES

### Ưu tiên CỰC CAO (Must Test - 95% Coverage)

1. **Authentication/Authorization logic**
2. **Payment processing** (nếu có)
3. **Order placement và management**
4. **Role-based access control**
5. **Data validation schemas**

### Ưu tiên CAO (Should Test - 85% Coverage)

1. **CRUD operations** (Dishes, Tables, Accounts)
2. **Form validation và submission**
3. **Real-time socket events**
4. **API error handling**
5. **Middleware logic**

### Ưu tiên TRUNG BÌNH (Nice to Test - 70% Coverage)

1. **UI component rendering**
2. **Internationalization**
3. **Image upload functionality**
4. **Dark mode switching**
5. **Navigation flows**

---

## 📝 CHECKLIST TRIỂN KHAI

### ✅ Phase 1: Setup (Tuần 1)

- [ ] Install testing dependencies
- [ ] Configure Jest and Playwright
- [ ] Setup test utilities and mocks
- [ ] Create CI/CD pipeline
- [ ] Document testing conventions

### ✅ Phase 2: Authentication (Tuần 2-3)

- [ ] Test authentication utilities
- [ ] Test JWT token handling
- [ ] Test login/logout API routes
- [ ] Test middleware protection
- [ ] Test role-based access

### ✅ Phase 3: Business Logic (Tuần 4-5)

- [ ] Test form components
- [ ] Test React Query hooks
- [ ] Test state management
- [ ] Test schema validations
- [ ] Test error handling

### ✅ Phase 4: Integration (Tuần 6)

- [ ] Test API routes integration
- [ ] Test database operations
- [ ] Test real-time features
- [ ] Test file upload flows
- [ ] Test i18n functionality

### ✅ Phase 5: E2E (Tuần 7-8)

- [ ] Test critical user journeys
- [ ] Test cross-browser compatibility
- [ ] Test mobile responsiveness
- [ ] Test performance benchmarks
- [ ] Test security vulnerabilities

---

## 🚀 CÔNG CỤ VÀ FRAMEWORK

### Testing Frameworks

- **Jest**: Unit và integration tests
- **Playwright**: E2E tests (recommended cho NextJS)
- **Testing Library**: Component testing utilities
- **MSW**: API mocking

### Supporting Tools

- **Storybook**: Component documentation và visual testing
- **Codecov**: Coverage reporting
- **GitHub Actions**: CI/CD automation
- **Docker**: Test environment consistency

---

## 🎓 KHÁI NIỆM E2E TESTING

### E2E Testing là gì?

**End-to-End (E2E) Testing** là phương pháp testing mô phỏng hành vi của người dùng thực từ đầu đến cuối của một workflow hoàn chỉnh.

### Đặc điểm của E2E Tests:

1. **Mô phỏng User Journey**: Test toàn bộ luồng người dùng từ đăng nhập đến hoàn thành task
2. **Cross-system Testing**: Test tương tác giữa frontend, backend, database, và external services
3. **Browser-based**: Chạy trên browser thật, test UI và UX thực tế
4. **High-level Confidence**: Đảm bảo các tính năng hoạt động end-to-end

### Ví dụ E2E Test Flows cho PosApp:

#### Owner Management Flow:

```
1. Đăng nhập với tài khoản Owner
2. Navigagte đến trang quản lý món ăn
3. Thêm món ăn mới với hình ảnh
4. Verify món ăn xuất hiện trong danh sách
5. Chỉnh sửa thông tin món ăn
6. Xóa món ăn
7. Đăng xuất
```

#### Guest Ordering Flow:

```
1. Scan QR code tại bàn số 5
2. Nhập thông tin guest login
3. Browse menu và xem chi tiết món ăn
4. Thêm 3 món khác nhau vào giỏ hàng
5. Điều chỉnh số lượng
6. Đặt order
7. Verify order confirmation
8. Check order status updates
```

#### Employee Order Management:

```
1. Đăng nhập với tài khoản Employee
2. Xem danh sách orders mới
3. Cập nhật status order từ "Pending" → "Cooking"
4. Verify real-time update cho guest
5. Hoàn thành order → "Served"
6. Verify payment status
```

### Khi nào sử dụng E2E Tests:

✅ **Nên sử dụng khi:**

- Test critical business flows (đặt hàng, thanh toán)
- Verify tích hợp giữa các hệ thống
- Test user experience workflows
- Regression testing cho major releases

❌ **Không nên sử dụng khi:**

- Test logic đơn giản (dùng unit tests)
- Test styling chi tiết (dùng visual regression)
- Test error handling riêng lẻ (dùng integration tests)

---

## 🎯 KẾT QUẢ MONG MUỐN

Sau khi hoàn thành chiến lược testing này, dự án sẽ có:

### ✅ Code Quality

- **High confidence** trong mọi thay đổi code
- **Reduced bugs** trong production significantly
- **Easier refactoring** với comprehensive test coverage
- **Self-documenting code** thông qua test specifications

### ✅ Development Velocity

- **Faster development cycles** với test-driven development
- **Quick feedback loops** khi có regressions
- **Confident deployments** mỗi release
- **Better collaboration** với clear test specifications

### ✅ User Experience

- **Reliable features** hoạt động consistent
- **Better performance** được monitor qua tests
- **Cross-browser compatibility** được đảm bảo
- **Accessibility compliance** được validate

### ✅ Business Value

- **Reduced maintenance costs** với early bug detection
- **Faster time-to-market** với automated testing
- **Higher customer satisfaction** với stable features
- **Scalable codebase** với solid testing foundation

---

**Tác giả:** AI Assistant  
**Ngày tạo:** $(date)  
**Phiên bản:** v1.0  
**Áp dụng cho:** NextJS Super PosApp  
**Status:** 📋 Ready for Implementation

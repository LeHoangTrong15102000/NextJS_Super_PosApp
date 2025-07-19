# 🧪 HƯỚNG DẪN SETUP TESTING CHO NEXTJS POSAPP

## 📋 Yêu Cầu Trước Khi Bắt Đầu

- Node.js 18+
- npm hoặc pnpm
- NextJS 15 project đã setup

## ⚙️ BƯỚC 1: CÀI ĐẶT DEPENDENCIES

### 1.1 Testing Framework & Libraries

```bash
# Sử dụng npm
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Hoặc sử dụng pnpm
pnpm add -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event

# TypeScript types
npm install -D @types/jest

# Nếu có lỗi peer dependencies với React 19
npm install -D @testing-library/react@latest --legacy-peer-deps
```

### 1.2 Additional Testing Tools (Optional)

```bash
# MSW cho API mocking
npm install -D msw@2

# Supertest cho API testing
npm install -D supertest @types/supertest
```

## 🔧 BƯỚC 2: CONFIGURATION

### 2.1 Jest Configuration

File `jest.config.js` đã được tạo sẵn với configuration tối ưu cho NextJS:

```javascript
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
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.stories.{ts,tsx}', '!src/app/api/**'],
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

### 2.2 Jest Setup File

File `jest.setup.js` đã được tạo với các mocks cần thiết:

- Mock Next.js router
- Mock next-intl
- Mock localStorage/sessionStorage
- Mock environment variables
- Mock socket.io-client

### 2.3 Test Utilities

File `src/test-utils/index.ts` cung cấp:

- Custom render function với providers
- Mock data generators
- Helper functions

## 🏃‍♂️ BƯỚC 3: CHẠY TESTS

### 3.1 Scripts Có Sẵn

```bash
# Chạy tất cả tests một lần
npm test

# Chạy tests ở watch mode
npm run test:watch

# Chạy tests với coverage report
npm run test:coverage

# Chạy tests cho CI (no watch, with coverage)
npm run test:ci
```

### 3.2 Chạy Tests Cụ Thể

```bash
# Chạy tests cho file cụ thể
npm test utils.test.ts

# Chạy tests trong thư mục cụ thể
npm test src/lib/__tests__/

# Chạy tests matching pattern
npm test -- --testNamePattern="authentication"
```

## 📁 CẤU TRÚC THƯ MỤC TESTS

```
src/
├── lib/
│   └── __tests__/
│       └── utils.test.ts
├── schemaValidations/
│   └── __tests__/
│       └── auth.schema.test.ts
├── queries/
│   └── __tests__/
│       └── useAuth.test.tsx
├── app/
│   └── [locale]/
│       └── (public)/
│           └── (auth)/
│               └── login/
│                   └── __tests__/
│                       └── login-form.test.tsx
└── test-utils/
    └── index.ts
```

## 🧪 TESTS ĐÃ ĐƯỢC TRIỂN KHAI

### ✅ Authentication Utilities (`src/lib/__tests__/utils.test.ts`)

**Coverage:** 25+ test cases

- JWT token decoding
- Token storage management (localStorage)
- Error handling (`handleErrorApi`)
- Currency formatting
- Vietnamese status translations
- Text processing utilities
- URL generation

**Chạy test:**

```bash
npm test utils.test.ts
```

### ✅ Schema Validation (`src/schemaValidations/__tests__/auth.schema.test.ts`)

**Coverage:** 20+ test cases

- Zod schema validation cho LoginBody
- Email format validation
- Password length validation
- LoginRes response validation
- RefreshToken schemas
- Strict mode validation

**Chạy test:**

```bash
npm test auth.schema.test.ts
```

### ✅ React Query Hooks (`src/queries/__tests__/useAuth.test.tsx`)

**Coverage:** 15+ test cases

- useLoginMutation success/error scenarios
- useLogoutMutation testing
- useSetTokenToCookieMutation testing
- Loading state management
- Multiple consecutive mutations

**Chạy test:**

```bash
npm test useAuth.test.tsx
```

### ✅ Login Form Component (`src/app/[locale]/(public)/(auth)/login/__tests__/login-form.test.tsx`)

**Coverage:** 12+ test cases

- Form rendering
- Form validation (client-side)
- User interactions
- Form submission
- Error handling
- Loading states
- Accessibility testing

**Chạy test:**

```bash
npm test login-form.test.tsx
```

## 📊 COVERAGE REPORTS

### Xem Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# Coverage files sẽ được tạo trong ./coverage/
# Mở coverage/lcov-report/index.html trong browser để xem detailed report
```

### Coverage Thresholds

Dự án được configure với coverage thresholds:

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

Tests sẽ fail nếu coverage dưới ngưỡng này.

## 🐛 TROUBLESHOOTING

### 1. Lỗi Module Not Found

```bash
# Nếu gặp lỗi không tìm thấy @testing-library modules
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event --legacy-peer-deps
```

### 2. Lỗi JSX/TSX Import

Đảm bảo trong `jest.config.js` có:

```javascript
moduleNameMapping: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

### 3. Lỗi Next.js Components

File `jest.setup.js` đã mock các Next.js components. Nếu gặp lỗi thêm:

```javascript
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />
}))
```

### 4. Lỗi Environment Variables

Thêm vào `jest.setup.js`:

```javascript
process.env.NEXT_PUBLIC_API_ENDPOINT = 'http://localhost:4000'
process.env.NEXT_PUBLIC_URL = 'http://localhost:3000'
```

### 5. Lỗi Async/Await

Sử dụng `waitFor` cho async operations:

```javascript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled()
})
```

## 🎯 BEST PRACTICES

### 1. Test Organization

```javascript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render correctly', () => {
      // test implementation
    })
  })

  describe('User Interactions', () => {
    it('should handle click events', () => {
      // test implementation
    })
  })
})
```

### 2. Mocking Strategy

```javascript
// Mock external dependencies
jest.mock('@/apiRequests/auth')

// Mock custom hooks
jest.mock('@/queries/useAuth')

// Setup mocks in beforeEach
beforeEach(() => {
  mockFunction.mockReturnValue(defaultValue)
})
```

### 3. User-Centric Testing

```javascript
// Good - query như user sẽ interact
screen.getByRole('button', { name: /login/i })
screen.getByLabelText(/email/i)

// Avoid - query bằng implementation details
screen.getByTestId('login-button')
screen.getByClassName('email-input')
```

### 4. Async Testing

```javascript
// Good - test async operations
await user.click(submitButton)
await waitFor(() => {
  expect(mockApi).toHaveBeenCalled()
})

// Good - test loading states
expect(screen.getByText(/loading/i)).toBeInTheDocument()
```

## 🚀 NEXT STEPS

### Phase 3: Business Logic Testing

1. **Dish Management Tests**

   - src/app/[locale]/manage/dishes/
   - CRUD operations
   - Image upload

2. **Order Management Tests**

   - src/app/[locale]/manage/orders/
   - Order lifecycle
   - Real-time updates

3. **Table Management Tests**
   - src/app/[locale]/manage/tables/
   - Table status management

### Phase 4: Integration Testing

1. **API Routes Testing**

   - src/app/api/
   - Authentication endpoints
   - CRUD endpoints

2. **Middleware Testing**
   - src/middleware.ts
   - Route protection
   - Role-based access

### Phase 5: E2E Testing

1. **Playwright Setup**
2. **Critical User Journeys**
3. **Cross-browser Testing**

## 📚 TÀI LIỆU THAM KHẢO

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Testing Strategy Document](./docs/ZZ_4_TESTING_STRATEGY_NEXTJS_POSAPP.md)

---

**Cần hỗ trợ?** Xem file `docs/ZZ_5_UNIT_TESTING_IMPLEMENTATION_REPORT.md` để biết chi tiết về implementation.

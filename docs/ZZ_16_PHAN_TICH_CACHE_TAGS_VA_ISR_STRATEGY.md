# Phân Tích Chi Tiết: Cache Tags, ISR Strategy & Dynamic Rendering

## 1. Cách `next: { tags: ['dishes'] }` Hoạt Động Trong Hệ Thống

### 1.1. Tổng Quan Cơ Chế

Khi gọi `fetch()` với option `next: { tags: [...] }`, Next.js sẽ:
1. Gắn **cache tag** vào response trong Data Cache
2. Cho phép **on-demand revalidation** thông qua `revalidateTag()`

```typescript
// src/apiRequests/dish.ts
const dishApiRequest = {
  list: () =>
    http.get<DishListResType>('dishes', { next: { tags: ['dishes'] } }),
  getDish: (id: number) =>
    http.get<DishResType>(`dishes/${id}`, {
      next: { tags: ['dishes', `dish-${id}`] }
    }),
}
```

### 1.2. Flow Chi Tiết Trong Hệ Thống

```
  ① SERVER COMPONENT GỌI API
  ═══════════════════════════

  Home page / DishDetail page (Server Component)
       │
       ▼
  dishApiRequest.list() hoặc getDish(id)
       │
       ▼
  http.get(url, { next: { tags: ['dishes'] } })
       │
       ▼
  fetch(fullUrl, { ...options })
       │  ↑ options chứa next: { tags: ['dishes'] }
       │  ↑ Next.js intercept fetch() và đọc tags
       ▼
  ┌──────────────────────────────────────────┐
  │  Next.js Data Cache                      │
  │                                          │
  │  Entry:                                  │
  │    key: hash(url + method + headers)     │
  │    tags: ['dishes']                      │
  │    data: { status: 200, payload: {...} } │
  │    revalidateAfter: 3600s (từ ISR)       │
  └──────────────────────────────────────────┘

  ② ON-DEMAND REVALIDATION
  ═════════════════════════

  Client Component (add-dish.tsx / edit-dish.tsx)
       │  Sau khi CRUD thành công
       ▼
  revalidateApiRequest('dishes')
       │
       ▼
  http.get('/api/revalidate?tag=dishes', { baseUrl: '' })
       │  ↑ baseUrl='' → gọi đến Next.js Server
       ▼
  ┌──────────────────────────────────────────┐
  │  /api/revalidate/route.ts                │
  │                                          │
  │  revalidateTag('dishes', { expire: 0 })  │
  │       │                                  │
  │       ▼                                  │
  │  Tìm TẤT CẢ cache entries có tag        │
  │  'dishes' → đánh dấu stale              │
  │  expire: 0 → xóa ngay lập tức           │
  └──────────────────────────────────────────┘
       │
       ▼
  Request tiếp theo → fetch lại data mới từ backend
```

### 1.3. Sự Khác Biệt Giữa Các Version Next.js

| Version | fetch() mặc định | Ảnh hưởng đến tags |
|---------|-------------------|-------------------|
| Next.js 14 | `cache: 'force-cache'` | Tags hoạt động đầy đủ — data được cache và revalidate theo tag |
| Next.js 15 | `cache: 'no-store'` | Tags được gắn nhưng **không cache** trừ khi có `revalidate` export |
| Next.js 16 | `cache: 'no-store'` | Giống Next.js 15, thêm `'use cache'` directive mới |

**Dự án đang dùng Next.js 16.1.6**, nên:
- `next: { tags: ['dishes'] }` **chỉ có tác dụng** khi kết hợp với `export const revalidate = N`
- Nếu không có `revalidate`, mỗi request vẫn fetch mới từ backend (no-store)

### 1.4. Tag Strategy Trong Dự Án

```
Tag: 'dishes'
├── dishApiRequest.list()     → Danh sách tất cả món
├── dishApiRequest.getDish(1) → Chi tiết món #1
├── dishApiRequest.getDish(2) → Chi tiết món #2
└── ...

Tag: 'dish-1'
└── dishApiRequest.getDish(1) → Chỉ chi tiết món #1

Tag: 'dish-2'
└── dishApiRequest.getDish(2) → Chỉ chi tiết món #2
```

Khi `revalidateTag('dishes')`:
- Invalidate **tất cả** cache entries có tag `dishes`
- Bao gồm cả list và tất cả individual dish details
- Phù hợp khi add/delete dish (ảnh hưởng toàn bộ)

---

## 2. Tại Sao Dự Án Ban Đầu Chọn Dynamic Rendering

### 2.1. Nguyên Nhân Kỹ Thuật

**Trang chủ (`/(public)/page.tsx`):**

```typescript
// TRƯỚC KHI REFACTOR
const now = new Date()  // ← Thay đổi mỗi request
const [dishResult, indicatorResult] = await Promise.allSettled([
  wrapServerApi(dishApiRequest.list),
  wrapServerApi(() =>
    indicatorApiRequest.getDashboardIndicators({
      fromDate: startOfMonth(now),   // ← Dynamic date
      toDate: endOfDay(now)          // ← Dynamic date
    })
  )
])
```

Lý do dynamic:
1. `indicatorApiRequest` dùng `new Date()` → thay đổi mỗi request
2. `getTranslations()` + `setRequestLocale()` → dynamic i18n functions
3. Next.js 16 mặc định `no-store` → không cache
4. Không có `export const revalidate` → không ISR

**Dish Detail (`/dishes/[slug]/page.tsx`):**

Lý do dynamic:
1. Không có `generateStaticParams()` → không pre-render
2. Không có `export const revalidate` → không ISR
3. `getDish()` không có cache tags ban đầu
4. `getTranslations()` → dynamic function

### 2.2. Trade-offs Dynamic vs ISR

| Tiêu chí | Dynamic Rendering | ISR |
|----------|-------------------|-----|
| TTFB | ~200-500ms (fetch backend mỗi request) | ~50-100ms (serve từ cache) |
| Data freshness | Luôn mới nhất | Stale tối đa 1h + on-demand revalidate |
| Backend load | N visitors = N requests | 1 request / revalidate cycle |
| SEO | Tốt (SSR) | Tốt hơn (faster TTFB) |
| Complexity | Đơn giản | Cần quản lý revalidation |
| POS context | OK cho dev phase | Tối ưu cho production |

### 2.3. Tại Sao ISR Phù Hợp Với POS App

POS App cho nhà hàng có đặc điểm:
- **Menu ít thay đổi**: Owner cập nhật 1-2 lần/ngày
- **Nhiều visitor xem menu**: Khách hàng scan QR → xem menu
- **Data không cần real-time**: Menu dish không cần cập nhật từng giây
- **On-demand revalidation đã có**: Khi CRUD dish → `revalidateTag('dishes')` → cache invalidate ngay

→ ISR với `revalidate = 3600` (1 giờ) + on-demand revalidation là lựa chọn tối ưu.

---

## 3. ISR Implementation Trong Dự Án (Sau Refactor)

### 3.1. Dish Detail Page

```typescript
// src/app/[locale]/(public)/dishes/[slug]/page.tsx

// ISR: revalidate mỗi 1 giờ
export const revalidate = 3600

// Pre-render các món Available tại build time
export async function generateStaticParams() {
  const result = await wrapServerApi(dishApiRequest.list)
  if (!result) return []
  return result.payload.data
    .filter((dish) => dish.status === DishStatus.Available)
    .map((dish) => ({
      slug: generateSlugUrl({ name: dish.name, id: dish.id })
    }))
}
```

**Cách hoạt động:**
1. **Build time**: Next.js gọi `generateStaticParams()` → lấy danh sách dishes → pre-render HTML cho mỗi slug
2. **Layout đã có `generateStaticParams` cho locale** → Next.js tự combine: `locale × slug`
3. **Runtime**: Request đến `/vi/dishes/pho-bo-1` → serve HTML đã pre-render
4. **Sau 3600s**: Request tiếp theo trigger background regeneration
5. **On-demand**: Khi edit dish → `revalidateTag('dishes')` → invalidate ngay

### 3.2. Trang Chủ

```typescript
// src/app/[locale]/(public)/page.tsx

export const revalidate = 3600

export default async function Home() {
  // Server-side: Chỉ fetch dish list (cacheable)
  const dishResult = await wrapServerApi(dishApiRequest.list)
  const dishList = dishResult?.payload.data ?? []

  return (
    <>
      {/* ISR cached content */}
      <HeroSection />
      <DishFilter dishes={dishList} />

      {/* Client-side: Indicator data (dynamic, real-time) */}
      <IndicatorSection dishCount={dishList.length} />
    </>
  )
}
```

**Tách biệt concerns:**
- **Dish list** (server, ISR cached): Menu ít đổi → cache 1h
- **Indicator data** (client, React Query): Stats thay đổi liên tục → fetch client-side

### 3.3. Revalidation Flow Sau Refactor

```
  Owner thêm/sửa/xóa món ăn
       │
       ▼
  Client Component gọi mutation
       │
       ▼
  await revalidateApiRequest('dishes')
       │
       ▼
  /api/revalidate?tag=dishes
       │
       ▼
  revalidateTag('dishes', { expire: 0 })
       │
       ├──→ Invalidate dish list cache (trang chủ)
       ├──→ Invalidate tất cả dish detail cache
       └──→ Request tiếp theo → regenerate HTML mới
```

---

## 4. Kết Luận

| Aspect | Trước | Sau |
|--------|-------|-----|
| Trang chủ | Dynamic (fetch mỗi request) | ISR 1h + client-side indicators |
| Dish detail | Dynamic (fetch mỗi request) | ISR 1h + pre-rendered popular dishes |
| TTFB | ~200-500ms | ~50-100ms (cached) |
| Backend load | Cao (mỗi visitor = request) | Thấp (1 req/revalidate cycle) |
| Data freshness | Luôn mới | Stale tối đa 1h, on-demand revalidate khi CRUD |
| SEO | Tốt (SSR) | Tốt hơn (faster TTFB, pre-rendered) |
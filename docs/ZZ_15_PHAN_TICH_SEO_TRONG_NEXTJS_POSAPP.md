# 🔍 Phân Tích SEO Trong Dự Án NextJS POS App (Bigboy Restaurant)

> Tài liệu phân tích toàn bộ chiến lược SEO đang được triển khai trong dự án, giải thích mục đích của từng thành phần, và đề xuất các cách tăng SEO trong NextJS.

---

## Mục Lục

1. [Sitemap là gì? Tại sao cần Sitemap?](#1-sitemap-là-gì-tại-sao-cần-sitemap)
2. [Robots.txt là gì?](#2-robotstxt-là-gì)
3. [Metadata & generateMetadata](#3-metadata--generatemetadata)
4. [Open Graph - Chia sẻ mạng xã hội](#4-open-graph---chia-sẻ-mạng-xã-hội)
5. [Canonical URL - Tránh trùng lặp nội dung](#5-canonical-url---tránh-trùng-lặp-nội-dung)
6. [Robots Meta Tag - Kiểm soát index từng trang](#6-robots-meta-tag---kiểm-soát-index-từng-trang)
7. [Google Verification & Analytics](#7-google-verification--analytics)
8. [SEO Utilities - Các hàm hỗ trợ SEO](#8-seo-utilities---các-hàm-hỗ-trợ-seo)
9. [i18n & SEO đa ngôn ngữ](#9-i18n--seo-đa-ngôn-ngữ)
10. [Semantic HTML & Image Optimization](#10-semantic-html--image-optimization)
11. [Tổng hợp: Luồng SEO Data Flow](#11-tổng-hợp-luồng-seo-data-flow)
12. [Bảng phân tích SEO theo từng Route](#12-bảng-phân-tích-seo-theo-từng-route)
13. [Các cách tăng SEO trong NextJS](#13-các-cách-tăng-seo-trong-nextjs)
14. [Đề xuất cải thiện cho dự án](#14-đề-xuất-cải-thiện-cho-dự-án)

---

## 1. Sitemap là gì? Tại sao cần Sitemap?

### 1.1 Khái niệm

**Sitemap** (sitemap.xml) là một file XML chứa danh sách tất cả các URL quan trọng trên website mà bạn muốn Google (và các search engine khác) biết đến và crawl (thu thập dữ liệu).

Hãy tưởng tượng sitemap như một **"bản đồ"** của website gửi cho Google:

```
🏠 Website của bạn
├── 📄 Trang chủ (priority: 1.0, thay đổi hàng ngày)
├── 📄 Trang đăng nhập (priority: 0.5, ít thay đổi)
├── 🍜 Phở Bò Tái (priority: 0.9, thay đổi hàng tuần)
├── 🍜 Bún Bò Huế (priority: 0.9, thay đổi hàng tuần)
└── 🍜 Cơm Tấm Sườn (priority: 0.9, thay đổi hàng tuần)
```

### 1.2 Tại sao cần Sitemap?

| Lý do | Giải thích |
|-------|-----------|
| **Giúp Google tìm thấy trang** | Không phải trang nào cũng có link trỏ đến. Sitemap đảm bảo Google biết tất cả các trang quan trọng |
| **Ưu tiên crawl** | `priority` cho Google biết trang nào quan trọng hơn (1.0 = quan trọng nhất, 0.0 = ít quan trọng) |
| **Tần suất cập nhật** | `changeFrequency` cho Google biết nên quay lại crawl bao lâu một lần |
| **Thời gian cập nhật** | `lastModified` cho Google biết lần cuối trang được cập nhật |
| **Hỗ trợ đa ngôn ngữ** | Với i18n, sitemap giúp Google biết cùng 1 nội dung có nhiều phiên bản ngôn ngữ |

### 1.3 Cách triển khai trong dự án

**File:** `src/app/sitemap.ts`

```typescript
// Next.js tự động generate /sitemap.xml từ file này
import dishApiRequest from '@/apiRequests/dish'
import envConfig, { locales } from '@/config'
import { generateSlugUrl, wrapServerApi } from '@/lib/utils'
import type { MetadataRoute } from 'next'

// Các route tĩnh (không cần gọi API)
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: '',                    // Trang chủ
    changeFrequency: 'daily',   // Thay đổi hàng ngày
    priority: 1                 // Quan trọng nhất
  },
  {
    url: '/login',              // Trang đăng nhập
    changeFrequency: 'yearly',  // Hiếm khi thay đổi
    priority: 0.5               // Ít quan trọng hơn
  }
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Gọi API lấy danh sách món ăn (wrap để không crash khi API down)
  const result = await wrapServerApi(dishApiRequest.list)
  const dishList = result?.payload.data ?? []

  // Generate URL cho mỗi locale (en, vi)
  const localizeStaticSiteMap = locales.reduce((acc, locale) => {
    return [
      ...acc,
      ...staticRoutes.map((route) => ({
        ...route,
        url: `${envConfig.NEXT_PUBLIC_URL}/${locale}${route.url}`,
        // Ví dụ: https://bigboy.com/vi, https://bigboy.com/en
        lastModified: new Date()
      }))
    ]
  }, [] as MetadataRoute.Sitemap)

  // Generate URL cho mỗi món ăn x mỗi locale
  const localizeDishSiteMap = locales.reduce((acc, locale) => {
    const dishListSiteMap: MetadataRoute.Sitemap = dishList.map((dish) => ({
      url: `${envConfig.NEXT_PUBLIC_URL}/${locale}/dishes/${generateSlugUrl({
        id: dish.id,
        name: dish.name
      })}`,
      // Ví dụ: https://bigboy.com/vi/dishes/pho-bo-tai-1
      lastModified: dish.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9
    }))
    return [...acc, ...dishListSiteMap]
  }, [] as MetadataRoute.Sitemap)

  return [...localizeStaticSiteMap, ...localizeDishSiteMap]
}
```

**Kết quả XML được generate (ví dụ):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bigboy.com/vi</loc>
    <lastmod>2026-02-28</lastmod>
    <changefreq>daily</changefreq>
    <priority>1</priority>
  </url>
  <url>
    <loc>https://bigboy.com/en</loc>
    <lastmod>2026-02-28</lastmod>
    <changefreq>daily</changefreq>
    <priority>1</priority>
  </url>

---

## 2. Robots.txt là gì?

### 2.1 Khái niệm

**robots.txt** là file nằm ở root của website (`/robots.txt`), cho các search engine bot biết **được phép** và **không được phép** crawl những trang nào.

Nếu sitemap là "bản đồ", thì robots.txt là **"bảng chỉ dẫn giao thông"** — nói cho bot biết đường nào được đi, đường nào cấm.

### 2.2 Cách triển khai trong dự án

**File:** `src/app/robots.ts`

```typescript
import envConfig from '@/config'
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',    // Áp dụng cho TẤT CẢ bot (Google, Bing, Yahoo...)
      allow: '/'         // Cho phép crawl TẤT CẢ trang
    },
    sitemap: `${envConfig.NEXT_PUBLIC_URL}/sitemap.xml`
    // Chỉ cho bot biết sitemap nằm ở đâu
  }
}
```

**Kết quả được generate:**

```
User-agent: *
Allow: /
Sitemap: https://bigboy.com/sitemap.xml
```

### 2.3 Mối quan hệ Robots.txt ↔ Sitemap

```
Google Bot đến website
        │
        ▼
Đọc /robots.txt → Biết được phép crawl gì
        │
        ▼
Tìm thấy dòng "Sitemap: .../sitemap.xml"
        │
        ▼
Đọc /sitemap.xml → Biết tất cả URL cần crawl
        │
        ▼
Bắt đầu crawl từng URL theo priority
```

---

## 3. Metadata & generateMetadata

### 3.1 Metadata là gì?

Metadata là các thẻ `<meta>`, `<title>` trong `<head>` của HTML. Đây là thông tin mà:
- **Google** dùng để hiển thị kết quả tìm kiếm (title + description)
- **Trình duyệt** dùng để hiển thị trên tab
- **Mạng xã hội** dùng để hiển thị preview khi chia sẻ link

### 3.2 Chiến lược Metadata trong dự án

Dự án sử dụng **2 tầng metadata**:

#### Tầng 1: Layout-level (Template)

**File:** `src/app/[locale]/layout.tsx`

```typescript
export async function generateMetadata(props) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: 'Brand' })

  return {
    title: {
      template: `%s | ${t('title')}`,   // Template: "Tên trang | Big Boy"
      default: t('defaultTitle')          // Mặc định: "Big Boy Restaurant"
    },
    openGraph: {
      ...baseOpenGraph                    // Open Graph mặc định cho toàn site
    }
  }
}
```

**Giải thích `template`:**
- `%s` là placeholder, sẽ được thay bằng title của trang con
- Ví dụ: Trang "Phở Bò" → `<title>Phở Bò | Big Boy Restaurant</title>`
- Ví dụ: Trang "Đăng nhập" → `<title>Đăng nhập | Big Boy Restaurant</title>`

#### Tầng 2: Page-level (Cụ thể cho từng trang)

**a) Trang tĩnh — Homepage:**

```typescript
// src/app/[locale]/(public)/page.tsx
export async function generateMetadata(props) {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: 'HomePage' })
  const url = envConfig.NEXT_PUBLIC_URL + `/${locale}`

  return {
    title: t('title'),                                    // "Trang chủ"
    description: htmlToTextForDescription(t('description')), // Mô tả ngắn
    alternates: {
      canonical: url                                       // URL chính thức
    }
  }
}
```

**b) Trang động — Chi tiết món ăn (SEO tốt nhất trong dự án):**

```typescript
// src/app/[locale]/(public)/dishes/[slug]/page.tsx
export async function generateMetadata(props): Promise<Metadata> {
  const params = await props.params
  const id = getIdFromSlugUrl(params.slug)
  const data = await getDetail(id)        // Gọi API lấy data món ăn
  const dish = data?.payload.data

  if (!dish) {
    return { title: t('notFound'), description: t('notFound') }
  }

  const url = envConfig.NEXT_PUBLIC_URL +
    `/${params.locale}/dishes/${generateSlugUrl({ name: dish.name, id: dish.id })}`

  return {
    title: dish.name,                                      // "Phở Bò Tái"
    description: htmlToTextForDescription(dish.description), // Mô tả món ăn
    openGraph: {
      ...baseOpenGraph,
      title: dish.name,
      description: dish.description,
      url,
      images: [{ url: dish.image }]    // Ảnh món ăn cho social preview
    },
    alternates: {
      canonical: url                    // Canonical URL
    }
  }
}
```

### 3.3 Kết quả HTML được render

Khi Google crawl trang `/vi/dishes/pho-bo-tai-1`, HTML `<head>` sẽ chứa:

```html
<head>
  <title>Phở Bò Tái | Big Boy Restaurant</title>
  <meta name="description" content="Phở bò tái thơm ngon, nước dùng đậm đà..." />
  <meta property="og:title" content="Phở Bò Tái" />
  <meta property="og:description" content="Phở bò tái thơm ngon..." />
  <meta property="og:image" content="https://api-bigboy.com/images/pho-bo.jpg" />
  <meta property="og:url" content="https://bigboy.com/vi/dishes/pho-bo-tai-1" />
  <meta property="og:site_name" content="Bigboy Restaurant" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:locale:alternate" content="vi_VN" />
  <link rel="canonical" href="https://bigboy.com/vi/dishes/pho-bo-tai-1" />
</head>
```

---

## 4. Open Graph - Chia sẻ mạng xã hội

### 4.1 Open Graph là gì?

Open Graph (OG) là giao thức do Facebook tạo ra, cho phép website kiểm soát cách nội dung hiển thị khi được chia sẻ trên mạng xã hội (Facebook, Twitter, Zalo, Telegram...).

**Không có OG:** Chia sẻ link → Hiển thị URL trơn, không hình ảnh, không mô tả
**Có OG:** Chia sẻ link → Hiển thị card đẹp với hình ảnh, tiêu đề, mô tả

### 4.2 Cách triển khai trong dự án

**File:** `src/shared-metadata.ts` — Config OG mặc định cho toàn site

```typescript
import envConfig from '@/config'

export const baseOpenGraph = {
  locale: 'en_US',                              // Ngôn ngữ chính
  alternateLocale: ['vi_VN'],                    // Ngôn ngữ thay thế
  type: 'website',                               // Loại nội dung
  siteName: 'Bigboy Restaurant',                 // Tên website
  images: [
    {
      url: `${envConfig.NEXT_PUBLIC_URL}/banner.png`  // Ảnh mặc định
    }
  ]
}
```

### 4.3 Cách OG được kế thừa

```
baseOpenGraph (shared-metadata.ts)
    │
    ├── Layout: openGraph: { ...baseOpenGraph }
    │   (Mặc định cho tất cả trang)
    │
    ├── Dish Detail: openGraph: { ...baseOpenGraph, title, description, images }
    │   (Override với data cụ thể của món ăn)
    │
    └── Guest Menu: openGraph: { ...baseOpenGraph, title, description, url }
        (Override với data cụ thể của menu)
```

---

## 5. Canonical URL - Tránh trùng lặp nội dung

### 5.1 Vấn đề Duplicate Content

Với i18n, cùng 1 trang có thể truy cập qua nhiều URL:
- `https://bigboy.com/vi/dishes/pho-bo-1`
- `https://bigboy.com/en/dishes/pho-bo-1`
- `https://bigboy.com/dishes/pho-bo-1` (nếu redirect)

Google có thể coi đây là **nội dung trùng lặp** → Phạt SEO.

### 5.2 Giải pháp: Canonical URL

Canonical URL nói cho Google biết: "Đây là URL chính thức, hãy index URL này thôi."

**Cách dự án triển khai:**

```typescript
// Mỗi trang đều set canonical URL
return {
  alternates: {
    canonical: url  // URL chính thức của trang
    // Ví dụ: https://bigboy.com/vi/dishes/pho-bo-tai-1
  }
}
```

**HTML output:**
```html
<link rel="canonical" href="https://bigboy.com/vi/dishes/pho-bo-tai-1" />
```

### 5.3 Các trang có Canonical URL trong dự án

| Trang | Canonical URL Pattern |
|-------|----------------------|
| Homepage | `NEXT_PUBLIC_URL/{locale}` |
| Login | `NEXT_PUBLIC_URL/{locale}/login` |
| Dish Detail | `NEXT_PUBLIC_URL/{locale}/dishes/{slug}` |
| Guest Menu | `NEXT_PUBLIC_URL/{locale}/guest/menu` |
| Manage Dashboard | `NEXT_PUBLIC_URL/{locale}/manage/dashboard` |
| Manage Dishes | `NEXT_PUBLIC_URL/{locale}/manage/dishes` |
| Manage Orders | `NEXT_PUBLIC_URL/{locale}/manage/orders` |
| Manage Tables | `NEXT_PUBLIC_URL/{locale}/manage/tables` |
| Manage Accounts | `NEXT_PUBLIC_URL/{locale}/manage/accounts` |
| Manage Setting | `NEXT_PUBLIC_URL/{locale}/manage/setting` |
| Tables/[number] | `NEXT_PUBLIC_URL/{locale}/tables/{number}` |

---

## 6. Robots Meta Tag - Kiểm soát index từng trang

### 6.1 Khác biệt với robots.txt

- **robots.txt**: Kiểm soát crawl ở cấp **toàn site** (cho phép/cấm bot truy cập)
- **robots meta tag**: Kiểm soát index ở cấp **từng trang** (cho phép/cấm Google hiển thị trang trong kết quả tìm kiếm)

### 6.2 Cách dự án sử dụng

Các trang **quản lý** (manage) và **guest** được đánh dấu `index: false` — Google sẽ KHÔNG hiển thị chúng trong kết quả tìm kiếm:

```typescript
// Tất cả trang manage đều có:
robots: {
  index: false  // Không index trang này
}
```

### 6.3 Bảng phân loại Index/NoIndex

| Trang | Index? | Lý do |
|-------|--------|-------|
| Homepage (`/`) | ✅ Yes | Trang công khai, cần SEO |
| Login (`/login`) | ✅ Yes | Trang công khai |
| Dish Detail (`/dishes/[slug]`) | ✅ Yes | Trang sản phẩm, cần SEO mạnh |
| About (`/about`) | ✅ Yes | Trang giới thiệu |
| Guest Menu (`/guest/menu`) | ❌ No | Trang riêng cho khách đã scan QR |
| Guest Orders (`/guest/orders`) | ❌ No (không set) | Nên thêm `index: false` |
| Tables/[number] (`/tables/[number]`) | ❌ No | Trang scan QR, không cần SEO |
| Manage Dashboard | ❌ No | Trang quản lý nội bộ |
| Manage Dishes | ❌ No | Trang quản lý nội bộ |
| Manage Orders | ❌ No | Trang quản lý nội bộ |
| Manage Tables | ❌ No | Trang quản lý nội bộ |
| Manage Accounts | ❌ No | Trang quản lý nội bộ |
| Manage Setting | ❌ No | Trang quản lý nội bộ |

---

## 7. Google Verification & Analytics

### 7.1 Google Site Verification

**File:** `public/googlefa93c50077f661ab.html`

```
google-site-verification: googlefa93c50077f661ab.html
```

Đây là file xác minh quyền sở hữu website với **Google Search Console**. Khi bạn thêm website vào Search Console, Google yêu cầu bạn đặt file này vào root để chứng minh bạn là chủ website.

**Lưu ý:** Trong `layout.tsx` có comment code cho phương pháp xác minh thứ 2 (meta tag):
```typescript
// other: {
//   'google-site-verification': 'KKr5Sgn6rrXntMUp1nDIoQR7mJQujE4BExrlgcFvGTg'
// }
```

### 7.2 Google Analytics (GA4) & Google Tag Manager

**File:** `src/components/google-tag.tsx`

```typescript
export default function GoogleTag() {
  return (
    <Fragment>
      {/* Load Google Tag Manager script */}
      <Script src='https://www.googletagmanager.com/gtag/js?id=G-G4XRFCFWTH' />
      <Script id='gtag-init' dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-G4XRFCFWTH');
        `
      }} />
    </Fragment>
  )
}
```

**Được sử dụng trong:** `src/app/[locale]/layout.tsx`
```typescript
<body>
  {/* ... app content ... */}
  <GoogleTag />  {/* Đặt cuối body để không block rendering */}
</body>
```

**Tác dụng:**
- Theo dõi lượng truy cập, hành vi người dùng
- Đo lường hiệu quả SEO (organic traffic)
- Phân tích trang nào được truy cập nhiều nhất
- Theo dõi tỷ lệ bounce rate, thời gian trên trang

---

## 8. SEO Utilities - Các hàm hỗ trợ SEO

### 8.1 `generateSlugUrl` — Tạo URL thân thiện SEO

**File:** `src/lib/utils.ts`

```typescript
import slugify from 'slugify'

export const generateSlugUrl = ({ name, id }: { name: string; id: number }) => {
  if (!name.trim()) return id.toString()
  return `${slugify(name, { lower: true, locale: 'vi' })}-${id}`
}
// Input:  { name: 'Phở Bò Tái', id: 1 }
// Output: 'pho-bo-tai-1'
```

**Tại sao slug URL quan trọng cho SEO?**
- ❌ `/dishes/1` → Google không biết trang này về gì
- ✅ `/dishes/pho-bo-tai-1` → Google hiểu đây là trang về "Phở Bò Tái"
- URL chứa keyword giúp tăng ranking cho keyword đó

### 8.2 `getIdFromSlugUrl` — Trích xuất ID từ slug

```typescript
export const getIdFromSlugUrl = (slug: string) => {
  if (!slug) return NaN
  const parts = slug.split('-')
  const lastPart = parts[parts.length - 1]
  return isNaN(Number(lastPart)) ? NaN : Number(lastPart)
}
// Input:  'pho-bo-tai-1'
// Output: 1
```

### 8.3 `htmlToTextForDescription` — Chuyển HTML thành text cho meta description

**File:** `src/lib/server-utils.ts`

```typescript
import { convert } from 'html-to-text'

export const htmlToTextForDescription = (html: string) => {
  return convert(html, {
    limits: { maxInputLength: 300 }  // Giới hạn 300 ký tự
  })
}
```

**Tại sao cần hàm này?**
- Description của món ăn có thể chứa HTML tags (`<b>`, `<p>`, `<br>`)
- Meta description cần plain text, không chứa HTML
- Giới hạn 300 ký tự vì Google chỉ hiển thị ~155-160 ký tự trong kết quả tìm kiếm

---

## 9. i18n & SEO đa ngôn ngữ

### 9.1 Cấu hình i18n

**File:** `src/config.ts`
```typescript
export const locales = ['en', 'vi'] as const
export const defaultLocale: Locale = 'vi'
```

**File:** `src/i18n/routing.ts`
```typescript
export const routing = defineRouting({
  locales: locales,
  defaultLocale: defaultLocale
})
```

### 9.2 Tác động đến SEO

| Yếu tố | Cách triển khai | Tác dụng SEO |
|---------|----------------|--------------|
| `<html lang={locale}>` | Layout.tsx | Google biết ngôn ngữ trang |
| URL prefix `/vi/`, `/en/` | Middleware + routing | Mỗi ngôn ngữ có URL riêng |
| Sitemap đa ngôn ngữ | sitemap.ts generate cho mỗi locale | Google index cả 2 phiên bản |
| OG locale | `locale: 'en_US'`, `alternateLocale: ['vi_VN']` | Social media hiển thị đúng ngôn ngữ |
| Middleware redirect | `src/middleware.ts` | Tự động redirect về locale phù hợp |

### 9.3 Luồng xử lý i18n cho SEO

```
User/Bot truy cập /dishes/pho-bo-1
        │
        ▼
Middleware (src/middleware.ts)
        │
        ├── Đọc cookie NEXT_LOCALE
        ├── Nếu không có → dùng defaultLocale ('vi')
        │
        ▼
Redirect → /vi/dishes/pho-bo-1
        │
        ▼
generateMetadata() chạy với locale='vi'
        │
        ▼
getTranslations({ locale: 'vi', namespace: 'DishDetail' })
        │
        ▼
Render HTML với <html lang="vi"> + metadata tiếng Việt
```

---

## 10. Semantic HTML & Image Optimization

### 10.1 Cấu trúc Heading (h1, h2, h3)

Dự án sử dụng heading hierarchy đúng chuẩn SEO:

**Homepage (`page.tsx`):**
```html
<h1>Big Boy Restaurant</h1>        <!-- Tiêu đề chính -->
<h2>Đa dạng các loại món ăn</h2>   <!-- Section heading -->
<h3>Phở Bò Tái</h3>                <!-- Tên từng món ăn -->
<h3>Bún Bò Huế</h3>
```

**Dish Detail (`dish-detail.tsx`):**
```html
<h1>Phở Bò Tái</h1>                <!-- Tên món ăn = tiêu đề chính -->
```

**About (`about/page.tsx`):**
```html
<h1>Về nhà hàng Big Boy</h1>
<h2>Câu chuyện của chúng tôi</h2>
```

### 10.2 Image Optimization cho SEO

Dự án sử dụng `next/image` với các thuộc tính SEO quan trọng:

```typescript
// Banner (above-the-fold)
<Image
  src='/banner.png'
  width={400} height={200}
  quality={85}
  priority={true}        // ✅ Preload cho above-the-fold
  alt='Banner'           // ✅ Alt text cho SEO
  sizes='100vw'          // ✅ Responsive sizes
/>

// Dish image (below-the-fold)
<Image
  src={dish.image}
  width={150} height={150}
  quality={80}
  loading='lazy'         // ✅ Lazy load cho below-the-fold
  alt={dish.name}        // ✅ Alt text = tên món ăn (keyword)
/>

// Dish detail page
<Image
  src={dish.image}
  width={700} height={700}
  quality={85}
  alt={dish.name}
  title={dish.name}      // ✅ Title attribute
  priority={false}
  sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px'
/>
```

**Tại sao Image Optimization quan trọng cho SEO?**
- `alt` text giúp Google hiểu nội dung ảnh → Xuất hiện trong Google Images
- `priority` + `loading='lazy'` cải thiện Core Web Vitals (LCP)
- `sizes` giúp trình duyệt tải đúng kích thước ảnh → Giảm bandwidth
- `quality` giảm file size → Tăng tốc độ tải trang

---

## 11. Tổng hợp: Luồng SEO Data Flow

### 11.1 Khi Google Bot crawl trang chi tiết món ăn

```
Google Bot
    │
    ▼
GET /vi/dishes/pho-bo-tai-1
    │
    ▼
Middleware (src/middleware.ts)
    ├── Xác nhận locale = 'vi' ✅
    ├── Không cần auth (public route) ✅
    └── Pass through
    │
    ▼
Next.js Server
    │
    ├── 1. generateMetadata() chạy trước
    │   ├── getIdFromSlugUrl('pho-bo-tai-1') → id = 1
    │   ├── getDetail(1) → gọi API: GET /dishes/1
    │   ├── getTranslations({ locale: 'vi', namespace: 'DishDetail' })
    │   └── Return: { title, description, openGraph, canonical }
    │
    ├── 2. Page component render
    │   ├── DishDetail component render HTML
    │   ├── <h1>Phở Bò Tái</h1>
    │   ├── <Image alt="Phở Bò Tái" />
    │   └── <p>{description}</p>
    │
    └── 3. Layout wraps everything
        ├── <html lang="vi">
        ├── Title template: "Phở Bò Tái | Big Boy Restaurant"
        ├── baseOpenGraph merged
        └── <GoogleTag /> (analytics)
    │
    ▼
HTML Response → Google Bot nhận được:
    ├── <title>Phở Bò Tái | Big Boy Restaurant</title>
    ├── <meta name="description" content="..." />
    ├── <meta property="og:*" content="..." />
    ├── <link rel="canonical" href="..." />
    ├── <h1>Phở Bò Tái</h1>
    ├── <img alt="Phở Bò Tái" />
    └── Nội dung đầy đủ (SSR/SSG)
```

### 11.2 Tóm tắt luồng (Summarized Flow)

```
Google Bot → robots.txt → sitemap.xml → Crawl URLs
                                            │
                                            ▼
                                    Middleware (i18n + auth)
                                            │
                                            ▼
                                    generateMetadata() → <head> tags
                                            │
                                            ▼
                                    Page Component → <body> content (SSR/SSG)
                                            │
                                            ▼
                                    Full HTML Response → Google Index
```

---

## 12. Bảng phân tích SEO theo từng Route

| Route | Title | Description | OG | Canonical | Robots | Rendering | SEO Score |
|-------|-------|-------------|-----|-----------|--------|-----------|-----------|
| `/[locale]` (Home) | ✅ Dynamic (i18n) | ✅ Dynamic (i18n) | ✅ Kế thừa layout | ✅ | Index | SSG | ⭐⭐⭐⭐ |
| `/[locale]/login` | ✅ Dynamic (i18n) | ✅ Dynamic (i18n) | ✅ Kế thừa layout | ✅ | Index | SSG | ⭐⭐⭐ |
| `/[locale]/dishes/[slug]` | ✅ Dynamic (API) | ✅ Dynamic (API) | ✅ Full (ảnh, URL) | ✅ | Index | SSR | ⭐⭐⭐⭐⭐ |
| `/[locale]/about` | ❌ Không set | ❌ Không set | ❌ Kế thừa layout | ❌ | Index | SSG | ⭐⭐ |
| `/[locale]/guest/menu` | ✅ Dynamic (i18n) | ✅ Dynamic (i18n) | ✅ Full | ✅ | NoIndex | SSG | ⭐⭐⭐ |
| `/[locale]/guest/orders` | ❌ Không set | ❌ Không set | ❌ | ❌ | Index (lỗi!) | Static | ⭐ |
| `/[locale]/tables/[number]` | ✅ Dynamic | ✅ Dynamic (i18n) | ✅ Full | ✅ | NoIndex | SSR | ⭐⭐⭐ |
| `/[locale]/manage/*` | ✅ Dynamic (i18n) | ✅ Dynamic (i18n) | ❌ Kế thừa layout | ✅ | NoIndex | SSG | ⭐⭐⭐ |

---

## 13. Các cách tăng SEO trong NextJS

### 13.1 Những gì dự án ĐÃ LÀM TỐT ✅

| Kỹ thuật | File | Mô tả |
|----------|------|-------|
| **Sitemap động** | `src/app/sitemap.ts` | Generate sitemap từ API, hỗ trợ đa ngôn ngữ |
| **Robots.txt** | `src/app/robots.ts` | Cho phép crawl + trỏ đến sitemap |
| **Dynamic Metadata** | Mỗi `page.tsx` | Title, description riêng cho từng trang |
| **Open Graph** | `shared-metadata.ts` + pages | Social media preview đẹp |
| **Canonical URL** | Mỗi `page.tsx` | Tránh duplicate content |
| **Robots meta tag** | Manage pages | NoIndex cho trang quản lý |
| **SEO-friendly URL** | `generateSlugUrl()` | URL chứa keyword: `/dishes/pho-bo-tai-1` |
| **SSR/SSG** | Next.js App Router | Content render server-side, Google crawl được |
| **i18n** | next-intl | Đa ngôn ngữ với URL prefix |
| **`<html lang>`** | Layout.tsx | Khai báo ngôn ngữ trang |
| **Semantic HTML** | Pages | h1, h2, h3 hierarchy đúng chuẩn |
| **Image alt text** | Tất cả Image | Alt text = tên món ăn |
| **Image optimization** | next/image | Lazy load, responsive sizes, quality |
| **Google Analytics** | `google-tag.tsx` | Theo dõi traffic |
| **Google Verification** | `public/googlefa93c50077f661ab.html` | Xác minh Search Console |
| **Font optimization** | Layout.tsx | `next/font/google` tự host font |

### 13.2 Các kỹ thuật SEO NÂNG CAO có thể áp dụng trong NextJS

#### 1. Structured Data (JSON-LD) — Chưa có trong dự án

Structured Data giúp Google hiểu nội dung trang ở mức sâu hơn, có thể hiển thị **Rich Snippets** (đánh giá sao, giá, hình ảnh) trong kết quả tìm kiếm.

```typescript
// Ví dụ cho trang chi tiết món ăn
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MenuItem',
  name: dish.name,
  description: dish.description,
  image: dish.image,
  offers: {
    '@type': 'Offer',
    price: dish.price,
    priceCurrency: 'VND'
  }
}

// Thêm vào page component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
/>
```

#### 2. Hreflang Tags — Chưa đầy đủ

Hreflang cho Google biết mối quan hệ giữa các phiên bản ngôn ngữ của cùng 1 trang:

```typescript
// Thêm vào generateMetadata
return {
  alternates: {
    canonical: url,
    languages: {
      'vi': `${envConfig.NEXT_PUBLIC_URL}/vi/dishes/${slug}`,
      'en': `${envConfig.NEXT_PUBLIC_URL}/en/dishes/${slug}`,
    }
  }
}
```

**HTML output:**
```html
<link rel="alternate" hreflang="vi" href="https://bigboy.com/vi/dishes/pho-bo-1" />
<link rel="alternate" hreflang="en" href="https://bigboy.com/en/dishes/pho-bo-1" />
```

#### 3. Twitter Card Meta Tags

```typescript
// Thêm vào shared-metadata.ts hoặc generateMetadata
twitter: {
  card: 'summary_large_image',
  title: dish.name,
  description: dish.description,
  images: [dish.image],
}
```

#### 4. Favicon đầy đủ

Dự án hiện có `icon.png` và `apple-icon.png` trong `src/app/`. Có thể bổ sung thêm:

```
src/app/
├── favicon.ico          // Favicon truyền thống
├── icon.png             // ✅ Đã có
├── apple-icon.png       // ✅ Đã có
├── opengraph-image.png  // OG image mặc định (Next.js tự detect)
└── manifest.ts          // Web App Manifest (PWA)
```

#### 5. ISR (Incremental Static Regeneration)

Cho phép trang tĩnh tự động cập nhật sau một khoảng thời gian:

```typescript
// Trong page.tsx hoặc fetch options
export const revalidate = 3600 // Revalidate mỗi 1 giờ
```

#### 6. Loading UI & Streaming

Cải thiện Core Web Vitals (LCP, FID) bằng cách hiển thị loading state nhanh:

```typescript
// src/app/[locale]/(public)/dishes/[slug]/loading.tsx
export default function Loading() {
  return <DishDetailSkeleton />
}
```

#### 7. Error Handling cho SEO

```typescript
// src/app/[locale]/not-found.tsx
export const metadata = {
  title: 'Không tìm thấy trang',
  robots: { index: false }
}
```

---

## 14. Đề xuất cải thiện cho dự án

### 14.1 Các vấn đề cần fix (Priority cao)

| # | Vấn đề | File | Mức độ |
|---|--------|------|--------|
| 1 | `/guest/orders` thiếu `generateMetadata` và `robots: { index: false }` | `src/app/[locale]/guest/orders/page.tsx` | 🔴 Cao |
| 2 | `/about` thiếu `generateMetadata` hoàn toàn (không có title, description, canonical) | `src/app/[locale]/(public)/about/page.tsx` | 🔴 Cao |
| 3 | Thiếu hreflang tags cho tất cả các trang (Google không biết `/vi` và `/en` là cùng 1 nội dung) | Tất cả `generateMetadata` | 🟡 Trung bình |
| 4 | Thiếu Structured Data (JSON-LD) cho trang chi tiết món ăn | `dishes/[slug]/page.tsx` | 🟡 Trung bình |
| 5 | Thiếu Twitter Card meta tags | `shared-metadata.ts` | 🟢 Thấp |

### 14.2 Checklist SEO của dự án (theo SEO-Checlist.md)

| Checklist Item | Trạng thái | Ghi chú |
|---------------|-----------|---------|
| Content SEO viewsource phải thấy | ✅ Đạt | SSR/SSG render HTML đầy đủ |
| Title, meta description đầy đủ | ⚠️ Gần đạt | Thiếu ở `/about` và `/guest/orders` |
| Open Graph cho mạng xã hội | ✅ Đạt | baseOpenGraph + override per page |
| robots.txt | ✅ Đạt | `src/app/robots.ts` |
| sitemap.xml | ✅ Đạt | `src/app/sitemap.ts` với error handling |
| favicon.ico | ✅ Đạt | `icon.png` + `apple-icon.png` |
| Google Search Console | ✅ Đạt | `googlefa93c50077f661ab.html` |
| Google Analytics | ✅ Đạt | `google-tag.tsx` với GA4 |

### 14.3 Tổng kết

Dự án đã triển khai **~80% các kỹ thuật SEO cần thiết** cho một ứng dụng NextJS. Các điểm mạnh nổi bật:

- **Dynamic metadata** cho từng trang với i18n
- **SEO-friendly URL** với slug tiếng Việt
- **Sitemap động** generate từ API
- **Phân loại index/noindex** hợp lý giữa trang public và manage

Các điểm cần cải thiện chủ yếu là:
- Bổ sung metadata cho các trang còn thiếu (`/about`, `/guest/orders`)
- Thêm hreflang tags cho SEO đa ngôn ngữ
- Thêm Structured Data (JSON-LD) cho Rich Snippets

---

> 📝 **Lưu ý từ SEO-Checlist.md:** "Content is King, Backlink is Queen" — Kỹ thuật SEO onpage chỉ là nền tảng. Để thực sự lên TOP Google, cần kết hợp với content chất lượng và chiến lược backlink.
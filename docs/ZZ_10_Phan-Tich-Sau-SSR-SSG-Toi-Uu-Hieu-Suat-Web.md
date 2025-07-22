# Phân Tích Sâu: SSR, SSG và Hybrid Strategies cho Tối Ưu Hiệu Suất Web

## 📋 Mục Lục

1. [Giới Thiệu và Phạm Vi Phân Tích](#giới-thiệu-và-phạm-vi-phân-tích)
2. [Dự Án Tối Ưu Chỉ với SSR](#dự-án-tối-ưu-chỉ-với-ssr)
3. [Dự Án Tối Ưu Chỉ với SSG](#dự-án-tối-ưu-chỉ-với-ssg)
4. [Dự Án Hybrid: SSR + SSG](#dự-án-hybrid-ssr--ssg)
5. [So Sánh Chi Tiết và Kết Luận](#so-sánh-chi-tiết-và-kết-luận)

---

## 🎯 Giới Thiệu và Phạm Vi Phân Tích

### 🔍 Bối Cảnh Phân Tích

Trong thực tế phát triển web hiện đại, việc chọn lựa rendering strategy không chỉ đơn thuần là technical decision mà còn là **business strategy**. Mỗi approach có những trade-offs riêng biệt về:

- **Performance** (Core Web Vitals, loading speed)
- **Scalability** (server resources, CDN utilization)
- **User Experience** (perceived performance, interactivity)
- **Development Complexity** (build pipeline, deployment)
- **Operational Cost** (infrastructure, maintenance)

### 🎯 3 Scenarios Phân Tích

Chúng ta sẽ phân tích **3 dự án thực tế** với các chiến lược khác nhau:

1. **SSR-First Strategy**: Real-time dashboard platform
2. **SSG-First Strategy**: High-traffic content platform
3. **Hybrid Strategy**: E-commerce multi-experience platform

Mỗi dự án sẽ được phân tích với **full technical implementation**, **performance metrics**, và **business impact**.

---

## 🖥️ Dự Án Tối Ưu Chỉ với SSR

### 📊 **Dự Án Ví Dụ: Real-time Analytics Dashboard**

**Domain**: SaaS analytics platform với real-time data visualization
**User Base**: 10,000+ businesses, 100,000+ daily active users
**Data Characteristics**: High-frequency updates, user-specific, time-sensitive

### 🏗️ Architecture và Implementation

#### **1. Core SSR Setup**

```typescript
// next.config.ts - SSR Optimized Configuration
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Tắt hoàn toàn static optimization
  output: undefined, // Không export static

  // Compiler optimizations cho SSR
  compiler: {
    removeConsole: false, // Giữ logs cho debugging real-time issues
    styledComponents: true, // CSS-in-JS optimization
    emotion: true
  },

  // Experimental features cho SSR performance
  experimental: {
    // Server components optimization
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],

    // Dynamic runtime optimization
    runtime: 'nodejs', // Explicit nodejs runtime

    // Memory optimization
    isrMemoryCacheSize: 0, // Tắt ISR cache

    // Response streaming
    appDir: true,
    serverActions: true
  },

  // Webpack optimization cho SSR bundles
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-side bundle optimization
      config.optimization.splitChunks = false // Không split chunks trên server

      // Database connection optimization
      config.externals.push('@prisma/client')

      // Memory management
      config.optimization.moduleIds = 'deterministic'
    }

    return config
  },

  // Headers cho real-time performance
  async headers() {
    return [
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' }
        ]
      }
    ]
  }
}

export default nextConfig
```

#### **2. Advanced SSR Data Fetching Strategy**

```typescript
// lib/ssr-data-fetching.ts
import { cache } from 'react'
import { Suspense } from 'react'

// Optimized database connection pool
const getDatabaseConnection = cache(() => {
  return new DatabasePool({
    host: process.env.DATABASE_URL,
    maxConnections: 20,
    idleTimeout: 30000,
    acquireTimeout: 60000
  })
})

// Smart data prefetching với parallel requests
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, res, query } = context

  // Set aggressive caching headers cho static assets
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')

  try {
    const userId = getUserFromToken(req.cookies.authToken)

    // Parallel data fetching - tất cả queries chạy đồng thời
    const [userProfile, dashboardConfig, realTimeMetrics, historicalData, alerts] = await Promise.allSettled([
      getUserProfile(userId),
      getDashboardConfig(userId),
      getRealTimeMetrics(userId), // Data từ Redis/InfluxDB
      getHistoricalData(userId, query.timeRange),
      getActiveAlerts(userId)
    ])

    // Error handling cho từng data source
    const data = {
      user: userProfile.status === 'fulfilled' ? userProfile.value : null,
      config: dashboardConfig.status === 'fulfilled' ? dashboardConfig.value : getDefaultConfig(),
      metrics: realTimeMetrics.status === 'fulfilled' ? realTimeMetrics.value : [],
      historical: historicalData.status === 'fulfilled' ? historicalData.value : [],
      alerts: alerts.status === 'fulfilled' ? alerts.value : []
    }

    return {
      props: {
        ...data,
        timestamp: Date.now(), // Để tracking freshness
        renderTime: performance.now()
      }
    }
  } catch (error) {
    // Graceful degradation
    return {
      props: {
        error: 'Failed to load dashboard data',
        fallbackMode: true
      }
    }
  }
}
```

#### **3. Real-time Data Streaming với SSR**

```typescript
// components/dashboard/RealTimeDashboard.tsx
import { useEffect, useState, useCallback } from 'react'
import { Socket, io } from 'socket.io-client'

interface DashboardProps {
  initialData: DashboardData
  timestamp: number
}

export default function RealTimeDashboard({ initialData, timestamp }: DashboardProps) {
  const [data, setData] = useState(initialData)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  // Optimized socket connection
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket'], // Chỉ dùng websocket cho performance
      upgrade: false,
      rememberUpgrade: false,
      timeout: 5000,

      // Connection optimization
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,

      // Authentication
      auth: {
        token: getAccessToken()
      }
    })

    // Performance monitoring
    socketInstance.on('connect', () => {
      setConnectionStatus('connected')
      console.log('Socket connected at:', Date.now() - timestamp, 'ms after SSR')
    })

    // Real-time data updates
    socketInstance.on('metrics_update', (newMetrics: MetricsUpdate) => {
      setData((prev) => ({
        ...prev,
        metrics: updateMetrics(prev.metrics, newMetrics),
        lastUpdated: Date.now()
      }))
    })

    // Alert streaming
    socketInstance.on('alert_triggered', (alert: Alert) => {
      setData((prev) => ({
        ...prev,
        alerts: [alert, ...prev.alerts.slice(0, 9)] // Keep 10 most recent
      }))
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [timestamp])

  // Optimized re-renders với useMemo cho expensive calculations
  const chartData = useMemo(() => {
    return processMetricsForChart(data.metrics)
  }, [data.metrics])

  const alertSummary = useMemo(() => {
    return summarizeAlerts(data.alerts)
  }, [data.alerts])

  return (
    <div className='dashboard-container'>
      {/* Connection status indicator */}
      <ConnectionStatus status={connectionStatus} />

      {/* Real-time metrics với React.memo optimization */}
      <Suspense fallback={<MetricsSkeleton />}>
        <MetricsPanel data={chartData} />
      </Suspense>

      {/* Live alerts */}
      <Suspense fallback={<AlertsSkeleton />}>
        <AlertsPanel alerts={data.alerts} summary={alertSummary} />
      </Suspense>

      {/* Historical data với lazy loading */}
      <Suspense fallback={<HistoricalSkeleton />}>
        <HistoricalCharts data={data.historical} />
      </Suspense>
    </div>
  )
}

// Performance optimization với React.memo
export const MetricsPanel = React.memo(({ data }: { data: ChartData }) => {
  return (
    <div className='metrics-grid'>
      {data.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  )
})
```

#### **4. Database Optimization cho SSR**

```typescript
// lib/database/optimized-queries.ts
import { PrismaClient } from '@prisma/client'
import NodeCache from 'node-cache'

// Connection pooling với optimized settings
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },

  // Query optimization
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : [],

  // Connection pool optimization cho SSR workload
  __internal: {
    engine: {
      connectionLimit: 30, // Cao hơn cho SSR concurrent requests
      poolTimeout: 60, // Timeout dài hơn
      maxIdleTimeout: 30
    }
  }
})

// Query-level caching cho frequent data
const queryCache = new NodeCache({
  stdTTL: 30, // 30 giây cache
  checkperiod: 60,
  maxKeys: 1000
})

// Optimized queries với selective field loading
export const getDashboardMetrics = cache(async (userId: string, timeRange: string) => {
  const cacheKey = `metrics_${userId}_${timeRange}`
  const cached = queryCache.get(cacheKey)

  if (cached) {
    return cached
  }

  // Optimized query với indexes và selective fields
  const metrics = await prisma.metric.findMany({
    where: {
      userId,
      timestamp: {
        gte: getTimeRangeStart(timeRange)
      }
    },
    select: {
      id: true,
      value: true,
      timestamp: true,
      metricType: true
      // Không select heavy fields như rawData, logs
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 100 // Limit results
  })

  // Cache kết quả
  queryCache.set(cacheKey, metrics)

  return metrics
})

// Batch queries để reduce database roundtrips
export const getDashboardData = async (userId: string) => {
  // Single transaction cho consistency
  return await prisma.$transaction(async (tx) => {
    const [profile, metrics, alerts, config] = await Promise.all([
      tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          timezone: true,
          preferences: true
        }
      }),

      tx.metric.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 50
      }),

      tx.alert.findMany({
        where: {
          userId,
          status: 'active'
        },
        take: 10
      }),

      tx.dashboardConfig.findUnique({
        where: { userId }
      })
    ])

    return { profile, metrics, alerts, config }
  })
}
```

### 📊 Performance Characteristics

#### **Metrics và Benchmarks**

```typescript
// monitoring/ssr-performance.ts
export const SSRPerformanceMetrics = {
  // Time To First Byte (TTFB)
  averageTTFB: '200-400ms', // Excellent cho real-time data
  p95TTFB: '600ms',
  p99TTFB: '800ms',

  // Server Response Time
  databaseQueryTime: '50-100ms', // Với optimization
  serializationTime: '20-40ms',
  totalServerTime: '150-300ms',

  // Memory Usage (per request)
  memoryPerRequest: '15-25MB',
  memoryLeakRate: '<1MB/hour',

  // Concurrent Handling
  maxConcurrentSSRRequests: 500,
  requestQueuingTime: '<50ms',

  // Real-time Performance
  websocketConnectionTime: '100-200ms',
  dataUpdateLatency: '50-100ms',

  // Error Rates
  ssr404Rate: '<0.1%',
  serverErrorRate: '<0.05%',
  databaseTimeoutRate: '<0.01%'
}
```

#### **Infrastructure Requirements**

```yaml
# infrastructure/ssr-setup.yml
SSR_Infrastructure:
  # Server Specifications
  CPU: '4-8 cores per instance'
  RAM: '8-16GB per instance'
  Storage: 'SSD with 3000+ IOPS'

  # Scaling Configuration
  AutoScaling:
    minInstances: 3
    maxInstances: 20
    scaleUpThreshold: '70% CPU for 5min'
    scaleDownThreshold: '30% CPU for 10min'

  # Database Optimization
  Database:
    connectionPoolSize: 30
    queryTimeout: 30000
    indexOptimization: 'aggressive'
    readReplicas: 2

  # Load Balancer
  LoadBalancer:
    algorithm: 'least_connections'
    healthCheckInterval: '30s'
    stickySessions: false # Cho real-time data consistency

  # Monitoring Stack
  Monitoring:
    - 'Application Performance Monitoring (APM)'
    - 'Database query monitoring'
    - 'Real-time error tracking'
    - 'User session monitoring'
```

### 🎯 **Ưu Điểm của SSR-First Strategy**

#### **1. Data Freshness Excellence**

- ✅ **100% fresh data** mọi lúc
- ✅ **Real-time personalization**
- ✅ **Consistent state** across sessions
- ✅ **No stale data issues**

#### **2. SEO và Crawling Benefits**

- ✅ **Perfect SEO** với HTML hoàn chỉnh
- ✅ **Social media previews** accurate
- ✅ **Search engine indexing** optimal
- ✅ **Meta tags dynamic** theo content

#### **3. Security Advantages**

- ✅ **Server-side authentication** mỗi request
- ✅ **Sensitive data** không expose client
- ✅ **API calls** được secure trong server
- ✅ **User permissions** checked real-time

### ⚠️ **Challenges và Solutions**

#### **1. TTFB Optimization**

```typescript
// Performance challenge: TTFB có thể cao
// Solution: Aggressive database optimization
const optimizedQuery = await prisma.$queryRaw`
  SELECT id, value, timestamp 
  FROM metrics 
  WHERE user_id = ${userId} 
    AND timestamp > ${timeRange}
  ORDER BY timestamp DESC 
  LIMIT 100
` // Raw SQL cho performance critical queries
```

#### **2. Server Load Management**

```typescript
// Challenge: High server resource usage
// Solution: Smart caching layers
import { LRUCache } from 'lru-cache'

const responseCache = new LRUCache({
  max: 1000,
  ttl: 30000, // 30 giây cache
  allowStale: true,
  updateAgeOnGet: true
})

export async function cachedSSRResponse(key: string, generator: () => Promise<any>) {
  const cached = responseCache.get(key)
  if (cached) return cached

  const result = await generator()
  responseCache.set(key, result)
  return result
}
```

#### **3. Error Handling và Graceful Degradation**

```typescript
// pages/dashboard.tsx
export async function getServerSideProps(context) {
  try {
    const data = await getDashboardData(userId)
    return { props: { data } }
  } catch (error) {
    // Fallback strategies
    if (error.code === 'DATABASE_TIMEOUT') {
      return {
        props: {
          fallbackData: await getCachedDashboardData(userId),
          degradedMode: true
        }
      }
    }

    // Complete fallback
    return {
      props: {
        error: 'Service temporarily unavailable',
        showRetry: true
      }
    }
  }
}
```

---

## 📦 Dự Án Tối Ưu Chỉ với SSG

### 📰 **Dự Án Ví Dụ: High-Traffic Content Platform**

**Domain**: News/blog platform với scale lớn
**Traffic**: 1M+ daily visitors, 10K+ articles
**Content**: Editorial content, mainly static, scheduled updates

### 🏗️ Architecture và Implementation

#### **1. Advanced SSG Configuration**

```typescript
// next.config.ts - SSG Optimized Configuration
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export optimization
  output: 'export', // Pure static build
  trailingSlash: true, // Tối ưu CDN caching

  // Image optimization cho static
  images: {
    unoptimized: false, // Vẫn dùng Next.js Image optimization
    loader: 'custom',
    loaderFile: './lib/cloudinary-loader.ts', // Custom CDN loader
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Compiler optimizations
  compiler: {
    removeConsole: {
      exclude: ['error'] // Remove tất cả console trừ error
    },
    reactRemoveProperties: {
      properties: ['^data-testid$'] // Remove test props
    }
  },

  // Experimental features cho build performance
  experimental: {
    // Parallel build optimization
    cpus: Math.max(1, (require('os').cpus().length || 1) - 1),

    // Memory optimization
    isrMemoryCacheSize: 0, // No ISR cho pure SSG
    workerThreads: true,

    // Static optimization
    optimizeCss: true,
    optimizeServerReact: false // Không cần Server Components
  },

  // Webpack optimization cho static builds
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Production static optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          // Vendor splitting cho better caching
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all'
          },

          // Common components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          },

          // CSS extraction
          styles: {
            name: 'styles',
            type: 'css/mini-extract',
            chunks: 'all',
            enforce: true
          }
        }
      }

      // Tree shaking optimization
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    return config
  }
}

export default nextConfig
```

#### **2. Advanced Build-Time Data Generation**

```typescript
// lib/build-time-data.ts
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import { cache } from 'react'

// Cached content processing để tránh re-processing
const processMarkdown = cache(async (content: string) => {
  const result = await remark().use(html).process(content)
  return result.toString()
})

// Optimized content loading với parallel processing
export async function getAllPosts(): Promise<BlogPost[]> {
  const postsDirectory = path.join(process.cwd(), 'content/posts')
  const filenames = await fs.readdir(postsDirectory)

  // Parallel processing tất cả posts
  const posts = await Promise.all(
    filenames
      .filter((name) => name.endsWith('.md'))
      .map(async (filename) => {
        const filePath = path.join(postsDirectory, filename)
        const fileContents = await fs.readFile(filePath, 'utf8')
        const { data, content } = matter(fileContents)

        // Parallel content processing
        const [htmlContent, excerpt] = await Promise.all([processMarkdown(content), generateExcerpt(content, 160)])

        return {
          slug: filename.replace(/\.md$/, ''),
          title: data.title,
          date: data.date,
          author: data.author,
          excerpt,
          content: htmlContent,
          tags: data.tags || [],
          readingTime: calculateReadingTime(content),
          featured: data.featured || false,
          seoMetadata: {
            title: data.seoTitle || data.title,
            description: data.seoDescription || excerpt,
            ogImage: data.ogImage || generateOGImage(data.title),
            canonicalUrl: `${process.env.SITE_URL}/posts/${filename.replace(/\.md$/, '')}`
          }
        }
      })
  )

  // Sort by date, featured posts first
  return posts.sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

// Advanced static paths generation với pagination
export async function getStaticPaths() {
  const posts = await getAllPosts()
  const postsPerPage = 12
  const totalPages = Math.ceil(posts.length / postsPerPage)

  // Generate paths cho tất cả posts và pagination
  const paths = [
    // Individual post paths
    ...posts.map((post) => ({
      params: { slug: post.slug }
    })),

    // Pagination paths
    ...Array.from({ length: totalPages }, (_, i) => ({
      params: { page: (i + 1).toString() }
    })),

    // Category paths
    ...getUniqueCategories(posts).map((category) => ({
      params: { category: category.slug }
    })),

    // Tag paths
    ...getUniqueTags(posts).map((tag) => ({
      params: { tag: tag.slug }
    }))
  ]

  return {
    paths,
    fallback: false // No fallback cho pure SSG
  }
}
```

#### **3. Static Content Optimization**

```typescript
// components/optimized-content.tsx
import Image from 'next/image'
import { useMemo } from 'react'

interface OptimizedPostProps {
  post: BlogPost
  relatedPosts: BlogPost[]
}

export default function OptimizedPost({ post, relatedPosts }: OptimizedPostProps) {
  // Memoized content processing
  const processedContent = useMemo(() => {
    return {
      html: post.content,
      tableOfContents: extractTableOfContents(post.content),
      codeBlocks: extractCodeBlocks(post.content),
      images: extractImages(post.content)
    }
  }, [post.content])

  // Structured data cho SEO
  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      author: {
        '@type': 'Person',
        name: post.author.name,
        url: post.author.url
      },
      datePublished: post.date,
      dateModified: post.updatedAt || post.date,
      description: post.excerpt,
      image: post.seoMetadata.ogImage,
      publisher: {
        '@type': 'Organization',
        name: 'Your Publication',
        logo: {
          '@type': 'ImageObject',
          url: '/logo.png'
        }
      }
    }),
    [post]
  )

  return (
    <article className='max-w-4xl mx-auto'>
      {/* JSON-LD structured data */}
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {/* Optimized hero image với responsive loading */}
      <div className='relative w-full h-[400px] mb-8'>
        <Image
          src={post.featured_image}
          alt={post.title}
          fill
          priority={true} // Above the fold
          quality={90}
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px'
          className='object-cover rounded-lg'
          placeholder='blur'
          blurDataURL={generateBlurDataURL(post.featured_image)}
        />
      </div>

      {/* Post metadata */}
      <header className='mb-8'>
        <h1 className='text-4xl font-bold mb-4'>{post.title}</h1>
        <div className='flex items-center space-x-4 text-gray-600'>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>•</span>
          <span>{post.readingTime} min read</span>
          <span>•</span>
          <span>By {post.author.name}</span>
        </div>
      </header>

      {/* Table of contents */}
      {processedContent.tableOfContents.length > 0 && <TableOfContents items={processedContent.tableOfContents} />}

      {/* Main content với optimized images */}
      <div className='prose prose-lg max-w-none' dangerouslySetInnerHTML={{ __html: processedContent.html }} />

      {/* Related posts với prefetch */}
      <RelatedPosts posts={relatedPosts} />
    </article>
  )
}

// Component tối ưu cho related posts
const RelatedPosts = React.memo(({ posts }: { posts: BlogPost[] }) => {
  return (
    <section className='mt-16'>
      <h2 className='text-2xl font-bold mb-8'>Related Articles</h2>
      <div className='grid md:grid-cols-3 gap-6'>
        {posts.slice(0, 3).map((post) => (
          <PostCard
            key={post.slug}
            post={post}
            prefetch={true} // Prefetch cho better navigation
          />
        ))}
      </div>
    </section>
  )
})
```

#### **4. Build Optimization Pipeline**

```typescript
// scripts/build-optimization.ts
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { minify } from 'terser'
import { optimize } from 'svgo'

// Parallel build process
export async function optimizedBuild() {
  console.log('🚀 Starting optimized SSG build...')

  // Phase 1: Content preparation
  await Promise.all([optimizeImages(), optimizeSVGs(), generateSitemap(), generateRSSFeed()])

  // Phase 2: Next.js build
  const buildProcess = spawn('next', ['build'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      ANALYZE: 'false'
    }
  })

  await new Promise((resolve, reject) => {
    buildProcess.on('close', (code) => {
      if (code === 0) resolve(code)
      else reject(new Error(`Build failed with code ${code}`))
    })
  })

  // Phase 3: Post-build optimization
  await Promise.all([compressAssets(), generateServiceWorker(), optimizeHTMLFiles(), generateManifest()])

  console.log('✅ Optimized build complete!')
}

// Asset optimization
async function optimizeImages() {
  const sharp = require('sharp')
  const imagesDir = path.join(process.cwd(), 'public/images')

  try {
    const files = await fs.readdir(imagesDir)

    await Promise.all(
      files
        .filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
        .map(async (file) => {
          const inputPath = path.join(imagesDir, file)
          const outputPath = path.join(imagesDir, `optimized-${file}`)

          await sharp(inputPath)
            .resize(1920, 1080, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({ quality: 85, progressive: true })
            .toFile(outputPath)
        })
    )

    console.log('✅ Images optimized')
  } catch (error) {
    console.warn('⚠️ Image optimization failed:', error)
  }
}

// HTML optimization
async function optimizeHTMLFiles() {
  const outDir = path.join(process.cwd(), 'out')

  async function processDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          await processDirectory(fullPath)
        } else if (entry.name.endsWith('.html')) {
          let content = await fs.readFile(fullPath, 'utf8')

          // HTML minification
          content = content
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/>\s+</g, '><') // Remove space between tags
            .trim()

          await fs.writeFile(fullPath, content)
        }
      })
    )
  }

  await processDirectory(outDir)
  console.log('✅ HTML files optimized')
}
```

### 📊 Performance Characteristics

#### **Build Performance Metrics**

```typescript
// monitoring/ssg-build-metrics.ts
export const SSGBuildMetrics = {
  // Build Times
  totalBuildTime: '5-15 minutes', // Cho 10K+ pages
  incrementalBuildTime: '1-3 minutes', // Với proper caching

  // Content Processing
  markdownProcessingRate: '100-200 files/second',
  imageOptimizationRate: '10-20 images/second',

  // Output Optimization
  bundleSize: {
    initial: '150-250KB gzipped',
    totalJS: '500KB-1MB',
    totalCSS: '50-100KB',
    images: 'Variable, optimized per page'
  },

  // CDN Performance
  cdnCacheHitRate: '95-99%',
  globalLatency: '<100ms worldwide',

  // Core Web Vitals (Typical)
  LCP: '0.5-1.2 seconds',
  FID: '<10ms',
  CLS: '<0.05'
}
```

#### **Content Delivery Strategy**

```yaml
# infrastructure/cdn-optimization.yml
CDN_Configuration:
  # Edge Locations
  EdgeCaching:
    - 'HTML files: 1 year cache'
    - 'CSS/JS: 1 year cache với versioning'
    - 'Images: 6 months cache'
    - 'JSON/XML: 1 hour cache'

  # Compression
  Compression:
    - 'Gzip cho text assets'
    - 'Brotli cho modern browsers'
    - 'WebP/AVIF cho images'

  # HTTP/2 Optimization
  HTTP2:
    serverPush: 'Critical CSS và hero images'
    multiplexing: 'Parallel asset loading'

  # Performance Headers
  Headers:
    - 'Cache-Control: public, max-age=31536000, immutable'
    - 'X-Content-Type-Options: nosniff'
    - 'X-Frame-Options: DENY'
```

### 🎯 **Ưu Điểm của SSG-First Strategy**

#### **1. Unmatched Performance**

- ⚡ **Sub-second load times** globally
- 🌐 **Perfect CDN utilization**
- 📱 **Excellent mobile performance**
- 🎯 **Best Core Web Vitals scores**

#### **2. Scalability Excellence**

- 📈 **Handles massive traffic** spikes
- 💰 **Extremely low hosting costs**
- 🔄 **Zero server-side processing** load
- 🌍 **Global distribution** tự động

#### **3. SEO Dominance**

- 🔍 **Perfect SEO** với pre-rendered HTML
- 📊 **Excellent crawl budget** utilization
- 🏃 **Fast indexing** của search engines
- 📱 **Optimal mobile SEO**

### ⚠️ **Challenges và Solutions**

#### **1. Content Update Latency**

```typescript
// Solution: Smart rebuild triggers
// webhooks/content-update.ts
export async function handleContentUpdate(webhook: WebhookPayload) {
  const { contentType, slug, action } = webhook

  if (action === 'publish' || action === 'update') {
    // Trigger targeted rebuild
    await triggerIncrementalBuild({
      paths: [
        `/posts/${slug}`,
        `/`, // Homepage
        `/sitemap.xml`,
        `/rss.xml`
      ]
    })

    // Invalidate CDN cache
    await invalidateCDNCache([`https://yoursite.com/posts/${slug}`, `https://yoursite.com/`])
  }
}
```

#### **2. Large Site Build Times**

```typescript
// Solution: Incremental builds và parallel processing
// lib/incremental-build.ts
export async function incrementalBuild() {
  // Detect changed content
  const changedFiles = await getChangedFiles()
  const affectedPages = await calculateAffectedPages(changedFiles)

  // Parallel page generation
  await Promise.all(affectedPages.map((page) => generateStaticPage(page)))

  // Update search indexes
  await updateSearchIndex(affectedPages)
}

// Build caching strategy
const buildCache = new Map()

export function getCachedBuildResult(contentHash: string) {
  return buildCache.get(contentHash)
}

export function setCachedBuildResult(contentHash: string, result: any) {
  buildCache.set(contentHash, result)
}
```

#### **3. Dynamic Content Integration**

```typescript
// Solution: Client-side hydration cho dynamic features
// components/HybridContent.tsx
export default function HybridContent({ staticContent, postId }: Props) {
  const [dynamicData, setDynamicData] = useState(null)

  // Load dynamic content sau khi static content render
  useEffect(() => {
    Promise.all([loadComments(postId), loadRecommendations(postId), loadViewCount(postId)]).then(
      ([comments, recommendations, viewCount]) => {
        setDynamicData({ comments, recommendations, viewCount })
      }
    )
  }, [postId])

  return (
    <article>
      {/* Static content - rendered tại build time */}
      <div dangerouslySetInnerHTML={{ __html: staticContent }} />

      {/* Dynamic content - hydrated client-side */}
      <Suspense fallback={<CommentsSkeleton />}>
        {dynamicData && (
          <div>
            <ViewCounter count={dynamicData.viewCount} />
            <Comments comments={dynamicData.comments} />
            <Recommendations posts={dynamicData.recommendations} />
          </div>
        )}
      </Suspense>
    </article>
  )
}
```

---

## 🔄 Dự Án Hybrid: SSR + SSG

### 🛒 **Dự Án Ví Dụ: E-commerce Multi-Experience Platform**

**Domain**: Large-scale e-commerce với diverse user experiences
**Scale**: 100K+ products, 1M+ users, B2B + B2C
**Complexity**: Multi-tenant, personalization, real-time inventory

### 🏗️ Architecture Strategy

#### **1. Intelligent Rendering Strategy Map**

```typescript
// lib/rendering-strategy.ts
export interface RenderingStrategy {
  page: string
  strategy: 'SSG' | 'SSR' | 'ISR'
  reasoning: string
  revalidateTime?: number
  fallback?: boolean | 'blocking'
}

export const RENDERING_STRATEGY_MAP: RenderingStrategy[] = [
  // SSG - Static Marketing & Info Pages
  {
    page: '/',
    strategy: 'SSG',
    reasoning: 'Homepage với curated content, update ít'
  },
  {
    page: '/about',
    strategy: 'SSG',
    reasoning: 'Static content, no personalization needed'
  },
  {
    page: '/categories/[slug]',
    strategy: 'SSG',
    reasoning: 'Category pages với stable structure',
    fallback: 'blocking' // Cho new categories
  },

  // ISR - Product Content (Balance performance + freshness)
  {
    page: '/products/[slug]',
    strategy: 'ISR',
    reasoning: 'Product details change occasionally (price, stock)',
    revalidateTime: 300 // 5 minutes
  },
  {
    page: '/collections/[slug]',
    strategy: 'ISR',
    reasoning: 'Product collections update periodically',
    revalidateTime: 600 // 10 minutes
  },
  {
    page: '/search',
    strategy: 'ISR',
    reasoning: 'Search results có thể cache với query params',
    revalidateTime: 180 // 3 minutes
  },

  // SSR - User-Specific & Real-time Pages
  {
    page: '/dashboard',
    strategy: 'SSR',
    reasoning: 'User-specific dashboard với real-time data'
  },
  {
    page: '/cart',
    strategy: 'SSR',
    reasoning: 'Real-time cart state, user-specific'
  },
  {
    page: '/checkout',
    strategy: 'SSR',
    reasoning: 'Security-sensitive, real-time validation'
  },
  {
    page: '/account/orders',
    strategy: 'SSR',
    reasoning: 'User-specific order history'
  }
]

// Dynamic strategy selection
export function getRenderingStrategy(pathname: string): RenderingStrategy {
  // Exact match first
  let strategy = RENDERING_STRATEGY_MAP.find((s) => s.page === pathname)

  if (!strategy) {
    // Pattern matching
    strategy = RENDERING_STRATEGY_MAP.find((s) => {
      const pattern = s.page.replace(/\[.*?\]/g, '[^/]+')
      return new RegExp(`^${pattern}$`).test(pathname)
    })
  }

  // Default fallback
  return (
    strategy || {
      page: pathname,
      strategy: 'SSR',
      reasoning: 'Default SSR fallback for dynamic content'
    }
  )
}
```

#### **2. Hybrid Next.js Configuration**

```typescript
// next.config.ts - Hybrid Optimized
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Hybrid output configuration
  // Không set output để enable both static và server-side

  // Experimental features cho hybrid performance
  experimental: {
    // PPR (Partial Prerendering) - Future of hybrid rendering
    ppr: true,

    // Server actions cho forms
    serverActions: true,

    // Optimized package imports
    optimizePackageImports: [
      'lodash-es',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'date-fns',
      'recharts'
    ],

    // Memory optimization
    isrMemoryCacheSize: 50 * 1024 * 1024, // 50MB cho ISR cache

    // Bundle optimization
    bundlePagesExternals: true
  },

  // Image optimization cho hybrid content
  images: {
    domains: ['cdn.example.com', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // Compiler optimization
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn']
          }
        : false,
    styledComponents: true // Cho styled-components nếu dùng
  },

  // Advanced webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimization based on environment
    if (!dev) {
      // Production optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },

          // UI component libraries
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
            name: 'ui-components',
            chunks: 'all',
            priority: 15
          },

          // Chart libraries (heavy)
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3|chart\.js)[\\/]/,
            name: 'charts',
            chunks: 'async', // Lazy load
            priority: 20
          },

          // Common components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    }

    // Bundle analysis
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true
        })
      )
    }

    return config
  },

  // Performance headers
  async headers() {
    return [
      {
        source: '/products/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }]
      },
      {
        source: '/((?!api).*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' }
        ]
      }
    ]
  },

  // Redirects cho SEO
  async redirects() {
    return [
      {
        source: '/product/:slug',
        destination: '/products/:slug',
        permanent: true
      }
    ]
  }
}

export default nextConfig
```

#### **3. Smart Data Fetching Layer**

```typescript
// lib/hybrid-data-fetching.ts
import { cache } from 'react'
import { unstable_cache } from 'next/cache'

// Multi-tier caching strategy
export class HybridDataFetcher {
  private memoryCache = new Map()
  private readonly cacheConfig = {
    products: { ttl: 300, revalidateOnStale: true },
    categories: { ttl: 3600, revalidateOnStale: false },
    users: { ttl: 60, revalidateOnStale: true },
    inventory: { ttl: 30, revalidateOnStale: true }
  }

  // SSG Data Fetching - Build time
  async getStaticProps(context: GetStaticPropsContext) {
    const { params } = context

    try {
      // Parallel data fetching cho static content
      const [categories, featuredProducts, siteConfig] = await Promise.all([
        this.getCategoriesStatic(),
        this.getFeaturedProductsStatic(),
        this.getSiteConfigStatic()
      ])

      return {
        props: {
          categories,
          featuredProducts,
          siteConfig,
          buildTime: new Date().toISOString()
        },
        revalidate: false // Pure static
      }
    } catch (error) {
      return { notFound: true }
    }
  }

  // ISR Data Fetching - Build time + Revalidation
  async getStaticPropsISR(context: GetStaticPropsContext) {
    const { params } = context
    const productSlug = params?.slug as string

    try {
      // Cached data fetching với revalidation
      const [product, relatedProducts, reviews] = await Promise.all([
        this.getProductCached(productSlug),
        this.getRelatedProductsCached(productSlug),
        this.getProductReviewsCached(productSlug, { limit: 10 })
      ])

      if (!product) {
        return { notFound: true }
      }

      return {
        props: {
          product,
          relatedProducts,
          reviews,
          lastUpdated: new Date().toISOString()
        },
        revalidate: this.cacheConfig.products.ttl
      }
    } catch (error) {
      // Graceful degradation
      return {
        props: {
          error: 'Failed to load product',
          fallback: true
        },
        revalidate: 60 // Retry sooner on error
      }
    }
  }

  // SSR Data Fetching - Request time
  async getServerSideProps(context: GetServerSidePropsContext) {
    const { req, res, params, query } = context

    try {
      // User-specific data
      const user = await this.getUserFromRequest(req)

      if (!user && this.requiresAuth(context.resolvedUrl)) {
        return {
          redirect: {
            destination: '/login',
            permanent: false
          }
        }
      }

      // Parallel fetching cho user-specific data
      const [userProfile, cart, wishlist, recommendations] = await Promise.all([
        user ? this.getUserProfile(user.id) : null,
        user ? this.getUserCart(user.id) : null,
        user ? this.getUserWishlist(user.id) : null,
        user ? this.getPersonalizedRecommendations(user.id) : this.getDefaultRecommendations()
      ])

      // Set caching headers
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate')

      return {
        props: {
          user: userProfile,
          cart,
          wishlist,
          recommendations,
          timestamp: Date.now()
        }
      }
    } catch (error) {
      return {
        props: {
          error: 'Failed to load user data',
          fallback: true
        }
      }
    }
  }

  // Cached data fetchers với different strategies
  getProductCached = unstable_cache(
    async (slug: string) => {
      return await this.fetchProductBySlug(slug)
    },
    ['product'],
    {
      revalidate: this.cacheConfig.products.ttl,
      tags: ['products']
    }
  )

  getCategoriesStatic = cache(async () => {
    return await this.fetchAllCategories()
  })

  // Real-time data cho inventory
  async getProductInventory(productId: string, useCache = true) {
    const cacheKey = `inventory-${productId}`

    if (useCache && this.memoryCache.has(cacheKey)) {
      const cached = this.memoryCache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheConfig.inventory.ttl * 1000) {
        return cached.data
      }
    }

    const inventory = await this.fetchProductInventory(productId)

    this.memoryCache.set(cacheKey, {
      data: inventory,
      timestamp: Date.now()
    })

    return inventory
  }

  // Smart cache invalidation
  async invalidateProductCache(productId: string) {
    // Next.js cache invalidation
    await fetch(`/api/revalidate?tag=products&id=${productId}`)

    // Memory cache invalidation
    this.memoryCache.delete(`product-${productId}`)
    this.memoryCache.delete(`inventory-${productId}`)
  }
}

export const dataFetcher = new HybridDataFetcher()
```

#### **4. Component-Level Optimization Strategy**

```typescript
// components/hybrid/ProductPage.tsx
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports cho heavy components
const ReviewsSection = dynamic(() => import('./ReviewsSection'), {
  ssr: false, // Client-side only cho better TTI
  loading: () => <ReviewsSkeleton />
})

const RecommendationsCarousel = dynamic(() => import('./RecommendationsCarousel'), {
  ssr: true, // SSR cho SEO
  loading: () => <RecommendationsSkeleton />
})

const PersonalizedContent = dynamic(() => import('./PersonalizedContent'), {
  ssr: false, // User-specific, load sau khi hydration
  loading: () => <PersonalizationSkeleton />
})

interface ProductPageProps {
  // Static data từ SSG/ISR
  product: Product
  relatedProducts: Product[]

  // Dynamic data từ SSR hoặc client-side
  user?: User
  inventory?: InventoryData

  // Rendering metadata
  renderStrategy: 'SSG' | 'SSR' | 'ISR'
  timestamp: string
}

export default function ProductPage({
  product,
  relatedProducts,
  user,
  inventory,
  renderStrategy,
  timestamp
}: ProductPageProps) {
  return (
    <div className='product-page'>
      {/* Critical above-the-fold content - SSG/ISR */}
      <ProductHero product={product} />

      {/* Product details - Static content */}
      <ProductDetails product={product} />

      {/* Real-time inventory - SSR hoặc client-side */}
      <Suspense fallback={<InventorySkeleton />}>
        <InventoryDisplay productId={product.id} initialData={inventory} user={user} />
      </Suspense>

      {/* Related products - ISR cached */}
      <RelatedProducts products={relatedProducts} />

      {/* Reviews - Client-side lazy loaded */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsSection productId={product.id} />
      </Suspense>

      {/* Personalized recommendations - Client-side */}
      {user && (
        <Suspense fallback={<PersonalizationSkeleton />}>
          <PersonalizedContent userId={user.id} productId={product.id} />
        </Suspense>
      )}

      {/* Performance monitoring */}
      <PerformanceTracker renderStrategy={renderStrategy} timestamp={timestamp} userId={user?.id} />
    </div>
  )
}

// Smart inventory component với real-time updates
function InventoryDisplay({ productId, initialData, user }: InventoryProps) {
  const [inventory, setInventory] = useState(initialData)
  const [isLoading, setIsLoading] = useState(!initialData)

  useEffect(() => {
    // Real-time inventory updates với WebSocket
    const socket = io('/inventory')

    socket.on(`inventory-${productId}`, (update: InventoryUpdate) => {
      setInventory(update)
    })

    // Fallback polling cho reliability
    const pollInventory = setInterval(async () => {
      try {
        const updated = await fetch(`/api/inventory/${productId}`).then((r) => r.json())
        setInventory(updated)
      } catch (error) {
        console.warn('Inventory polling failed:', error)
      }
    }, 30000) // 30 giây

    return () => {
      socket.disconnect()
      clearInterval(pollInventory)
    }
  }, [productId])

  if (isLoading) return <InventorySkeleton />

  return (
    <div className='inventory-display'>
      <StockLevel stock={inventory.quantity} />
      <PricingDisplay
        price={inventory.price}
        user={user} // Cho personalized pricing
      />
      <AddToCartButton productId={productId} available={inventory.quantity > 0} user={user} />
    </div>
  )
}
```

### 📊 Hybrid Performance Analysis

#### **Performance Characteristics Map**

```typescript
// monitoring/hybrid-performance.ts
export const HybridPerformanceMetrics = {
  // Per-strategy performance
  SSG_Pages: {
    TTFB: '50-150ms',
    LCP: '0.8-1.5s',
    FID: '<10ms',
    CLS: '<0.05',
    cachability: '100% - perfect CDN cache',
    cost: 'Minimal - static serving'
  },

  ISR_Pages: {
    TTFB: '100-300ms', // First request after revalidation
    TTFB_Cached: '50-150ms', // Subsequent cached requests
    LCP: '1.0-2.0s',
    FID: '<20ms',
    CLS: '<0.1',
    revalidationFrequency: '5-10 minutes',
    cost: 'Low - occasional generation'
  },

  SSR_Pages: {
    TTFB: '200-500ms',
    LCP: '1.5-3.0s',
    FID: '<50ms',
    CLS: '<0.15',
    personalization: '100%',
    cost: 'Medium-High - per request processing'
  },

  // Hybrid composition performance
  OverallSiteMetrics: {
    averageLCP: '1.2s', // Weighted average
    mobilePerformanceScore: '85-95',
    desktopPerformanceScore: '90-98',
    SEOScore: '95-100',
    accessibilityScore: '90-95'
  }
}

// Performance monitoring strategy
export class HybridPerformanceMonitor {
  trackPagePerformance(strategy: string, metrics: WebVitalsMetrics) {
    // Strategy-specific performance tracking
    const performanceData = {
      strategy,
      ...metrics,
      timestamp: Date.now(),
      url: window.location.pathname
    }

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: strategy,
        value: Math.round(metrics.LCP || 0)
      })
    }

    // Real User Monitoring
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(performanceData)
    }).catch((err) => console.warn('Performance tracking failed:', err))
  }

  // Strategy effectiveness analysis
  analyzeStrategyEffectiveness() {
    return {
      SSG: {
        usage: '40%', // Static marketing, category pages
        avgPerformance: 'Excellent',
        userSatisfaction: '95%',
        conversionImpact: '+15%'
      },
      ISR: {
        usage: '35%', // Product pages, collections
        avgPerformance: 'Very Good',
        userSatisfaction: '90%',
        conversionImpact: '+8%'
      },
      SSR: {
        usage: '25%', // User dashboards, checkout
        avgPerformance: 'Good',
        userSatisfaction: '85%',
        conversionImpact: 'Baseline'
      }
    }
  }
}
```

### 🎯 **Hybrid Strategy Benefits**

#### **1. Optimal Performance Distribution**

- ⚡ **Best-in-class performance** cho static content (SSG)
- 🔄 **Balanced freshness** cho semi-dynamic content (ISR)
- 👤 **Real-time personalization** cho user-specific features (SSR)

#### **2. Cost Optimization**

- 💰 **40% static serving** = minimal hosting costs
- 🔄 **35% periodic regeneration** = low computational overhead
- 🖥️ **25% real-time processing** = targeted resource usage

#### **3. Development Flexibility**

- 🛠️ **Choose right tool** cho từng use case
- 📈 **Easy scaling** strategies per page type
- 🔧 **Independent optimization** của từng rendering method

#### **4. Business Impact Optimization**

- 🎯 **Marketing pages**: SSG cho maximum reach
- 🛍️ **Product catalog**: ISR cho SEO + freshness balance
- 👤 **User experience**: SSR cho personalization

### 🚧 **Hybrid Challenges và Solutions**

#### **1. Complexity Management**

```typescript
// Solution: Automated strategy detection
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const strategy = getRenderingStrategy(pathname)

  // Add strategy info cho development
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next()
    response.headers.set('X-Render-Strategy', strategy.strategy)
    response.headers.set('X-Strategy-Reason', strategy.reasoning)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
}
```

#### **2. Data Consistency Across Strategies**

```typescript
// Solution: Unified data layer với versioning
// lib/data-consistency.ts
export class DataConsistencyManager {
  private dataVersion = new Map<string, number>()

  async ensureDataConsistency(key: string, fetcher: () => Promise<any>) {
    const currentVersion = this.dataVersion.get(key) || 0

    // Check phiên bản data từ cache
    const cached = await this.getCachedData(key)
    if (cached && cached.version >= currentVersion) {
      return cached.data
    }

    // Fetch fresh data
    const freshData = await fetcher()
    const newVersion = currentVersion + 1

    // Update cache với versioning
    await this.setCachedData(key, {
      data: freshData,
      version: newVersion,
      timestamp: Date.now()
    })

    this.dataVersion.set(key, newVersion)
    return freshData
  }

  // Invalidate data across all strategies
  async invalidateData(keys: string[]) {
    await Promise.all([
      this.invalidateStaticCache(keys), // SSG/ISR
      this.invalidateRuntimeCache(keys), // SSR
      this.invalidateCDNCache(keys) // Global
    ])
  }
}
```

#### **3. Monitoring và Debugging**

```typescript
// Solution: Comprehensive monitoring dashboard
// lib/hybrid-monitoring.ts
export class HybridMonitoring {
  async getPerformanceDashboard() {
    const [ssgMetrics, isrMetrics, ssrMetrics] = await Promise.all([
      this.getSSGMetrics(),
      this.getISRMetrics(),
      this.getSSRMetrics()
    ])

    return {
      overview: {
        totalPages: ssgMetrics.count + isrMetrics.count + ssrMetrics.count,
        avgLoadTime: this.calculateWeightedAverage([ssgMetrics, isrMetrics, ssrMetrics]),
        errorRate: this.calculateErrorRate([ssgMetrics, isrMetrics, ssrMetrics])
      },
      breakdown: {
        SSG: {
          pages: ssgMetrics.count,
          avgLoadTime: ssgMetrics.avgLoadTime,
          errorRate: ssgMetrics.errorRate,
          cacheHitRate: ssgMetrics.cacheHitRate
        },
        ISR: {
          pages: isrMetrics.count,
          avgLoadTime: isrMetrics.avgLoadTime,
          revalidationRate: isrMetrics.revalidationRate,
          stalServeRate: isrMetrics.staleServeRate
        },
        SSR: {
          pages: ssrMetrics.count,
          avgLoadTime: ssrMetrics.avgLoadTime,
          serverResponseTime: ssrMetrics.serverResponseTime,
          personalizationRate: ssrMetrics.personalizationRate
        }
      },
      recommendations: this.generateOptimizationRecommendations(ssgMetrics, isrMetrics, ssrMetrics)
    }
  }
}
```

---

## 📊 So Sánh Chi Tiết và Kết Luận

### 🏆 Performance Comparison Matrix

| Aspect                     | SSR-Only   | SSG-Only   | Hybrid (SSR+SSG) |
| -------------------------- | ---------- | ---------- | ---------------- |
| **Initial Page Load**      | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐         |
| **Data Freshness**         | ⭐⭐⭐⭐⭐ | ⭐⭐       | ⭐⭐⭐⭐         |
| **Scalability**            | ⭐⭐       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐         |
| **Personalization**        | ⭐⭐⭐⭐⭐ | ❌         | ⭐⭐⭐⭐⭐       |
| **SEO Performance**        | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐       |
| **Development Complexity** | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐             |
| **Infrastructure Cost**    | ⭐⭐       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐           |
| **Time to Market**         | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐⭐           |

### 💼 Business Use Case Mapping

#### **📊 SSR-First Strategy** - Best for:

- **SaaS Dashboards** và analytics platforms
- **Financial applications** với real-time data
- **Social media platforms** với user-generated content
- **Live trading** và monitoring systems
- **Multi-tenant B2B** applications

**Key Success Metrics:**

- Real-time data accuracy: 100%
- User engagement: High (personalized experience)
- Server costs: Medium-High (worth for UX)

#### **📰 SSG-First Strategy** - Best for:

- **Content marketing** platforms
- **Documentation sites** và knowledge bases
- **Portfolio websites** và corporate sites
- **Blog platforms** với scheduled content
- **Product catalogs** với stable inventory

**Key Success Metrics:**

- Page load speed: Sub-second globally
- SEO performance: Maximum visibility
- Hosting costs: Minimal operational overhead

#### **🛒 Hybrid Strategy** - Best for:

- **E-commerce platforms** với diverse content types
- **News websites** với mixed content freshness
- **Educational platforms** với user progress tracking
- **Community platforms** với static + dynamic content
- **Enterprise websites** với public + private sections

**Key Success Metrics:**

- Overall performance: Balanced excellence
- User satisfaction: High across all user journeys
- Cost efficiency: Optimized resource allocation

### 🎯 Strategic Decision Framework

#### **Câu hỏi quyết định chiến lược:**

1. **Data Requirements Analysis**

   ```
   Real-time data percentage:
   ├─ >80% → SSR-First
   ├─ <20% → SSG-First
   └─ 20-80% → Hybrid
   ```

2. **User Experience Priorities**

   ```
   Primary UX goal:
   ├─ Maximum performance → SSG-First
   ├─ Maximum personalization → SSR-First
   └─ Balanced experience → Hybrid
   ```

3. **Business Model Alignment**

   ```
   Revenue model:
   ├─ Subscription/SaaS → SSR-First
   ├─ Content/Advertising → SSG-First
   └─ E-commerce/Mixed → Hybrid
   ```

4. **Technical Team Capacity**
   ```
   Team expertise:
   ├─ Full-stack focused → SSR-First
   ├─ Frontend focused → SSG-First
   └─ DevOps mature → Hybrid
   ```

### 🚀 Implementation Roadmap

#### **Phase 1: Foundation** (Weeks 1-2)

- ✅ Choose primary strategy based on analysis
- ✅ Setup Next.js configuration optimally
- ✅ Implement basic monitoring
- ✅ Create performance baseline

#### **Phase 2: Core Implementation** (Weeks 3-6)

- ✅ Implement rendering strategies cho key pages
- ✅ Setup data fetching optimization
- ✅ Configure caching layers
- ✅ Add performance monitoring

#### **Phase 3: Optimization** (Weeks 7-10)

- ✅ Fine-tune performance bottlenecks
- ✅ Implement advanced caching strategies
- ✅ Add real-time features nếu cần
- ✅ Optimize bundle sizes

#### **Phase 4: Scale & Monitor** (Ongoing)

- ✅ Monitor performance metrics
- ✅ Scale infrastructure theo demand
- ✅ Continuous optimization
- ✅ Strategy refinement

### 🏁 Kết Luận Cuối Cùng

#### **🎯 Key Insights:**

1. **Không có "one-size-fits-all" solution** - mỗi strategy có trade-offs riêng
2. **Hybrid approach** thường là optimal cho complex applications
3. **Performance optimization** là ongoing process, không phải one-time setup
4. **Business requirements** should drive technical decisions, not vice versa

#### **🚀 Future Trends:**

1. **Partial Prerendering (PPR)** sẽ simplify hybrid approaches
2. **Edge computing** sẽ reduce SSR performance gaps
3. **AI-driven optimization** sẽ automate strategy selection
4. **WebAssembly** sẽ enable new performance paradigms

#### **💡 Final Recommendations:**

- **Start simple** với SSG nếu có thể, evolve to hybrid khi cần
- **Measure everything** - data should guide optimization decisions
- **Invest in monitoring** từ đầu để detect performance regressions
- **Plan for scale** - architecture decisions compound over time
- **Stay updated** với Next.js evolution và web standards

**Remember**: Best performance strategy là strategy phù hợp với specific use case và business goals của bạn! 🎯

---

**Tác giả**: AI Assistant với deep technical analysis  
**Dựa trên**: NextJS official docs, real-world implementations, và performance best practices  
**Cập nhật**: Latest NextJS features và modern web standards

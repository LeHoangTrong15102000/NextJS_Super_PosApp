# Báo cáo Tối ưu hóa Performance - NextJS POS App

## Tổng quan Dự án

Dự án NextJS POS App là một ứng dụng quản lý nhà hàng được xây dựng với:

- **Next.js 15** với React 19
- **TypeScript** và **Tailwind CSS**
- **React Query** cho data fetching
- **Socket.io** cho real-time communication
- **Zustand** cho state management
- **Next-intl** cho đa ngôn ngữ
- **Zod** cho validation
- **Radix UI** components

## 1. 🚀 Tối ưu hóa Bundle Size & Code Splitting

### Vấn đề hiện tại:

- Không có dynamic imports/lazy loading
- Tất cả dependencies được load cùng lúc
- Bundle size có thể lớn với nhiều thư viện UI

### Giải pháp:

#### 1.1 Dynamic Imports cho Route Components

```typescript
// Ví dụ: src/app/[locale]/manage/dashboard/page.tsx
const DashboardMain = dynamic(() => import('./dashboard-main'), {
  loading: () => <DashboardSkeleton />
})
```

#### 1.2 Lazy Loading cho Heavy Components

```typescript
// Charts components
const RevenueLineChart = dynamic(() => import('./revenue-line-chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />
})

// Dialog components
const EditDish = dynamic(() => import('./edit-dish'))
const AddDish = dynamic(() => import('./add-dish'))
```

#### 1.3 Code Splitting cho Vendor Libraries

```typescript
// next.config.ts
export default {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-popover']
  }
}
```

## 2. 🖼️ Tối ưu hóa Images

### Vấn đề hiện tại:

- Các component upload ảnh sử dụng URL.createObjectURL() nhiều lần
- Không có lazy loading cho images trong danh sách
- Quality cố định ở một số nơi (quality={100})

### Giải pháp:

#### 2.1 Image Optimization cải tiến

```typescript
// Thay thế trong dish-detail.tsx và các nơi tương tự
<Image
  src={dish.image}
  alt={dish.name}
  sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  quality={85} // Giảm từ 100 xuống 85
  priority={false} // Chỉ true cho above-the-fold images
  placeholder='blur'
  blurDataURL='data:image/jpeg;base64,...'
/>
```

#### 2.2 Optimize Preview Images

```typescript
// Trong add-dish.tsx, edit-dish.tsx
const previewAvatarFromFile = useMemo(() => {
  if (file) {
    // Cleanup previous URL để tránh memory leaks
    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current)
    }
    const url = URL.createObjectURL(file)
    previousUrlRef.current = url
    return url
  }
  return image
}, [file, image])

useEffect(() => {
  return () => {
    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current)
    }
  }
}, [])
```

#### 2.3 Progressive Image Loading

```typescript
// Component cho progressive loading
const ProgressiveImage = ({ src, alt, ...props }) => {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className='relative'>
      <Image
        {...props}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn('transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
      />
      {!loaded && <ImageSkeleton />}
    </div>
  )
}
```

## 3. 🔄 Tối ưu hóa React Query

### Vấn đề hiện tại:

- Queries không có staleTime phù hợp
- Refetch logic có thể tối ưu hơn
- Không có prefetching cho user journey

### Giải pháp:

#### 3.1 Cấu hình Query Client tối ưu

```typescript
// src/components/app-provider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      cacheTime: 10 * 60 * 1000, // 10 phút
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error?.status === 401) return false
        return failureCount < 2
      }
    }
  }
})
```

#### 3.2 Smart Invalidation

```typescript
// Thay vì invalidate toàn bộ, chỉ invalidate specific queries
export const useUpdateDishMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dishApiRequest.updateDish,
    onSuccess: (data, variables) => {
      // Update specific dish in cache
      queryClient.setQueryData(['dishes', variables.id], data)

      // Invalidate list only if needed
      queryClient.invalidateQueries({
        queryKey: ['dishes'],
        predicate: (query) => query.queryKey.length === 1
      })
    }
  })
}
```

#### 3.3 Prefetching cho User Journey

```typescript
// Prefetch dishes khi vào manage section
const usePrefetchDishes = () => {
  const queryClient = useQueryClient()

  const prefetchDishes = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['dishes'],
      queryFn: dishApiRequest.list,
      staleTime: 30 * 1000
    })
  }, [queryClient])

  return prefetchDishes
}
```

## 4. 🌐 Tối ưu hóa Socket.io

### Vấn đề hiện tại:

- Multiple socket connections trong các component khác nhau
- Không có cleanup khi component unmount
- Console.log statements còn lại

### Giải pháp:

#### 4.1 Centralized Socket Management

```typescript
// src/hooks/useSocket.ts
export const useSocket = () => {
  const socket = useAppStore((state) => state.socket)

  const emit = useCallback(
    (event: string, data: any) => {
      if (socket?.connected) {
        socket.emit(event, data)
      }
    },
    [socket]
  )

  const on = useCallback(
    (event: string, handler: Function) => {
      socket?.on(event, handler)

      return () => {
        socket?.off(event, handler)
      }
    },
    [socket]
  )

  return { socket, emit, on, connected: socket?.connected }
}
```

#### 4.2 Optimized Socket Listeners

```typescript
// Thay thế trong order-table.tsx
useEffect(() => {
  if (!socket?.connected) return

  const handlers = {
    'update-order': (data: UpdateOrderResType['data']) => {
      // Optimistic update
      queryClient.setQueryData(['orders'], (old: any) => {
        return old?.map((order: any) => (order.id === data.id ? { ...order, ...data } : order))
      })

      toast({
        description: `Món ${data.dishSnapshot.name} đã được cập nhật`
      })
    },
    'new-order': debounce((data: GuestCreateOrdersResType['data']) => {
      refetchOrderList()
      toast({
        description: `Có ${data.length} đơn hàng mới`
      })
    }, 1000)
  }

  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, handler)
  })

  return () => {
    Object.keys(handlers).forEach((event) => {
      socket.off(event)
    })
  }
}, [socket, queryClient, refetchOrderList])
```

## 5. 📊 Tối ưu hóa Table Components

### Vấn đề hiện tại:

- Render lại toàn bộ table khi data thay đổi
- Pagination và filtering không được memoize
- Quá nhiều useState cho table state

### Giải pháp:

#### 5.1 Memoization cho Table Rows

```typescript
// src/components/optimized-table-row.tsx
const TableRow = memo(
  ({ row, onEdit, onDelete }) => {
    return <tr>{/* Row content */}</tr>
  },
  (prevProps, nextProps) => {
    return prevProps.row.id === nextProps.row.id && prevProps.row.updatedAt === nextProps.row.updatedAt
  }
)
```

#### 5.2 Virtualization cho Large Lists

```typescript
// Sử dụng react-window cho tables lớn
import { FixedSizeList as List } from 'react-window'

const VirtualizedTable = ({ items, rowHeight = 60 }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TableRow data={items[index]} />
    </div>
  )

  return (
    <List height={400} itemCount={items.length} itemSize={rowHeight}>
      {Row}
    </List>
  )
}
```

#### 5.3 Optimize Table State

```typescript
// Combine table states thành một reducer
const tableReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SORTING':
      return { ...state, sorting: action.payload }
    case 'SET_PAGINATION':
      return { ...state, pagination: action.payload }
    case 'SET_FILTERS':
      return { ...state, columnFilters: action.payload }
    default:
      return state
  }
}

// Sử dụng trong component
const [tableState, dispatch] = useReducer(tableReducer, initialState)
```

## 6. 🎯 Tối ưu hóa Form Performance

### Vấn đề hiện tại:

- File upload không được optimize
- Form re-render khi không cần thiết
- Validation chạy quá thường xuyên

### Giải pháp:

#### 6.1 Debounced Validation

```typescript
// src/hooks/useDebouncedValidation.ts
export const useDebouncedForm = (schema, defaultValues) => {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  })

  const debouncedValidate = useMemo(
    () =>
      debounce((values) => {
        schema.safeParse(values)
      }, 300),
    [schema]
  )

  return { ...form, debouncedValidate }
}
```

#### 6.2 Optimized File Upload

```typescript
// src/components/optimized-file-upload.tsx
const OptimizedFileUpload = () => {
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = useCallback(
    async (file: File) => {
      // Resize image trước khi upload
      const resizedFile = await resizeImage(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.8
      })

      // Tạo preview thumbnail
      const thumbnail = await createThumbnail(resizedFile, 100, 100)
      setPreview(thumbnail)

      // Upload background
      setUploading(true)
      try {
        await uploadMutation.mutateAsync(resizedFile)
      } finally {
        setUploading(false)
      }
    },
    [uploadMutation]
  )

  return (
    <div>
      {/* File upload UI với progress */}
      {uploading && <ProgressBar />}
    </div>
  )
}
```

## 7. 🚀 Tối ưu hóa SEO & Core Web Vitals

### Vấn đề hiện tại:

- Image LCP có thể chậm
- Layout shift từ dynamic content
- Font loading chưa tối ưu

### Giải pháp:

#### 7.1 Optimize Font Loading

```typescript
// src/app/[locale]/layout.tsx
const fontSans = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
  preload: true
})
```

#### 7.2 Prevent Layout Shift

```typescript
// Skeleton components với exact dimensions
const DishCardSkeleton = () => (
  <div className='animate-pulse'>
    <div className='w-[150px] h-[150px] bg-gray-200 rounded-md' />
    <div className='space-y-2 mt-2'>
      <div className='h-4 bg-gray-200 rounded w-3/4' />
      <div className='h-4 bg-gray-200 rounded w-1/2' />
    </div>
  </div>
)
```

#### 7.3 Critical Resource Hints

```typescript
// src/app/[locale]/layout.tsx
export default function Layout({ children }) {
  return (
    <html>
      <head>
        <link rel='preconnect' href={envConfig.NEXT_PUBLIC_API_ENDPOINT} />
        <link rel='dns-prefetch' href={envConfig.NEXT_PUBLIC_API_ENDPOINT} />
        <link rel='preload' href='/banner.png' as='image' />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

## 8. 🔧 Clean Up & Best Practices

### Vấn đề hiện tại:

- Console.log statements trong production code
- Memory leaks từ URL.createObjectURL
- Commented code không sử dụng

### Giải pháp:

#### 8.1 Remove Console Statements

- Loại bỏ tất cả `console.log` và `console.error` trong production
- Sử dụng proper logging library nếu cần

#### 8.2 Memory Leak Prevention

```typescript
// Cleanup URL objects
useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }
}, [previewUrl])
```

#### 8.3 Bundle Analysis

```bash
# Chạy bundle analyzer
ANALYZE=true npm run build
```

## 9. 📈 Performance Monitoring

### Setup Performance Monitoring:

#### 9.1 Web Vitals Tracking

```typescript
// src/lib/analytics.ts
export function reportWebVitals(metric) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id
    })
  }
}
```

#### 9.2 Real User Monitoring

```typescript
// Track performance metrics
const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor loading times
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Page load time:', entry.loadEventEnd - entry.fetchStart)
        }
      })
    })

    observer.observe({ entryTypes: ['navigation'] })

    return () => observer.disconnect()
  }, [])
}
```

## 🎯 Ưu tiên Thực hiện

### Mức độ cao (High Priority):

1. **Remove console statements** - Ngay lập tức
2. **Image optimization** - quality và lazy loading
3. **React Query caching** - Stale time và smart invalidation
4. **Memory leak fixes** - URL.createObjectURL cleanup

### Mức độ trung bình (Medium Priority):

1. **Dynamic imports** cho route components
2. **Socket.io optimization** - Centralized management
3. **Table virtualization** cho large datasets
4. **Form debouncing** cho better UX

### Mức độ thấp (Low Priority):

1. **Bundle splitting** advanced techniques
2. **Web Vitals monitoring** setup
3. **Progressive image loading** enhancements
4. **Advanced prefetching** strategies

## 📊 Expected Performance Gains

### Bundle Size:

- **Giảm 20-30%** initial bundle size với dynamic imports
- **Giảm 15-25%** với tree shaking optimization

### Runtime Performance:

- **Cải thiện 40-60%** table rendering với virtualization
- **Giảm 30-50%** memory usage với proper cleanup
- **Tăng 25-40%** perceived performance với prefetching

### User Experience:

- **Giảm 200-500ms** Time to Interactive với code splitting
- **Cải thiện 30-50%** Core Web Vitals scores
- **Tăng 15-25%** user satisfaction với better loading states

---

_Báo cáo này được tạo dựa trên phân tích chi tiết source code của dự án NextJS POS App. Khuyến nghị thực hiện từng bước và đo lường kết quả sau mỗi optimization._

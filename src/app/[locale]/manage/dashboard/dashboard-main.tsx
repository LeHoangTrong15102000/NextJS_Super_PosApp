'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { endOfDay, format, startOfDay, subDays, startOfMonth } from 'date-fns'
import { useEffect, useRef, useState } from 'react'

type DatePreset = 'today' | '7d' | '30d' | 'month' | null
import { useDashboardIndicator } from '@/queries/useIndicator'
import { TopDishesTable } from './top-dishes-table'
import { exportDashboardCSV } from '@/lib/export-csv'
import { useAppStore } from '@/components/app-provider'

// Dynamic imports cho chart components
const RevenueLineChart = dynamic(
  () => import('./revenue-line-chart').then((mod) => ({ default: mod.RevenueLineChart })),
  {
    loading: () => (
      <div className='h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center'>
        <span className='text-gray-500'>Đang tải biểu đồ...</span>
      </div>
    ),
    ssr: false
  }
)

const DishBarChart = dynamic(() => import('./dish-bar-chart').then((mod) => ({ default: mod.DishBarChart })), {
  loading: () => (
    <div className='h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center'>
      <span className='text-gray-500'>Đang tải biểu đồ...</span>
    </div>
  ),
  ssr: false
})

const initFromDate = startOfDay(new Date())
const initToDate = endOfDay(new Date())

export default function DashboardMain() {
  const [fromDate, setFromDate] = useState(initFromDate)
  const [toDate, setToDate] = useState(initToDate)
  const [activePreset, setActivePreset] = useState<DatePreset>(null)
  const { data, refetch } = useDashboardIndicator({
    fromDate,
    toDate
  })
  const socket = useAppStore((state) => state.socket)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!socket) return
    const debouncedRefetch = () => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => refetch(), 500)
    }
    socket.on('new-order', debouncedRefetch)
    socket.on('update-order', debouncedRefetch)
    socket.on('payment', debouncedRefetch)
    return () => {
      socket.off('new-order', debouncedRefetch)
      socket.off('update-order', debouncedRefetch)
      socket.off('payment', debouncedRefetch)
      clearTimeout(debounceRef.current)
    }
  }, [socket, refetch])
  const revenue = data?.payload.data.revenue ?? 0
  const guestCount = data?.payload.data.guestCount ?? 0
  const orderCount = data?.payload.data.orderCount ?? 0
  const servingTableCount = data?.payload.data.servingTableCount ?? 0
  const revenueByDate = data?.payload.data.revenueByDate ?? []
  const dishIndicator = data?.payload.data.dishIndicator ?? []

  const handlePreset = (preset: DatePreset) => {
    const now = new Date()
    const end = endOfDay(now)
    let start: Date
    switch (preset) {
      case 'today':
        start = startOfDay(now)
        break
      case '7d':
        start = startOfDay(subDays(now, 7))
        break
      case '30d':
        start = startOfDay(subDays(now, 30))
        break
      case 'month':
        start = startOfMonth(now)
        break
      default:
        return
    }
    setFromDate(start)
    setToDate(end)
    setActivePreset(preset)
  }

  const resetDateFilter = () => {
    setFromDate(initFromDate)
    setToDate(initToDate)
    setActivePreset(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <Button variant={activePreset === 'today' ? 'default' : 'outline'} onClick={() => handlePreset('today')}>
          Hôm nay
        </Button>
        <Button variant={activePreset === '7d' ? 'default' : 'outline'} onClick={() => handlePreset('7d')}>
          7 ngày
        </Button>
        <Button variant={activePreset === '30d' ? 'default' : 'outline'} onClick={() => handlePreset('30d')}>
          30 ngày
        </Button>
        <Button variant={activePreset === 'month' ? 'default' : 'outline'} onClick={() => handlePreset('month')}>
          Tháng này
        </Button>
      </div>
      <div className='flex flex-wrap gap-2'>
        <div className='flex items-center'>
          <span className='mr-2'>Từ</span>
          <Input
            type='datetime-local'
            placeholder='Từ ngày'
            className='text-sm'
            value={format(fromDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
            onChange={(event) => {
              setFromDate(new Date(event.target.value))
              setActivePreset(null)
            }}
          />
        </div>
        <div className='flex items-center'>
          <span className='mr-2'>Đến</span>
          <Input
            type='datetime-local'
            placeholder='Đến ngày'
            value={format(toDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
            onChange={(event) => {
              setToDate(new Date(event.target.value))
              setActivePreset(null)
            }}
          />
        </div>
        <Button variant={'outline'} onClick={resetDateFilter}>
          Reset
        </Button>
        <Button
          variant={'outline'}
          disabled={!data}
          onClick={() => {
            if (!data) return
            exportDashboardCSV(
              {
                revenue,
                guestCount,
                orderCount,
                servingTableCount,
                revenueByDate,
                dishIndicator
              },
              fromDate,
              toDate
            )
          }}
        >
          Xuất CSV
        </Button>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng doanh thu</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatCurrency(revenue)}</div>
            <p className='text-xs text-muted-foreground'>Trong khoảng thời gian đã chọn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Khách</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <path d='M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{guestCount}</div>
            <p className='text-xs text-muted-foreground'>Gọi món</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Đơn hàng</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <rect width='20' height='14' x='2' y='5' rx='2' />
              <path d='M2 10h20' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{orderCount}</div>
            <p className='text-xs text-muted-foreground'>Tổng số đơn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Bàn đang phục vụ</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{servingTableCount}</div>
            <p className='text-xs text-muted-foreground'>Hiện tại</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Giá trị TB/đơn</CardTitle>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              className='h-4 w-4 text-muted-foreground'
            >
              <rect x='4' y='2' width='16' height='20' rx='2' />
              <line x1='8' y1='6' x2='16' y2='6' />
              <line x1='8' y1='10' x2='16' y2='10' />
              <line x1='8' y1='14' x2='12' y2='14' />
            </svg>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(orderCount > 0 ? Math.round(revenue / orderCount) : 0)}
            </div>
            <p className='text-xs text-muted-foreground'>Doanh thu / Số đơn</p>
          </CardContent>
        </Card>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='lg:col-span-4'>
          <RevenueLineChart chartData={revenueByDate} />
        </div>
        <div className='lg:col-span-3'>
          <DishBarChart chartData={dishIndicator} />
        </div>
      </div>
      <TopDishesTable dishIndicator={dishIndicator} />
    </div>
  )
}

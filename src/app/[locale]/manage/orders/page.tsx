import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import OrderTable from '@/app/[locale]/manage/orders/order-table'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

// Dynamic imports cho heavy dialog components
const AddOrder = dynamic(() => import('./add-order'), {
  loading: () => <div className='h-10 w-32 bg-gray-200 rounded animate-pulse'></div>
})

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Orders'
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/orders`

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: url
    },
    robots: {
      index: false
    }
  }
}

export default async function OrdersPage() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='flex items-center'>
        <div className='ml-auto flex items-center gap-2'>
          <AddOrder />
        </div>
      </div>
      <Card x-chunk='dashboard-06-chunk-0'>
        <CardHeader>
          <CardTitle>Đơn hàng</CardTitle>
          <CardDescription>Quản lý đơn hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className='flex justify-center py-8'>Đang tải...</div>}>
            <OrderTable />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  )
}

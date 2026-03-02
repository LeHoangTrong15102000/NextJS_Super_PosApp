import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import OrderDetail from '@/app/[locale]/manage/orders/[id]/order-detail'
import { Suspense } from 'react'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale; id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Orders'
  })
  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/orders/${params.id}`
  return {
    title: `${t('title')} #${params.id}`,
    description: t('description'),
    alternates: { canonical: url },
    robots: { index: false }
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const orderId = Number(params.id)
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết đơn hàng #{orderId}</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense>
              <OrderDetail orderId={orderId} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


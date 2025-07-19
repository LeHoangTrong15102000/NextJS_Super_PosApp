import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import envConfig from '@/config'
import type { Locale } from '@/config'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

// Dynamic import với loading component để giảm bundle size
const DashboardMain = dynamic(() => import('./dashboard-main'), {
  loading: () => (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <div className='h-10 w-32 bg-gray-200 rounded animate-pulse'></div>
        <div className='h-10 w-32 bg-gray-200 rounded animate-pulse'></div>
        <div className='h-10 w-20 bg-gray-200 rounded animate-pulse'></div>
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-24 bg-gray-200 rounded animate-pulse'></div>
        ))}
      </div>
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='lg:col-span-4 h-80 bg-gray-200 rounded animate-pulse'></div>
        <div className='lg:col-span-3 h-80 bg-gray-200 rounded animate-pulse'></div>
      </div>
    </div>
  )
})

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'Dashboard'
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/dashboard`

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

export default async function Dashboard() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Phân tích các chỉ số</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardMain />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

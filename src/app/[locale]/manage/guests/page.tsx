import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import GuestTable from '@/app/[locale]/manage/guests/guest-table'
import { Suspense } from 'react'
import envConfig, { Locale } from '@/config'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'ManageGuests'
  })

  const url = envConfig.NEXT_PUBLIC_URL + `/${params.locale}/manage/guests`

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

export default function GuestsPage() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Khách hàng</CardTitle>
            <CardDescription>Quản lý khách hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <GuestTable />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


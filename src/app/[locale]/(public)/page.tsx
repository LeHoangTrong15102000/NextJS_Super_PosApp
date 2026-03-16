import dishApiRequest from '@/apiRequests/dish'
import { wrapServerApi } from '@/lib/utils'
import { DishListResType } from '@/schemaValidations/dish.schema'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import envConfig, { Locale } from '@/config'
import { htmlToTextForDescription } from '@/lib/server-utils'
import DishFilter from '@/app/[locale]/(public)/dish-filter'
import IndicatorSection from '@/app/[locale]/(public)/indicator-section'
import AboutTeaser from '@/app/[locale]/(public)/about-teaser'
import ScrollAnimate from '@/components/scroll-animate'
import { Link } from '@/i18n/routing'

export const revalidate = 3600

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params

  const { locale } = params

  const t = await getTranslations({ locale, namespace: 'HomePage' })
  const url = envConfig.NEXT_PUBLIC_URL + `/${locale}`

  return {
    title: t('title'),
    description: htmlToTextForDescription(t('description')),
    alternates: {
      canonical: url
    }
  }
}

export default async function Home(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params

  const { locale } = params

  setRequestLocale(locale)
  const t = await getTranslations('HomePage')

  const dishResult = await wrapServerApi(dishApiRequest.list)
  const dishList: DishListResType['data'] = dishResult?.payload.data ?? []

  return (
    <div className='w-full space-y-0'>
      {/* Hero Section */}
      <section className='relative z-10 overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10' />
        <Image
          src='/banner.png'
          width={400}
          height={200}
          quality={85}
          priority={true}
          alt='Banner'
          className='absolute top-0 left-0 w-full h-full object-cover'
          sizes='100vw'
        />
        <div className='z-20 relative py-16 md:py-28 px-4 sm:px-10 md:px-20 flex flex-col items-center'>
          <h1 className='text-center text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold animate-fade-in-up'>
            {t('title')}
          </h1>
          <p className='text-center text-sm sm:text-base md:text-lg mt-4 max-w-2xl text-white/90 animate-fade-in-up animation-delay-100'>
            {t('slogan')}
          </p>
          <div className='flex flex-col sm:flex-row gap-3 mt-8 animate-fade-in-up animation-delay-200'>
            <a
              href='#dish-listing'
              className='inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'
            >
              Xem thực đơn
            </a>
            <Link
              href='/tables/1'
              className='inline-flex items-center justify-center rounded-md border border-white/50 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/20'
            >
              Đặt bàn
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Dishes + Stats Counter (client-side indicator data) */}
      <IndicatorSection dishCount={dishList.length} />

      {/* About Teaser Section */}
      <ScrollAnimate delay={150}>
        <AboutTeaser />
      </ScrollAnimate>

      {/* Dish Listing Section */}
      <ScrollAnimate>
        <section id='dish-listing' className='space-y-10 py-16 px-4 md:px-8'>
          <h2 className='text-center text-2xl font-bold'>{t('h2')}</h2>
          <DishFilter dishes={dishList} />
        </section>
      </ScrollAnimate>
    </div>
  )
}

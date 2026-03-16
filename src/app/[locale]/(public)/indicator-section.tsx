'use client'

import { useDashboardIndicator } from '@/queries/useIndicator'
import { startOfMonth, endOfDay } from 'date-fns'
import StatsCounter from '@/app/[locale]/(public)/stats-counter'
import FeaturedDishes from '@/app/[locale]/(public)/featured-dishes'
import ScrollAnimate from '@/components/scroll-animate'

export default function IndicatorSection({ dishCount }: { dishCount: number }) {
  const now = new Date()
  const { data } = useDashboardIndicator({
    fromDate: startOfMonth(now),
    toDate: endOfDay(now)
  })

  const indicatorData = data?.payload?.data ?? null
  const dishIndicator = indicatorData?.dishIndicator ?? []

  return (
    <>
      {dishIndicator.length > 0 && (
        <ScrollAnimate>
          <FeaturedDishes dishIndicator={dishIndicator} />
        </ScrollAnimate>
      )}

      <ScrollAnimate delay={100}>
        <StatsCounter
          dishCount={dishCount}
          orderCount={indicatorData?.orderCount ?? 0}
          guestCount={indicatorData?.guestCount ?? 0}
        />
      </ScrollAnimate>
    </>
  )
}


import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { formatCurrency, generateSlugUrl } from '@/lib/utils'
import { DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
import { Badge } from '@/components/ui/badge'
import { Flame } from 'lucide-react'

type DishIndicatorItem = DashboardIndicatorResType['data']['dishIndicator'][0]

export default function FeaturedDishes({
  dishIndicator
}: {
  dishIndicator: DishIndicatorItem[]
}) {
  const topDishes = dishIndicator.slice(0, 4)

  if (topDishes.length === 0) return null

  return (
    <section className='py-16 px-4 md:px-8 bg-muted/30'>
      <div className='max-w-6xl mx-auto'>
        <h2 className='text-center text-2xl md:text-3xl font-bold mb-2'>Món nổi bật</h2>
        <p className='text-center text-muted-foreground mb-10'>
          Những món ăn được yêu thích nhất tại nhà hàng
        </p>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {topDishes.map((dish) => (
            <Link
              key={dish.id}
              href={`/dishes/${generateSlugUrl({ name: dish.name, id: dish.id })}`}
              className='group block rounded-xl overflow-hidden bg-card border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1'
            >
              <div className='relative aspect-square overflow-hidden'>
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
                  className='object-cover transition-transform duration-300 group-hover:scale-105'
                  loading='lazy'
                />
                <Badge className='absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-white gap-1'>
                  <Flame className='h-3 w-3' />
                  Phổ biến
                </Badge>
              </div>
              <div className='p-4'>
                <h3 className='font-semibold text-base truncate'>{dish.name}</h3>
                <div className='flex items-center justify-between mt-2'>
                  <span className='font-bold text-primary'>{formatCurrency(dish.price)}</span>
                  <span className='text-xs text-muted-foreground'>{dish.successOrders} đơn</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}


import { UtensilsCrossed, Users, ShoppingBag } from 'lucide-react'

interface StatsCounterProps {
  dishCount: number
  orderCount: number
  guestCount: number
}

export default function StatsCounter({ dishCount, orderCount, guestCount }: StatsCounterProps) {
  const stats = [
    { icon: UtensilsCrossed, value: dishCount, label: 'Món ăn đa dạng' },
    { icon: ShoppingBag, value: orderCount, label: 'Đơn hàng phục vụ' },
    { icon: Users, value: guestCount, label: 'Khách hàng tin tưởng' }
  ]

  return (
    <section className='py-16 px-4 md:px-8'>
      <div className='max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8'>
        {stats.map((stat) => (
          <div key={stat.label} className='flex flex-col items-center text-center'>
            <div className='w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3'>
              <stat.icon className='h-7 w-7 text-primary' />
            </div>
            <span className='text-3xl md:text-4xl font-bold'>{stat.value.toLocaleString('vi-VN')}</span>
            <span className='text-sm text-muted-foreground mt-1'>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}


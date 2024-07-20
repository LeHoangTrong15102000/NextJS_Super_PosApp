'use client'
import Image from 'next/image'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDishListQuery } from '@/queries/useDish'
import { formatCurrency } from '@/lib/utils'

export default function MenuOrder() {
  const { data } = useDishListQuery()
  const dishes = data?.payload.data ?? []

  return (
    <>
      {dishes.map((dish) => (
        <div key={dish.id} className='flex gap-4'>
          <div className='flex-shrink-0'>
            <Image
              src={dish.image}
              alt={dish.name}
              height={100}
              width={100}
              quality={100}
              className='h-[80px] w-[80px] rounded-md object-cover'
            />
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm'>{dish.name}</h3>
            <p className='text-xs'>{dish.description}</p>
            <p className='text-xs font-semibold'>{formatCurrency(dish.price)}</p>
          </div>
          <div className='ml-auto flex flex-shrink-0 items-center justify-center'>
            <div className='flex gap-1'>
              <Button className='h-6 w-6 p-0'>
                <Minus className='h-3 w-3' />
              </Button>
              <Input type='text' readOnly className='h-6 w-8 p-1' />
              <Button className='h-6 w-6 p-0'>
                <Plus className='h-3 w-3' />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div className='sticky bottom-0'>
        <Button className='w-full justify-between'>
          <span>Giỏ hàng · 2 món</span>
          <span>100,000 đ</span>
        </Button>
      </div>
    </>
  )
}

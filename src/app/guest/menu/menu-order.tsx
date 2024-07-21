'use client'
import Image from 'next/image'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDishListQuery } from '@/queries/useDish'
import { formatCurrency, handleErrorApi } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { GuestCreateOrdersBodyType } from '@/schemaValidations/guest.schema'
import { useGuestOrderMutation } from '@/queries/useGuest'
import { useRouter } from 'next/navigation'
import Quantity from './quantity'

export default function MenuOrder() {
  const { data } = useDishListQuery()
  const dishes = useMemo(() => data?.payload.data ?? [], [data])
  const [orders, setOrders] = useState<GuestCreateOrdersBodyType>([])
  const { mutateAsync } = useGuestOrderMutation()
  const router = useRouter()

  const totalPrice = useMemo(() => {
    return dishes.reduce((result, dish) => {
      const order = orders.find((order) => order.dishId === dish.id)
      if (!order) return result

      return result + order.quantity * dish.price
    }, 0)
  }, [dishes, orders])

  const handleChangeQuantity = (dishId: number, quantity: number) => {
    setOrders((prevOrders) => {
      if (quantity === 0) {
        return prevOrders.filter((order) => order.dishId !== dishId)
      }

      const index = prevOrders.findIndex((order) => order.dishId === dishId)
      if (index === -1) {
        return [...prevOrders, { dishId, quantity }]
      }

      const newOrders = [...prevOrders]
      newOrders[index] = { ...newOrders[index], quantity }
      return newOrders
    })
  }

  const handleCreateOrder = async () => {
    try {
      await mutateAsync(orders)
      router.push(`/guest/orders`)
    } catch (error) {
      handleErrorApi({
        error
      })
    }
  }

  console.log('Check order cart', orders)

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
            {/* <div className='flex gap-1'>
              <Button className='h-6 w-6 p-0'>
                <Minus className='h-3 w-3' />
              </Button>
              <Input type='text' readOnly className='h-6 w-8 p-1' />
              <Button className='h-6 w-6 p-0'>
                <Plus className='h-3 w-3' />
              </Button>
            </div> */}
            <Quantity
              onChange={(value) => handleChangeQuantity(dish.id, value)}
              value={orders.find((order) => order.dishId === dish.id)?.quantity ?? 0}
            />
          </div>
        </div>
      ))}
      <div className='sticky bottom-0'>
        <Button className='w-full justify-between' onClick={handleCreateOrder} disabled={orders.length === 0}>
          <span>Giỏ hàng · {orders.length} món</span>
          <span>{formatCurrency(totalPrice)}</span>
        </Button>
      </div>
    </>
  )
}

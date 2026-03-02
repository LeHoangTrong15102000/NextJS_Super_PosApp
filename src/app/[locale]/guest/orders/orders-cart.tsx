'use client'

import { useAppStore } from '@/components/app-provider'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { OrderStatus } from '@/constants/type'
import { formatCurrency, getVietnameseOrderStatus } from '@/lib/utils'
import { useGuestGetOrderListQuery } from '@/queries/useGuest'
import { PayGuestOrdersResType, UpdateOrderResType } from '@/schemaValidations/order.schema'
import Image from 'next/image'
import { useEffect, useMemo } from 'react'

export default function OrdersCart() {
  const { data, refetch } = useGuestGetOrderListQuery()
  const orders = useMemo(() => data?.payload.data ?? [], [data])
  const socket = useAppStore((state) => state.socket)
  const { waitingForPaying, paid } = useMemo(() => {
    return orders.reduce(
      (result, order) => {
        if (
          order.status === OrderStatus.Delivered ||
          order.status === OrderStatus.Processing ||
          order.status === OrderStatus.Pending
        ) {
          return {
            ...result,
            waitingForPaying: {
              price: result.waitingForPaying.price + order.dishSnapshot.price * order.quantity,
              quantity: result.waitingForPaying.quantity + order.quantity
            }
          }
        }
        if (order.status === OrderStatus.Paid) {
          return {
            ...result,
            paid: {
              price: result.paid.price + order.dishSnapshot.price * order.quantity,
              quantity: result.paid.quantity + order.quantity
            }
          }
        }
        return result
      },
      {
        waitingForPaying: {
          price: 0,
          quantity: 0
        },
        paid: {
          price: 0,
          quantity: 0
        }
      }
    )
  }, [orders])

  const groupedOrders = useMemo(() => {
    const groups: Record<string, typeof orders> = {
      [OrderStatus.Pending]: [],
      [OrderStatus.Processing]: [],
      [OrderStatus.Delivered]: [],
      [OrderStatus.Paid]: [],
      [OrderStatus.Rejected]: []
    }
    orders.forEach((order) => {
      if (groups[order.status]) groups[order.status].push(order)
    })
    return groups
  }, [orders])

  const progressSteps = [
    { status: OrderStatus.Pending, label: 'Chờ xử lý' },
    { status: OrderStatus.Processing, label: 'Đang nấu' },
    { status: OrderStatus.Delivered, label: 'Đã phục vụ' }
  ]

  const activeStepIndex = useMemo(() => {
    const servingOrders = orders.filter((o) => o.status !== OrderStatus.Paid && o.status !== OrderStatus.Rejected)
    if (servingOrders.length === 0) return -1
    if (servingOrders.some((o) => o.status === OrderStatus.Delivered)) return 2
    if (servingOrders.some((o) => o.status === OrderStatus.Processing)) return 1
    return 0
  }, [orders])

  useEffect(() => {
    if (socket?.connected) {
      onConnect()
    }

    function onConnect() {
      if (process.env.NODE_ENV === 'development') {
        console.log('Socket connected:', socket?.id)
      }
    }

    function onDisconnect() {
      if (process.env.NODE_ENV === 'development') {
        console.log('Socket disconnected')
      }
    }

    function onUpdateOrder(data: UpdateOrderResType['data']) {
      const {
        dishSnapshot: { name },
        quantity
      } = data
      toast({
        description: `Món ${name} (SL: ${quantity}) vừa được cập nhật sang trạng thái "${getVietnameseOrderStatus(
          data.status
        )}"`
      })
      refetch()
    }

    function onPayment(data: PayGuestOrdersResType['data']) {
      const { guest } = data[0]
      toast({
        description: `${guest?.name} tại bàn ${guest?.tableNumber} thanh toán thành công ${data.length} đơn`
      })
      refetch()
    }

    socket?.on('update-order', onUpdateOrder)
    socket?.on('payment', onPayment)
    socket?.on('connect', onConnect)
    socket?.on('disconnect', onDisconnect)

    return () => {
      socket?.off('connect', onConnect)
      socket?.off('disconnect', onDisconnect)
      socket?.off('update-order', onUpdateOrder)
      socket?.off('payment', onPayment)
    }
  }, [refetch, socket])
  return (
    <>
      {activeStepIndex >= 0 && (
        <div className='flex items-center justify-between mb-4 px-2'>
          {progressSteps.map((step, i) => (
            <div key={step.status} className='flex items-center flex-1'>
              <div className={`flex flex-col items-center ${i <= activeStepIndex ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i <= activeStepIndex ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                  {i + 1}
                </div>
                <span className='text-[10px] mt-1'>{step.label}</span>
              </div>
              {i < progressSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${i < activeStepIndex ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {([OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Delivered, OrderStatus.Paid, OrderStatus.Rejected] as const).map((status) => {
        const group = groupedOrders[status]
        if (!group || group.length === 0) return null
        const subtotal = group.reduce((sum, o) => sum + o.dishSnapshot.price * o.quantity, 0)
        const count = group.reduce((sum, o) => sum + o.quantity, 0)
        return (
          <div key={status} className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h4 className='text-sm font-semibold'>{getVietnameseOrderStatus(status)} ({count} phần)</h4>
              <span className='text-sm font-medium'>{formatCurrency(subtotal)}</span>
            </div>
            {group.map((order) => (
              <div key={order.id} className='flex gap-4'>
                <div className='flex-shrink-0 relative'>
                  <Image
                    src={order.dishSnapshot.image}
                    alt={order.dishSnapshot.name}
                    height={100}
                    width={100}
                    quality={100}
                    className='object-cover w-[80px] h-[80px] rounded-md'
                  />
                </div>
                <div className='space-y-1'>
                  <h3 className='text-sm'>{order.dishSnapshot.name}</h3>
                  <div className='text-xs font-semibold'>
                    {formatCurrency(order.dishSnapshot.price)} x <Badge className='px-1'>{order.quantity}</Badge>
                  </div>
                </div>
                <div className='flex-shrink-0 ml-auto flex justify-center items-center'>
                  <Badge variant={'outline'}>{getVietnameseOrderStatus(order.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {paid.quantity !== 0 && (
        <div className='sticky bottom-0'>
          <div className='w-full flex space-x-4 text-xl font-semibold'>
            <span>Đơn đã thanh toán · {paid.quantity} món</span>
            <span>{formatCurrency(paid.price)}</span>
          </div>
        </div>
      )}
      <div className='sticky bottom-0'>
        <div className='w-full flex space-x-4 text-xl font-semibold'>
          <span>Đơn chưa thanh toán · {waitingForPaying.quantity} món</span>
          <span>{formatCurrency(waitingForPaying.price)}</span>
        </div>
      </div>
    </>
  )
}

'use client'

import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/constants/type'
import socket from '@/lib/socket'
import { formatCurrency, getVietnameseOrderStatus } from '@/lib/utils'
import { useGuestGetOrderListQuery } from '@/queries/useGuest'
import Image from 'next/image'
import { useEffect, useMemo } from 'react'
import { PayGuestOrdersBodyType, PayGuestOrdersResType, UpdateOrderResType } from '@/schemaValidations/order.schema'
import { toast } from '@/components/ui/use-toast'

export default function OrdersCart() {
  const { data, refetch } = useGuestGetOrderListQuery()
  const orders = useMemo(() => data?.payload.data ?? [], [data])

  const totalPrice = useMemo(() => {
    return orders.reduce((result, order) => {
      return result + order.dishSnapshot.price * order.quantity
    }, 0)
  }, [orders])

  const { waitingForPaying, paid } = useMemo(() => {
    // Tổng tiền các món chưa thanh toán và số lượng của nó
    // Tổng tiền các món đã thanh toán và số lượng của nó
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

  useEffect(() => {
    if (socket.connected) {
      onConnect()
    }

    function onConnect() {
      console.log(socket.id)
    }

    function onDisconnect() {
      console.log('disconnect')
    }

    function onUpdateOrder(data: UpdateOrderResType['data']) {
      const {
        dishSnapshot: { name },
        quantity
      } = data
      toast({
        description: `Món ${name} (SL: ${quantity}) vừa được cập nhật sang trạng thái "${getVietnameseOrderStatus(data.status)}"`
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

    socket.on('update-order', onUpdateOrder)
    socket.on('payment', onPayment)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('update-order', onUpdateOrder)
      socket.off('payment', onPayment)
    }
  }, [refetch])

  return (
    <>
      {orders.map((order, index) => (
        <div key={order.id} className='flex gap-4'>
          <div className='text-sm font-semibold'>{index + 1}</div>
          <div className='relative flex-shrink-0'>
            <Image
              src={order.dishSnapshot.image}
              alt={order.dishSnapshot.name}
              height={100}
              width={100}
              quality={100}
              className='h-[80px] w-[80px] rounded-md object-cover'
            />
          </div>
          <div className='space-y-1'>
            <h3 className='text-sm'>{order.dishSnapshot.name}</h3>
            <div className='text-xs font-semibold'>
              {formatCurrency(order.dishSnapshot.price)} x <Badge className='px-1'>{order.quantity}</Badge>
            </div>
          </div>
          <div className='ml-auto flex flex-shrink-0 items-center justify-center'>
            <Badge variant={'outline'}>{getVietnameseOrderStatus(order.status)}</Badge>
          </div>
        </div>
      ))}
      {paid.quantity !== 0 && (
        <div className='sticky bottom-0'>
          <div className='flex w-full space-x-4 text-xl font-semibold'>
            <span>Đơn đã thanh toán · {paid.quantity} món</span>
            <span>{formatCurrency(paid.price)}</span>
          </div>
        </div>
      )}
      <div className='sticky bottom-0'>
        <div className='flex w-full space-x-4 text-xl font-semibold'>
          <span>Đơn chưa thanh toán · {waitingForPaying.quantity} món</span>
          <span>{formatCurrency(waitingForPaying.price)}</span>
        </div>
      </div>
    </>
  )
}

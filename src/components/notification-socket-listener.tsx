'use client'

import { useAppStore } from '@/components/app-provider'
import { useNotificationStore } from '@/stores/notification-store'
import { useEffect } from 'react'
import { UpdateOrderResType } from '@/schemaValidations/order.schema'
import { GuestCreateOrdersResType } from '@/schemaValidations/guest.schema'
import { PayGuestOrdersResType } from '@/schemaValidations/order.schema'
import { getVietnameseOrderStatus } from '@/lib/utils'

export default function NotificationSocketListener() {
  const socket = useAppStore((state) => state.socket)
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    if (!socket) return

    function onNewOrder(data: GuestCreateOrdersResType['data']) {
      const guestName = data[0]?.guest?.name ?? 'Khách'
      const count = data.length
      addNotification('new-order', `${guestName} vừa đặt ${count} món mới`)
    }

    function onUpdateOrder(data: UpdateOrderResType['data']) {
      const { dishSnapshot, quantity, status } = data
      addNotification(
        'update-order',
        `Món ${dishSnapshot.name} (SL: ${quantity}) → ${getVietnameseOrderStatus(status)}`
      )
    }

    function onPayment(data: PayGuestOrdersResType['data']) {
      const guestName = data[0]?.guest?.name ?? 'Khách'
      addNotification('payment', `${guestName} đã thanh toán`)
    }

    socket.on('new-order', onNewOrder)
    socket.on('update-order', onUpdateOrder)
    socket.on('payment', onPayment)

    return () => {
      socket.off('new-order', onNewOrder)
      socket.off('update-order', onUpdateOrder)
      socket.off('payment', onPayment)
    }
  }, [socket, addNotification])

  return null
}


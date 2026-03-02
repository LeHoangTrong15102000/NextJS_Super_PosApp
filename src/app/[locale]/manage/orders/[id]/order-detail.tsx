'use client'

import { useGetOrderDetailQuery, useUpdateOrderMutation, usePayForGuestMutation } from '@/queries/useOrder'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrderStatus, OrderStatusValues } from '@/constants/type'
import {
  OrderStatusIcon, formatCurrency, formatDateTimeToLocaleString,
  getVietnameseOrderStatus, handleErrorApi
} from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from '@/i18n/routing'
import { ArrowLeft } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function OrderDetail({ orderId }: { orderId: number }) {
  const { data, refetch } = useGetOrderDetailQuery({ id: orderId, enabled: Boolean(orderId) })
  const updateOrderMutation = useUpdateOrderMutation()
  const payForGuestMutation = usePayForGuestMutation()
  const router = useRouter()

  if (!data) {
    return <div className='text-center py-8 text-muted-foreground'>Đang tải...</div>
  }

  const order = data.payload.data
  const { guest, dishSnapshot, quantity, status, createdAt, updatedAt, tableNumber } = order
  const totalAmount = dishSnapshot.price * quantity

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateOrderMutation.mutateAsync({
        orderId: order.id, status: newStatus as any,
        dishId: dishSnapshot.dishId ?? dishSnapshot.id, quantity
      })
      toast({ description: `Đã cập nhật trạng thái thành "${getVietnameseOrderStatus(newStatus as any)}"` })
      refetch()
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const handlePay = async () => {
    if (!guest || payForGuestMutation.isPending) return
    try {
      await payForGuestMutation.mutateAsync({ guestId: guest.id })
      toast({ description: 'Thanh toán thành công' })
      refetch()
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  return (
    <div className='space-y-6'>
      <Button variant='ghost' size='sm' onClick={() => router.push('/manage/orders')}>
        <ArrowLeft className='h-4 w-4 mr-2' /> Quay lại danh sách
      </Button>

      <div className='grid gap-6 md:grid-cols-2'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <h3 className='font-semibold'>Thông tin khách</h3>
            {guest ? (
              <div className='text-sm space-y-1'>
                <p>Tên: <span className='font-medium'>{guest.name}</span> (#{guest.id})</p>
                <p>Bàn: <span className='font-medium'>{guest.tableNumber ?? tableNumber ?? '-'}</span></p>
                <p>Ngày đăng ký: {formatDateTimeToLocaleString(guest.createdAt)}</p>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Không có thông tin khách</p>
            )}
          </div>

          <div className='space-y-2'>
            <h3 className='font-semibold'>Trạng thái</h3>
            <div className='flex items-center gap-2'>
              <Badge variant={status === OrderStatus.Paid ? 'default' : 'secondary'}>
                {getVietnameseOrderStatus(status)}
              </Badge>
              {status !== OrderStatus.Paid && status !== OrderStatus.Rejected && (
                <Select onValueChange={handleStatusChange} value={status}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Đổi trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    {OrderStatusValues.map((s) => (
                      <SelectItem key={s} value={s}>{getVietnameseOrderStatus(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className='space-y-2'>
            <h3 className='font-semibold'>Thời gian</h3>
            <div className='text-sm space-y-1'>
              <p>Tạo: {formatDateTimeToLocaleString(createdAt)}</p>
              <p>Cập nhật: {formatDateTimeToLocaleString(updatedAt)}</p>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <h3 className='font-semibold'>Món ăn</h3>
          <div className='flex gap-4 items-start'>
            <Image src={dishSnapshot.image} alt={dishSnapshot.name}
              width={80} height={80} className='rounded-md object-cover w-[80px] h-[80px]' />
            <div className='space-y-1'>
              <p className='font-medium'>{dishSnapshot.name}</p>
              <p className='text-sm text-muted-foreground'>{dishSnapshot.description}</p>
              <p className='text-sm'>Đơn giá: {formatCurrency(dishSnapshot.price)}</p>
              <p className='text-sm'>Số lượng: <Badge variant='outline'>{quantity}</Badge></p>
              <p className='text-lg font-bold'>Tổng: {formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {guest && status !== OrderStatus.Paid && status !== OrderStatus.Rejected && (
        <div className='pt-4 border-t'>
          <Button onClick={handlePay} disabled={payForGuestMutation.isPending}>
            Thanh toán cho {guest.name}
          </Button>
        </div>
      )}
    </div>
  )
}


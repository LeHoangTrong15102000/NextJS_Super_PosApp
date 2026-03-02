'use client'

import { GetOrdersResType } from '@/schemaValidations/order.schema'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getVietnameseOrderStatus } from '@/lib/utils'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

type OrderItem = GetOrdersResType['data'][0]

export default function OrderCardMobile({
  order,
  onEdit
}: {
  order: OrderItem
  onEdit: () => void
}) {
  return (
    <div className='border rounded-lg p-3 space-y-2'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-2'>
          <Image
            src={order.dishSnapshot.image}
            alt={order.dishSnapshot.name}
            width={50}
            height={50}
            className='rounded-md object-cover w-[50px] h-[50px]'
          />
          <div>
            <p className='text-sm font-medium'>{order.dishSnapshot.name}</p>
            <p className='text-xs text-muted-foreground'>
              {formatCurrency(order.dishSnapshot.price)} x {order.quantity}
            </p>
          </div>
        </div>
        <Badge variant={order.status === 'Paid' ? 'default' : 'secondary'} className='text-[10px]'>
          {getVietnameseOrderStatus(order.status)}
        </Badge>
      </div>
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span>Bàn {order.tableNumber ?? '-'} · {order.guest?.name ?? 'Đã xóa'}</span>
        <span className='font-semibold text-sm text-foreground'>
          {formatCurrency(order.dishSnapshot.price * order.quantity)}
        </span>
      </div>
      <Button variant='ghost' size='sm' className='w-full h-7 text-xs' onClick={onEdit}>
        <Pencil className='h-3 w-3 mr-1' /> Sửa
      </Button>
    </div>
  )
}


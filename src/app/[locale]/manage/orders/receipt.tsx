'use client'

import { GetOrdersResType } from '@/schemaValidations/order.schema'
import { formatCurrency, formatDateTimeToLocaleString } from '@/lib/utils'

type Guest = GetOrdersResType['data'][0]['guest']
type Orders = GetOrdersResType['data']

export default function Receipt({ guest, orders }: { guest: Guest; orders: Orders }) {
  const total = orders.reduce((sum, o) => sum + o.dishSnapshot.price * o.quantity, 0)

  return (
    <div className='receipt-print-area p-6 max-w-[300px] mx-auto text-sm font-mono'>
      <style jsx>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-print-area, .receipt-print-area * { visibility: visible; }
          .receipt-print-area { position: absolute; left: 0; top: 0; }
        }
      `}</style>

      <div className='text-center mb-4'>
        <h2 className='text-lg font-bold'>NHÀ HÀNG</h2>
        <p className='text-xs'>Hóa đơn thanh toán</p>
        <p className='text-xs'>{formatDateTimeToLocaleString(new Date().toISOString())}</p>
      </div>

      <div className='border-t border-dashed pt-2 mb-2'>
        {guest && (
          <div className='mb-2'>
            <p>Khách: {guest.name} (#{guest.id})</p>
            <p>Bàn: {guest.tableNumber ?? '-'}</p>
          </div>
        )}
      </div>

      <div className='border-t border-dashed pt-2'>
        <div className='flex justify-between font-bold mb-1'>
          <span>Món</span>
          <span>Thành tiền</span>
        </div>
        {orders.map((order) => (
          <div key={order.id} className='flex justify-between py-0.5'>
            <span className='flex-1'>{order.dishSnapshot.name} x{order.quantity}</span>
            <span>{formatCurrency(order.dishSnapshot.price * order.quantity)}</span>
          </div>
        ))}
      </div>

      <div className='border-t border-dashed mt-2 pt-2'>
        <div className='flex justify-between font-bold text-base'>
          <span>TỔNG CỘNG</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className='text-center mt-4 text-xs'>
        <p>Cảm ơn quý khách!</p>
      </div>
    </div>
  )
}


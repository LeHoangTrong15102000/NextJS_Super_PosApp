'use client'

import { TableListResType } from '@/schemaValidations/table.schema'
import { useTableListQuery } from '@/queries/useTable'
import { useGetOrderListQuery } from '@/queries/useOrder'
import { useOrderService } from '@/app/[locale]/manage/orders/order.service'
import { endOfDay, startOfDay } from 'date-fns'
import TableCard from '@/app/[locale]/manage/tables/table-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState, useMemo } from 'react'
import OrderGuestDetail from '@/app/[locale]/manage/orders/order-guest-detail'
import { Badge } from '@/components/ui/badge'
import { TableStatus } from '@/constants/type'

export default function TableMap() {
  const tableListQuery = useTableListQuery()
  const tableList = tableListQuery.data?.payload.data ?? []
  const orderListQuery = useGetOrderListQuery({
    fromDate: startOfDay(new Date()),
    toDate: endOfDay(new Date())
  })
  const orderList = orderListQuery.data?.payload.data ?? []
  const { servingGuestByTableNumber, orderObjectByGuestId } = useOrderService(orderList)

  const [selectedTable, setSelectedTable] = useState<number | null>(null)

  const sortedTables = useMemo(
    () => [...tableList].sort((a, b) => a.number - b.number),
    [tableList]
  )

  const selectedTableGuests = selectedTable ? servingGuestByTableNumber[selectedTable] : null

  const legend = [
    { label: 'Trống', className: 'bg-green-400' },
    { label: 'Đã đặt', className: 'bg-yellow-400' },
    { label: 'Đang phục vụ', className: 'bg-blue-400' },
    { label: 'Ẩn', className: 'bg-gray-400' }
  ]

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-3'>
        {legend.map((item) => (
          <div key={item.label} className='flex items-center gap-1.5 text-sm'>
            <span className={`w-3 h-3 rounded-sm ${item.className}`} />
            {item.label}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'>
        {sortedTables.map((table) => {
          const guestObj = servingGuestByTableNumber[table.number]
          const servingGuestCount = guestObj ? Object.keys(guestObj).length : 0
          return (
            <TableCard
              key={table.number}
              table={table}
              servingGuestCount={servingGuestCount}
              onClick={() => setSelectedTable(table.number)}
            />
          )
        })}
      </div>

      <Dialog open={selectedTable !== null} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className='sm:max-w-[500px] max-h-[80vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>Bàn {selectedTable}</DialogTitle>
          </DialogHeader>
          {selectedTableGuests && Object.keys(selectedTableGuests).length > 0 ? (
            <div className='space-y-4'>
              {Object.entries(selectedTableGuests).map(([guestId, orders]) => {
                const guest = orders[0]?.guest
                if (!guest) return null
                return (
                  <div key={guestId} className='border rounded-lg p-3'>
                    <OrderGuestDetail guest={guest} orders={orderObjectByGuestId[Number(guestId)]} />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className='text-muted-foreground text-center py-4'>Bàn hiện không có khách</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


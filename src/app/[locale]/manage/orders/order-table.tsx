'use client'
import { flexRender } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GetOrdersResType } from '@/schemaValidations/order.schema'
import AddOrder from '@/app/[locale]/manage/orders/add-order'
import EditOrder from '@/app/[locale]/manage/orders/edit-order'
import { createContext } from 'react'
import AutoPagination from '@/components/auto-pagination'
import { getVietnameseOrderStatus } from '@/lib/utils'
import { OrderStatusValues } from '@/constants/type'
import OrderStatics from '@/app/[locale]/manage/orders/order-statics'
import orderTableColumns from '@/app/[locale]/manage/orders/order-table-columns'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import TableSkeleton from '@/app/[locale]/manage/orders/table-skeleton'
import { useOrderTable } from '@/app/[locale]/manage/orders/use-order-table'

export const OrderTableContext = createContext({
  setOrderIdEdit: (value: number | undefined) => {},
  orderIdEdit: undefined as number | undefined,
  changeStatus: (payload: {
    orderId: number
    dishId: number
    status: (typeof OrderStatusValues)[number]
    quantity: number
  }) => {},
  orderObjectByGuestId: {} as OrderObjectByGuestID
})

export type StatusCountObject = Record<(typeof OrderStatusValues)[number], number>
export type Statics = {
  status: StatusCountObject
  table: Record<number, Record<number, StatusCountObject>>
}
export type OrderObjectByGuestID = Record<number, GetOrdersResType['data']>
export type ServingGuestByTableNumber = Record<number, OrderObjectByGuestID>

export default function OrderTable() {
  const {
    table, orderList, orderListQuery, orderIdEdit, setOrderIdEdit,
    changeStatus, orderObjectByGuestId, statics, servingGuestByTableNumber,
    tableListSortedByNumber, fromDate, setFromDate, toDate, setToDate,
    resetDateFilter, openStatusFilter, setOpenStatusFilter
  } = useOrderTable()

  return (
    <OrderTableContext.Provider
      value={{ orderIdEdit, setOrderIdEdit, changeStatus, orderObjectByGuestId }}
    >
      <div className='w-full'>
        <EditOrder id={orderIdEdit} setId={setOrderIdEdit} onSubmitSuccess={() => {}} />
        <div className=' flex items-center'>
          <div className='flex flex-wrap gap-2'>
            <div className='flex items-center'>
              <span className='mr-2'>Từ</span>
              <Input
                type='datetime-local'
                placeholder='Từ ngày'
                className='text-sm'
                value={format(fromDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
                onChange={(event) => setFromDate(new Date(event.target.value))}
              />
            </div>
            <div className='flex items-center'>
              <span className='mr-2'>Đến</span>
              <Input
                type='datetime-local'
                placeholder='Đến ngày'
                value={format(toDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
                onChange={(event) => setToDate(new Date(event.target.value))}
              />
            </div>
            <Button className='' variant={'outline'} onClick={resetDateFilter}>
              Reset
            </Button>
          </div>
          <div className='ml-auto'>
            <AddOrder />
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-4 py-4'>
          <Input
            placeholder='Tên khách'
            value={(table.getColumn('guestName')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('guestName')?.setFilterValue(event.target.value)}
            className='max-w-[100px]'
          />
          <Input
            placeholder='Số bàn'
            value={(table.getColumn('tableNumber')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('tableNumber')?.setFilterValue(event.target.value)}
            className='max-w-[80px]'
          />
          <Popover open={openStatusFilter} onOpenChange={setOpenStatusFilter}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={openStatusFilter}
                className='w-[150px] text-sm justify-between'
              >
                {table.getColumn('status')?.getFilterValue()
                  ? getVietnameseOrderStatus(
                      table.getColumn('status')?.getFilterValue() as (typeof OrderStatusValues)[number]
                    )
                  : 'Trạng thái'}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[200px] p-0'>
              <Command>
                <CommandGroup>
                  <CommandList>
                    {OrderStatusValues.map((status) => (
                      <CommandItem
                        key={status}
                        value={status}
                        onSelect={(currentValue) => {
                          table
                            .getColumn('status')
                            ?.setFilterValue(
                              currentValue === table.getColumn('status')?.getFilterValue() ? '' : currentValue
                            )
                          setOpenStatusFilter(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            table.getColumn('status')?.getFilterValue() === status ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {getVietnameseOrderStatus(status)}
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <OrderStatics
          statics={statics}
          tableList={tableListSortedByNumber}
          servingGuestByTableNumber={servingGuestByTableNumber}
        />
        {orderListQuery.isPending && <TableSkeleton />}
        {!orderListQuery.isPending && (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={orderTableColumns.length} className='h-24 text-center'>
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='text-xs text-muted-foreground py-4 flex-1 '>
            Hiển thị <strong>{table.getPaginationRowModel().rows.length}</strong> trong{' '}
            <strong>{orderList.length}</strong> kết quả
          </div>
          <div>
            <AutoPagination
              page={table.getState().pagination.pageIndex + 1}
              pageSize={table.getPageCount()}
              pathname='/manage/orders'
            />
          </div>
        </div>
      </div>
    </OrderTableContext.Provider>
  )
}

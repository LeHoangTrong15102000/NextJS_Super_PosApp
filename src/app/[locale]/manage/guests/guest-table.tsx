'use client'

import {
  ColumnDef, ColumnFiltersState, SortingState, VisibilityState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GetListGuestsResType } from '@/schemaValidations/account.schema'
import { useGetGuestListQuery } from '@/queries/useAccount'
import { useSearchParams } from 'next/navigation'
import AutoPagination from '@/components/auto-pagination'
import { useEffect, useState } from 'react'
import { format, endOfDay, startOfDay } from 'date-fns'
import { formatDateTimeToLocaleString } from '@/lib/utils'
import AddGuest from '@/app/[locale]/manage/guests/add-guest'

type GuestItem = GetListGuestsResType['data'][0]

const columns: ColumnDef<GuestItem>[] = [
  { accessorKey: 'id', header: 'ID' },
  {
    accessorKey: 'name', header: 'Tên',
    cell: ({ row }) => <div className='capitalize'>{row.getValue('name')}</div>
  },
  {
    accessorKey: 'tableNumber', header: 'Số bàn',
    cell: ({ row }) => <div>{row.getValue('tableNumber') ?? '-'}</div>,
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true
      return String(row.getValue(columnId)) === String(filterValue)
    }
  },
  {
    accessorKey: 'createdAt', header: 'Ngày tạo',
    cell: ({ row }) => <div>{formatDateTimeToLocaleString(row.getValue('createdAt'))}</div>
  }
]

const PAGE_SIZE = 10
const initFromDate = startOfDay(new Date())
const initToDate = endOfDay(new Date())

export default function GuestTable() {
  const searchParam = useSearchParams()
  const page = searchParam.get('page') ? Number(searchParam.get('page')) : 1
  const pageIndex = page - 1
  const [fromDate, setFromDate] = useState(initFromDate)
  const [toDate, setToDate] = useState(initToDate)
  const guestListQuery = useGetGuestListQuery({ fromDate, toDate })
  const data = guestListQuery.data?.payload.data ?? []
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({ pageIndex, pageSize: PAGE_SIZE })

  const table = useReactTable({
    data, columns,
    onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination, autoResetPageIndex: false,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination }
  })

  useEffect(() => {
    table.setPagination({ pageIndex, pageSize: PAGE_SIZE })
  }, [table, pageIndex])

  const resetDateFilter = () => { setFromDate(initFromDate); setToDate(initToDate) }

  return (
    <div className='w-full'>
      <div className='flex flex-wrap gap-2 items-center'>
        <div className='flex items-center'>
          <span className='mr-2'>Từ</span>
          <Input type='datetime-local' placeholder='Từ ngày' className='text-sm'
            value={format(fromDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
            onChange={(e) => setFromDate(new Date(e.target.value))} />
        </div>
        <div className='flex items-center'>
          <span className='mr-2'>Đến</span>
          <Input type='datetime-local' placeholder='Đến ngày'
            value={format(toDate, 'yyyy-MM-dd HH:mm').replace(' ', 'T')}
            onChange={(e) => setToDate(new Date(e.target.value))} />
        </div>
        <Button variant='outline' onClick={resetDateFilter}>Reset</Button>
        <div className='ml-auto'><AddGuest /></div>
      </div>
      <div className='flex flex-wrap items-center gap-4 py-4'>
        <Input placeholder='Tên khách'
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
          className='max-w-[200px]' />
        <Input placeholder='Số bàn'
          value={(table.getColumn('tableNumber')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('tableNumber')?.setFilterValue(e.target.value)}
          className='max-w-[100px]' />
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
                <TableCell colSpan={columns.length} className='h-24 text-center'>No results.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='text-xs text-muted-foreground py-4 flex-1'>
          Hiển thị <strong>{table.getPaginationRowModel().rows.length}</strong> trong{' '}
          <strong>{data.length}</strong> kết quả
        </div>
        <div>
          <AutoPagination page={table.getState().pagination.pageIndex + 1}
            pageSize={table.getPageCount()} pathname='/manage/guests' />
        </div>
      </div>
    </div>
  )
}


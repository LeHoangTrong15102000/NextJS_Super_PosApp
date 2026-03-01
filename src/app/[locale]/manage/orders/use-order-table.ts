'use client'

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { GetOrdersResType, PayGuestOrdersResType, UpdateOrderResType } from '@/schemaValidations/order.schema'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getVietnameseOrderStatus, handleErrorApi } from '@/lib/utils'
import orderTableColumns from '@/app/[locale]/manage/orders/order-table-columns'
import { useOrderService } from '@/app/[locale]/manage/orders/order.service'
import { endOfDay, startOfDay } from 'date-fns'
import { toast } from '@/components/ui/use-toast'
import { GuestCreateOrdersResType } from '@/schemaValidations/guest.schema'
import { useGetOrderListQuery, useUpdateOrderMutation } from '@/queries/useOrder'
import { useTableListQuery } from '@/queries/useTable'
import { useAppStore } from '@/components/app-provider'
import { OrderStatusValues } from '@/constants/type'

const PAGE_SIZE = 10
const initFromDate = startOfDay(new Date())
const initToDate = endOfDay(new Date())

export function useOrderTable() {
  const searchParam = useSearchParams()
  const socket = useAppStore((state) => state.socket)
  const [openStatusFilter, setOpenStatusFilter] = useState(false)
  const [fromDate, setFromDate] = useState(initFromDate)
  const [toDate, setToDate] = useState(initToDate)
  const page = searchParam.get('page') ? Number(searchParam.get('page')) : 1
  const pageIndex = page - 1
  const [orderIdEdit, setOrderIdEdit] = useState<number | undefined>()
  const orderListQuery = useGetOrderListQuery({ fromDate, toDate })
  const refetchOrderList = orderListQuery.refetch
  const orderList = orderListQuery.data?.payload.data ?? []
  const tableListQuery = useTableListQuery()
  const tableList = tableListQuery.data?.payload.data ?? []
  const tableListSortedByNumber = tableList.sort((a, b) => a.number - b.number)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize: PAGE_SIZE
  })
  const updateOrderMutation = useUpdateOrderMutation()
  const { statics, orderObjectByGuestId, servingGuestByTableNumber } = useOrderService(orderList)

  const changeStatus = async (body: {
    orderId: number
    dishId: number
    status: (typeof OrderStatusValues)[number]
    quantity: number
  }) => {
    try {
      await updateOrderMutation.mutateAsync(body)
    } catch (error) {
      handleErrorApi({ error })
    }
  }

  const table = useReactTable({
    data: orderList,
    columns: orderTableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    state: { sorting, columnFilters, columnVisibility, rowSelection, pagination }
  })

  useEffect(() => {
    table.setPagination({ pageIndex, pageSize: PAGE_SIZE })
  }, [table, pageIndex])

  const resetDateFilter = () => {
    setFromDate(initFromDate)
    setToDate(initToDate)
  }

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
    function refetch() {
      const now = new Date()
      if (now >= fromDate && now <= toDate) {
        refetchOrderList()
      }
    }
    function onUpdateOrder(data: UpdateOrderResType['data']) {
      const { dishSnapshot: { name }, quantity } = data
      toast({
        description: `Món ${name} (SL: ${quantity}) vừa được cập nhật sang trạng thái "${getVietnameseOrderStatus(data.status)}"`
      })
      refetch()
    }
    function onNewOrder(data: GuestCreateOrdersResType['data']) {
      const { guest } = data[0]
      toast({ description: `${guest?.name} tại bàn ${guest?.tableNumber} vừa đặt ${data.length} đơn` })
      refetch()
    }
    function onPayment(data: PayGuestOrdersResType['data']) {
      const { guest } = data[0]
      toast({ description: `${guest?.name} tại bàn ${guest?.tableNumber} thanh toán thành công ${data.length} đơn` })
      refetch()
    }
    socket?.on('update-order', onUpdateOrder)
    socket?.on('new-order', onNewOrder)
    socket?.on('connect', onConnect)
    socket?.on('disconnect', onDisconnect)
    socket?.on('payment', onPayment)
    return () => {
      socket?.off('connect', onConnect)
      socket?.off('disconnect', onDisconnect)
      socket?.off('update-order', onUpdateOrder)
      socket?.off('new-order', onNewOrder)
      socket?.off('payment', onPayment)
    }
  }, [refetchOrderList, fromDate, toDate, socket])

  return {
    table, orderList, orderListQuery, orderIdEdit, setOrderIdEdit,
    changeStatus, orderObjectByGuestId, statics, servingGuestByTableNumber,
    tableListSortedByNumber, fromDate, setFromDate, toDate, setToDate,
    resetDateFilter, openStatusFilter, setOpenStatusFilter
  }
}


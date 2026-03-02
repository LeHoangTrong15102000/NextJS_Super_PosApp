import { format } from 'date-fns'
import { DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
import { GetOrdersResType } from '@/schemaValidations/order.schema'
import { getVietnameseOrderStatus } from '@/lib/utils'

type DashboardData = {
  revenue: number
  guestCount: number
  orderCount: number
  servingTableCount: number
  revenueByDate: DashboardIndicatorResType['data']['revenueByDate']
  dishIndicator: DashboardIndicatorResType['data']['dishIndicator']
}

function escapeCsvValue(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportDashboardCSV(data: DashboardData, fromDate: Date, toDate: Date) {
  const rows: string[] = []

  // Summary section
  rows.push('=== TỔNG QUAN ===')
  rows.push('Chỉ số,Giá trị')
  rows.push(`Tổng doanh thu,${data.revenue}`)
  rows.push(`Số khách,${data.guestCount}`)
  rows.push(`Số đơn hàng,${data.orderCount}`)
  rows.push(`Bàn đang phục vụ,${data.servingTableCount}`)
  rows.push(`Giá trị TB/đơn,${data.orderCount > 0 ? Math.round(data.revenue / data.orderCount) : 0}`)
  rows.push('')

  // Revenue by date section
  rows.push('=== DOANH THU THEO NGÀY ===')
  rows.push('Ngày,Doanh thu')
  for (const item of data.revenueByDate) {
    rows.push(`${escapeCsvValue(item.date)},${item.revenue}`)
  }
  rows.push('')

  // Top dishes section
  rows.push('=== TOP MÓN BÁN CHẠY ===')
  rows.push('STT,Tên món,Đơn thành công,Giá,Doanh thu ước tính')
  const sorted = [...data.dishIndicator].sort((a, b) => b.successOrders - a.successOrders).slice(0, 10)
  sorted.forEach((dish, index) => {
    rows.push(
      `${index + 1},${escapeCsvValue(dish.name)},${dish.successOrders},${dish.price},${dish.successOrders * dish.price}`
    )
  })

  const csvContent = '\uFEFF' + rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const from = format(fromDate, 'dd-MM-yyyy')
  const to = format(toDate, 'dd-MM-yyyy')
  const filename = `dashboard-${from}-${to}.csv`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportOrdersCSV(orders: GetOrdersResType['data'], fromDate: Date, toDate: Date) {
  const rows: string[] = []
  rows.push('Order ID,Tên khách,Guest ID,Số bàn,Tên món,Số lượng,Đơn giá,Thành tiền,Trạng thái,Ngày tạo,Ngày cập nhật')
  for (const order of orders) {
    rows.push([
      order.id,
      escapeCsvValue(order.guest?.name ?? 'Đã xóa'),
      order.guestId ?? '',
      order.tableNumber ?? '',
      escapeCsvValue(order.dishSnapshot.name),
      order.quantity,
      order.dishSnapshot.price,
      order.dishSnapshot.price * order.quantity,
      escapeCsvValue(getVietnameseOrderStatus(order.status)),
      format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
      format(new Date(order.updatedAt), 'dd/MM/yyyy HH:mm')
    ].join(','))
  }

  const csvContent = '\uFEFF' + rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const from = format(fromDate, 'dd-MM-yyyy')
  const to = format(toDate, 'dd-MM-yyyy')
  const filename = `orders-${from}-${to}.csv`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


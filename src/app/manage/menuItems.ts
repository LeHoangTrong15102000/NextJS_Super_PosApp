import { Home, LineChart, ShoppingCart, Users2, Salad, Table, LayoutDashboard } from 'lucide-react'

const menuItems = [
  {
    title: 'Home',
    Icon: Home,
    href: '/'
  },
  {
    title: 'Dashboard',
    Icon: LayoutDashboard,
    href: '/manage/dashboard'
  },
  {
    title: 'Đơn hàng',
    Icon: ShoppingCart,
    href: '/manage/orders'
  },
  {
    title: 'Bàn ăn',
    Icon: Table,
    href: '/manage/tables'
  },
  {
    title: 'Món ăn',
    Icon: Salad,
    href: '/manage/dishes'
  },

  {
    title: 'Phân tích',
    Icon: LineChart,
    href: '/manage/analytics'
  },
  {
    title: 'Nhân viên',
    Icon: Users2,
    href: '/manage/accounts'
  }
]

export default menuItems

'use client'

import { getAccessTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from '@/lib/utils'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const menuItems = [
  {
    title: 'Món ăn',
    href: '/menu'
    // authRequired = undefined nghĩa là đăng nhập  hay chưa đều cho hiển thị
  },
  {
    title: 'Đơn hàng',
    href: '/orders',
    authRequired: true
  },
  {
    title: 'Đăng nhập',
    href: '/login',
    authRequired: false // khi false nghĩa là chưa đăng nhập thì sẽ hiển thị
  },
  {
    title: 'Quản lý',
    href: '/manage/dashboard',
    authRequired: true // khi true nghĩa là đăng nhập rồi thì mới cho hiển thị
  }
]

// Server: Món ăn, Đăng nhập. Do server không biết trạng thái đăng nhập của user
// CLient: Đầu tiên client sẽ hiển thị là Món ăn, Đăng nhập.
// Nhưng ngay sau đó thì client render ra là Món ăn, Đơn hàng, Quản lý do đã check được trạng thái đăng nhập

// Thì thằng nextClien  này do nó được render ở client nên là khi F5 nó sẽ bị giật một tí
// Nếu mà render ở server thì sẽ không xảy ra trường hợp đó

export default function NavItems({ className }: { className?: string }) {
  // Cho nó giống trên server vì server nó đâu có biết là đăng nhập hay chưa nên nó cho cái isAuth là false
  // const refreshTokenFromLocalStorage = getRefreshTokenFromLocalStorage()
  const accessTokenFromLocalStorage = getAccessTokenFromLocalStorage()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    if (accessTokenFromLocalStorage) {
      setIsAuth(Boolean(getAccessTokenFromLocalStorage()))
    }
    setIsAuth(false)
  }, [accessTokenFromLocalStorage])

  return menuItems.map((item) => {
    if ((item.authRequired === false && isAuth) || (item.authRequired === true && !isAuth)) return null
    return (
      <Link href={item.href} key={item.href} className={className}>
        {item.title}
      </Link>
    )
  })
}

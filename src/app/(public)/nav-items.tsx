'use client'

import { useAppContext } from '@/components/app-provider'
import { toast } from '@/components/ui/use-toast'
import { Role } from '@/constants/type'
import { cn, getAccessTokenFromLocalStorage, getRefreshTokenFromLocalStorage, handleErrorApi } from '@/lib/utils'
import { useLogoutMutation } from '@/queries/useAuth'
import { RoleType } from '@/types/jwt.types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

const menuItems: {
  title: string
  href: string
  role?: RoleType[]
  hideWhenLogin?: boolean
}[] = [
  {
    title: 'Trang chủ',
    href: '/'
  },
  {
    title: 'Menu',
    href: '/guest/menu',
    role: [Role.Guest]
    // authRequired = undefined nghĩa là đăng nhập  hay chưa đều cho hiển thị
  },
  {
    title: 'Đơn hàng',
    href: '/guest/orders',
    role: [Role.Guest]
  },

  {
    title: 'Đăng nhập',
    href: '/login',
    // khi false nghĩa là chưa đăng nhập thì sẽ hiển thị
    hideWhenLogin: true
  },
  {
    title: 'Quản lý',
    href: '/manage/dashboard',
    role: [Role.Owner, Role.Employee] // khi true nghĩa là đăng nhập rồi thì mới cho hiển thị
  }
]

// Server: Món ăn, Đăng nhập. Do server không biết trạng thái đăng nhập của user
// CLient: Đầu tiên client sẽ hiển thị là Món ăn, Đăng nhập.
// Nhưng ngay sau đó thì client render ra là Món ăn, Đơn hàng, Quản lý do đã check được trạng thái đăng nhập

// Thì thằng nextClient  này do nó được render ở client nên là khi F5 nó sẽ bị giật một tí
// Nếu mà render ở server thì sẽ không xảy ra trường hợp đó

export default function NavItems({ className }: { className?: string }) {
  // Cho nó giống trên server vì server nó đâu có biết là đăng nhập hay chưa nên nó cho cái isAuth là false
  // const refreshTokenFromLocalStorage = getRefreshTokenFromLocalStorage()
  // const accessTokenFromLocalStorage = getAccessTokenFromLocalStorage()
  // const [isAuth, setIsAuth] = useState(false)
  // const { isAuth } = useAppContext()

  // useEffect(() => {
  //   if (accessTokenFromLocalStorage) {
  //     setIsAuth(Boolean(getAccessTokenFromLocalStorage()))
  //   }
  //   setIsAuth(false)
  // }, [accessTokenFromLocalStorage])

  // useEffect(() => {
  //   setIsAuth(Boolean(accessTokenFromLocalStorage))
  // }, [])

  const { role, setRole } = useAppContext()
  const logoutMutation = useLogoutMutation()
  const router = useRouter()

  const handleLogout = async () => {
    if (logoutMutation.isPending) return
    try {
      const result = await logoutMutation.mutateAsync()
      toast({
        description: result.payload.message
      })
      setRole()
      router.push('/')
    } catch (error: any) {
      handleErrorApi({
        error
      })
    }
  }

  return (
    <>
      {menuItems.map((item) => {
        // Trường hợp đăng nhập thì chỉ hiển thị menu đăng nhập
        const isAuth = item.role && role && item.role.includes(role)
        // Trường hợp menu item có thể hiển thị dù cho đã đăng nhập hay chưa
        const canShow = (item.role === undefined && !item.hideWhenLogin) || (!role && item.hideWhenLogin)
        if (isAuth || canShow) {
          return (
            <Link href={item.href} key={item.href} className={className}>
              {item.title}
            </Link>
          )
        }
        return null
      })}
      {role && (
        // Hàm cn là hàm merge các className ở trong component
        // <div className={cn(className, 'cursor-pointer')} onClick={logout}>
        //   Đăng xuất
        // </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className={cn(className, 'cursor-pointer')}>Đăng xuất</div>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có muốn đăng xuất không?</AlertDialogTitle>
              <AlertDialogDescription>Việc đăng xuất có thể làm mất đi hoá đơn của bạn</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Thoát</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}

'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useLogoutMutation } from '@/queries/useAuth'
import { Hind_Madurai } from 'next/font/google'
import { handleErrorApi } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { useAccountMe } from '@/queries/useAccount'

// const account = {
//   name: 'Nguyễn Văn A',
//   avatar: 'https://i.pravatar.cc/150'
// }

const DropdownAvatar = () => {
  const { data } = useAccountMe()
  const logoutMutation = useLogoutMutation()
  const router = useRouter()

  const account = data?.payload?.data

  const handleLogout = async () => {
    if (logoutMutation.isPending) return
    try {
      const result = await logoutMutation.mutateAsync()
      toast({
        description: result.payload.message
      })
      router.push('/')
    } catch (error) {
      //  Phòng trường hợp cái nextServer nó bị cái vấn đề gì đó bị lỗi thì chúng ta vẫn có thể xử lý được
      handleErrorApi({
        error
      })
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='overflow-hidden rounded-full'>
          <Avatar>
            {/* Khi cái đường link image nó không tồn tại thì cái AvatarFallback nó sẽ show lên */}
            <AvatarImage src={account?.avatar ?? undefined} alt={account?.name} />
            <AvatarFallback>{account?.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>{account?.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={'/manage/setting'} className='cursor-pointer'>
            Cài đặt
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>Hỗ trợ</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Đăng xuất</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DropdownAvatar

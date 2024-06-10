import accountApiRequest from '@/apiRequests/account'
import { toast } from '@/components/ui/use-toast'
import { cookies } from 'next/headers'

const Dashboard = async () => {
  const cookieStore = cookies()
  //  Hoặc là để dấu '!' ở phía cuối để mà nói với typescript răng thằng này chắc chắn sẽ không undefined
  const accessToken = cookieStore.get('accessToken')?.value as string
  let name = ''

  // Khi mà gọi đến sMeProfile thì cái Authorization ở http chính là cái AT ở cookie gửi lên
  try {
    const result = await accountApiRequest.sMeProfile(accessToken)
    name = result.payload.data.name
    toast({
      description: result.payload.message
    })
  } catch (error: any) {
    // Nếu mà error.digest là NEXT_REDIRECT thì cho nó throw thoải mái để mà nó không nhảy vào return TSX được
    if (error.digest?.includes('NEXT_REDIRECT')) {
      // Thì sẽ cho nó throw cái error thoải mái
      throw error
    }
  }
  return <div>Dashboard {name}</div>
}

export default Dashboard

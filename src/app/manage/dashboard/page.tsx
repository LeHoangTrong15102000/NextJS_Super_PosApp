// import accountApiRequest from '@/apiRequests/account'
// import { toast } from '@/components/ui/use-toast'
// import { getAccessTokenFromLocalStorage } from '@/lib/utils'
// import { cookies } from 'next/headers'

// const Dashboard = async () => {
//   const cookieStore = cookies()
//   //  Hoặc là để dấu '!' ở phía cuối để mà nói với typescript răng thằng này chắc chắn sẽ không undefined
//   const accessToken = cookieStore.get('accessToken')?.value as string
//   let name = ''

//   // Khi mà gọi đến sMeProfile thì cái Authorization ở http chính là cái AT ở cookie gửi lên
//   try {
//     const result = await accountApiRequest.sMeProfile(accessToken)
//     name = result.payload.data.name
//     toast({
//       description: result.payload.message
//     })
//   } catch (error: any) {
//     // Tự động logout khi mà gọi API bị lỗi ở serverComponent, và lỗi có chứa là NEXT_REDIRECT thì chúng ta sẽ cho nó tiếp tục throw
//     // Nếu mà error.digest là NEXT_REDIRECT thì cho nó throw thoải mái để mà nó không nhảy vào return TSX được
//     if (error.digest?.includes('NEXT_REDIRECT')) {
//       // Thì sẽ cho nó throw cái error thoải mái
//       throw error
//     }
//   }
//   return <div>Dashboard {name}</div>
// }

// export default Dashboard

import DashboardMain from '@/app/manage/dashboard/dashboard-main'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Dashboard() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Phân tích các chỉ số</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardMain />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

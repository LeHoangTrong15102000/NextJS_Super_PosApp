import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import TableBoard from '@/app/manage/tables/table-board'
import { Suspense } from 'react'

export default function TablesPage() {
  return (
    <main className='grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
      <div className='space-y-2'>
        <Card x-chunk='dashboard-06-chunk-0'>
          <CardHeader>
            <CardTitle>Bàn ăn</CardTitle>
            <CardDescription>Quản lý bàn ăn</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <TableBoard />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

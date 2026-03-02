'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import { useMemo } from 'react'

type DishIndicatorItem = DashboardIndicatorResType['data']['dishIndicator'][0]

export function TopDishesTable({ dishIndicator }: { dishIndicator: DishIndicatorItem[] }) {
  const topDishes = useMemo(
    () =>
      [...dishIndicator]
        .sort((a, b) => b.successOrders - a.successOrders)
        .slice(0, 10),
    [dishIndicator]
  )

  if (dishIndicator.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top món bán chạy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground text-center py-4'>Chưa có dữ liệu món ăn</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top món bán chạy</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>#</TableHead>
              <TableHead>Món ăn</TableHead>
              <TableHead className='text-right'>Đơn thành công</TableHead>
              <TableHead className='text-right'>Giá</TableHead>
              <TableHead className='text-right'>Doanh thu ước tính</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topDishes.map((dish, index) => (
              <TableRow key={dish.id}>
                <TableCell className='font-medium'>{index + 1}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <Image
                      src={dish.image}
                      alt={dish.name}
                      width={40}
                      height={40}
                      className='rounded object-cover w-[40px] h-[40px]'
                    />
                    <span className='font-medium'>{dish.name}</span>
                  </div>
                </TableCell>
                <TableCell className='text-right'>{dish.successOrders}</TableCell>
                <TableCell className='text-right'>{formatCurrency(dish.price)}</TableCell>
                <TableCell className='text-right'>
                  {formatCurrency(dish.successOrders * dish.price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}


'use client'

import { Bar, BarChart, XAxis, YAxis } from 'recharts'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'
import { DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
import { useMemo } from 'react'

const colors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
]

const chartConfig = {
  successOrders: {
    label: 'Đơn thành công'
  },
  dish1: {
    label: 'Món 1',
    color: 'var(--chart-1)'
  },
  dish2: {
    label: 'Món 2',
    color: 'var(--chart-2)'
  },
  dish3: {
    label: 'Món 3',
    color: 'var(--chart-3)'
  },
  dish4: {
    label: 'Món 4',
    color: 'var(--chart-4)'
  },
  dish5: {
    label: 'Món 5',
    color: 'var(--chart-5)'
  }
} satisfies ChartConfig

export function DishBarChart({
  chartData
}: {
  chartData: Pick<
    DashboardIndicatorResType['data']['dishIndicator'][0],
    'name' | 'successOrders'
  >[]
}) {
  const chartDateColors = useMemo(
    () =>
      chartData.map((data, index) => {
        return {
          ...data,
          fill: colors[index] ?? colors[colors.length - 1]
        }
      }),
    [chartData]
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>Xếp hạng món ăn</CardTitle>
        <CardDescription>Được gọi nhiều nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartDateColors}
            layout='vertical'
            margin={{
              left: 0
            }}
          >
            <YAxis
              dataKey='name'
              type='category'
              tickLine={false}
              tickMargin={2}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <XAxis dataKey='successOrders' type='number' hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey='successOrders'
              name={'Đơn thanh toán: '}
              radius={5}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

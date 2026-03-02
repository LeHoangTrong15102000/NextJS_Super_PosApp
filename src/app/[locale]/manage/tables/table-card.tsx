'use client'

import { TableListResType } from '@/schemaValidations/table.schema'
import { TableStatus } from '@/constants/type'
import { cn, getVietnameseTableStatus } from '@/lib/utils'
import { Users } from 'lucide-react'

type TableItem = TableListResType['data'][0]

const statusColorMap: Record<string, string> = {
  [TableStatus.Available]: 'bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-600',
  [TableStatus.Reserved]: 'bg-yellow-100 border-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-600',
  [TableStatus.Hidden]: 'bg-gray-100 border-gray-300 dark:bg-gray-800/50 dark:border-gray-600'
}

const servingColor = 'bg-blue-100 border-blue-400 dark:bg-blue-900/30 dark:border-blue-600'

export default function TableCard({
  table,
  servingGuestCount,
  onClick
}: {
  table: TableItem
  servingGuestCount: number
  onClick?: () => void
}) {
  const isServing = servingGuestCount > 0
  const colorClass = isServing ? servingColor : (statusColorMap[table.status] ?? statusColorMap[TableStatus.Hidden])

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all hover:shadow-md cursor-pointer min-h-[120px]',
        colorClass
      )}
    >
      <span className='text-2xl font-bold'>{table.number}</span>
      <div className='flex items-center gap-1 text-xs text-muted-foreground mt-1'>
        <Users className='h-3 w-3' />
        <span>{table.capacity}</span>
      </div>
      <span className='text-xs mt-1'>
        {isServing ? `Đang phục vụ (${servingGuestCount})` : getVietnameseTableStatus(table.status)}
      </span>
    </button>
  )
}


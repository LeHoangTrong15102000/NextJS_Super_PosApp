'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import TableTable from '@/app/[locale]/manage/tables/table-table'
import TableMap from '@/app/[locale]/manage/tables/table-map'

export default function TableViewToggle() {
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setView('list')}
        >
          <List className='h-4 w-4 mr-1' /> Danh sách
        </Button>
        <Button
          variant={view === 'map' ? 'default' : 'outline'}
          size='sm'
          onClick={() => setView('map')}
        >
          <LayoutGrid className='h-4 w-4 mr-1' /> Bản đồ
        </Button>
      </div>
      {view === 'list' ? <TableTable /> : <TableMap />}
    </div>
  )
}


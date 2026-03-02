'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Keyboard } from 'lucide-react'

const shortcuts = [
  { keys: 'Ctrl + K', description: 'Tìm kiếm' },
  { keys: '?', description: 'Mở trợ giúp phím tắt' },
  { keys: 'Escape', description: 'Đóng dialog' }
]

export default function KeyboardShortcutsHelp({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Keyboard className='h-5 w-5' /> Phím tắt
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-2'>
          {shortcuts.map((s) => (
            <div key={s.keys} className='flex items-center justify-between py-1.5 border-b last:border-0'>
              <span className='text-sm'>{s.description}</span>
              <kbd className='px-2 py-1 text-xs font-mono bg-muted rounded border'>{s.keys}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}


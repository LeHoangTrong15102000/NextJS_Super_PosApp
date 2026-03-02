'use client'

import { useNotificationStore, NotificationType } from '@/stores/notification-store'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bell, ShoppingCart, RefreshCw, CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useEffect } from 'react'

const typeIcons: Record<NotificationType, typeof Bell> = {
  'new-order': ShoppingCart,
  'update-order': RefreshCw,
  payment: CreditCard
}

export default function NotificationCenter() {
  const notifications = useNotificationStore((s) => s.notifications)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const cleanup = useNotificationStore((s) => s.cleanup)
  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const interval = setInterval(cleanup, 60 * 1000)
    return () => clearInterval(interval)
  }, [cleanup])

  const recent = notifications.slice(0, 20)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]'
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[340px] p-0' align='end'>
        <div className='flex items-center justify-between p-3 border-b'>
          <span className='font-semibold text-sm'>Thông báo</span>
          {unreadCount > 0 && (
            <Button variant='ghost' size='sm' className='text-xs h-7' onClick={markAllRead}>
              Đánh dấu đã đọc
            </Button>
          )}
        </div>
        <div className='max-h-[360px] overflow-auto'>
          {recent.length === 0 ? (
            <p className='text-center text-muted-foreground text-sm py-8'>Chưa có thông báo</p>
          ) : (
            recent.map((n) => {
              const Icon = typeIcons[n.type] ?? Bell
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-3 py-2.5 border-b last:border-0 ${!n.read ? 'bg-muted/50' : ''}`}
                >
                  <Icon className='h-4 w-4 mt-0.5 shrink-0 text-muted-foreground' />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm leading-tight'>{n.message}</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                  {!n.read && <span className='w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0' />}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}


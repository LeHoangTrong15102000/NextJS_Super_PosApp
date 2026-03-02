'use client'

import { usePathname } from '@/i18n/routing'
import { Link } from '@/i18n/routing'
import menuItems from '@/app/[locale]/manage/menuItems'
import { useAppStore } from '@/components/app-provider'
import { cn } from '@/lib/utils'

export default function BottomNav() {
  const pathname = usePathname()
  const role = useAppStore((state) => state.role)
  const filteredItems = menuItems.filter((item) => !role || item.roles.includes(role as (typeof item.roles)[number]))

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden'>
      <div className='flex items-center justify-around h-14'>
        {filteredItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href
          const Icon = item.Icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] w-full h-full',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className='h-5 w-5' />
              <span className='truncate max-w-[60px]'>{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


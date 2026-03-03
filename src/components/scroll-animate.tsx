'use client'

import { useIntersectionObserver } from '@/lib/use-intersection-observer'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

export default function ScrollAnimate({
  children,
  className,
  delay
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 })

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
        className
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}


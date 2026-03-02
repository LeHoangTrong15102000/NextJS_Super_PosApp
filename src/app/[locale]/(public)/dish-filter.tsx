'use client'

import { DishListResType } from '@/schemaValidations/dish.schema'
import { formatCurrency, generateSlugUrl } from '@/lib/utils'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'
import { DishStatus } from '@/constants/type'

type DishItem = DishListResType['data'][0]

export default function DishFilter({ dishes }: { dishes: DishItem[] }) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<string>('default')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timerRef.current)
  }, [search])

  const filteredDishes = useMemo(() => {
    let result = dishes.filter((d) => d.status === DishStatus.Available)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
    }
    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price)
    else if (sortBy === 'name-asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [dishes, debouncedSearch, sortBy])

  const hasFilter = search || sortBy !== 'default'

  const clearFilter = () => {
    setSearch('')
    setDebouncedSearch('')
    setSortBy('default')
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Tìm món ăn...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8'
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className='w-full sm:w-[180px]'>
            <SelectValue placeholder='Sắp xếp' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='default'>Mặc định</SelectItem>
            <SelectItem value='price-asc'>Giá tăng dần</SelectItem>
            <SelectItem value='price-desc'>Giá giảm dần</SelectItem>
            <SelectItem value='name-asc'>Tên A-Z</SelectItem>
          </SelectContent>
        </Select>
        {hasFilter && (
          <Button variant='ghost' size='icon' onClick={clearFilter}>
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      {filteredDishes.length === 0 ? (
        <p className='text-center text-muted-foreground py-8'>Không tìm thấy món ăn nào</p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-10'>
          {filteredDishes.map((dish) => (
            <Link
              href={`/dishes/${generateSlugUrl({ name: dish.name, id: dish.id })}`}
              className='flex gap-4'
              key={dish.id}
            >
              <div className='flex-shrink-0'>
                <Image
                  src={dish.image}
                  width={150}
                  height={150}
                  quality={80}
                  loading='lazy'
                  alt={dish.name}
                  className='object-cover w-[150px] h-[150px] rounded-md'
                />
              </div>
              <div className='space-y-1'>
                <h3 className='text-xl font-semibold'>{dish.name}</h3>
                <p>{dish.description}</p>
                <p className='font-semibold'>{formatCurrency(dish.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


'use client'

import { DishListResType } from '@/schemaValidations/dish.schema'
import { DashboardIndicatorResType } from '@/schemaValidations/indicator.schema'
import { formatCurrency, generateSlugUrl } from '@/lib/utils'
import Image from 'next/image'
import { Link } from '@/i18n/routing'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, X, Flame } from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'
import { DishStatus } from '@/constants/type'
import { getDishCategories, filterDishesByCategory } from '@/lib/dish-categories'

type DishItem = DishListResType['data'][0]
type DishIndicatorItem = DashboardIndicatorResType['data']['dishIndicator'][0]

interface DishFilterProps {
  dishes: DishItem[]
  dishIndicator?: DishIndicatorItem[]
}

export default function DishFilter({ dishes, dishIndicator = [] }: DishFilterProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortBy, setSortBy] = useState<string>('default')
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const popularDishIds = useMemo(
    () => new Set(dishIndicator.map((d) => d.id)),
    [dishIndicator]
  )

  const availableDishes = useMemo(
    () => dishes.filter((d) => d.status === DishStatus.Available),
    [dishes]
  )

  const categories = useMemo(
    () => getDishCategories(availableDishes),
    [availableDishes]
  )

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timerRef.current)
  }, [search])

  const filteredDishes = useMemo(() => {
    let result = filterDishesByCategory(availableDishes, activeCategory)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
    }
    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price)
    else if (sortBy === 'name-asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    return result
  }, [availableDishes, debouncedSearch, sortBy, activeCategory])

  const hasFilter = search || sortBy !== 'default' || activeCategory !== 'Tất cả'

  const clearFilter = () => {
    setSearch('')
    setDebouncedSearch('')
    setSortBy('default')
    setActiveCategory('Tất cả')
  }

  return (
    <div className='space-y-4'>
      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'>
          <Button
            variant={activeCategory === 'Tất cả' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setActiveCategory('Tất cả')}
            className='flex-shrink-0'
          >
            Tất cả
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size='sm'
              onClick={() => setActiveCategory(cat)}
              className='flex-shrink-0'
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Search & Sort */}
      <div className='flex flex-col sm:flex-row gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Tìm món ăn...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8 transition-shadow duration-200 focus:shadow-md'
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

      {/* Dish Grid */}
      {filteredDishes.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-muted-foreground mb-4'>Không tìm thấy món ăn nào phù hợp</p>
          <Button variant='outline' onClick={clearFilter}>
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          {filteredDishes.map((dish) => (
            <Link
              href={`/dishes/${generateSlugUrl({ name: dish.name, id: dish.id })}`}
              className='group flex gap-4 rounded-lg p-3 transition-all duration-300 hover:bg-accent/50 hover:shadow-md hover:scale-[1.02]'
              key={dish.id}
            >
              <div className='flex-shrink-0 relative overflow-hidden rounded-md'>
                {popularDishIds.has(dish.id) && (
                  <Badge className='absolute top-1 right-1 z-10 bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0.5 gap-0.5'>
                    <Flame className='h-2.5 w-2.5' />
                    Phổ biến
                  </Badge>
                )}
                <Image
                  src={dish.image}
                  width={150}
                  height={150}
                  quality={80}
                  loading='lazy'
                  alt={dish.name}
                  className='object-cover w-[150px] h-[150px] rounded-md transition-transform duration-300 group-hover:scale-105'
                />
              </div>
              <div className='space-y-1 min-w-0'>
                <h3 className='text-xl font-semibold truncate'>{dish.name}</h3>
                <p className='text-sm text-muted-foreground line-clamp-2'>{dish.description}</p>
                <p className='font-semibold text-primary'>{formatCurrency(dish.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


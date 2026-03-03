'use client'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDishListQuery } from '@/queries/useDish'
import { cn, formatCurrency, handleErrorApi } from '@/lib/utils'
import Quantity from '@/app/[locale]/guest/menu/quantity'
import { useMemo, useState, useEffect, useRef } from 'react'
import { GuestCreateOrdersBodyType } from '@/schemaValidations/guest.schema'
import { useGuestOrderMutation } from '@/queries/useGuest'
import { useDashboardIndicator } from '@/queries/useIndicator'
import { DishStatus } from '@/constants/type'
import { useRouter } from '@/i18n/routing'
import { Search, Flame } from 'lucide-react'
import { getDishCategories, filterDishesByCategory } from '@/lib/dish-categories'
import { DishListResType } from '@/schemaValidations/dish.schema'
import DOMPurify from 'dompurify'
import { startOfMonth, endOfDay } from 'date-fns'

type DishItem = DishListResType['data'][0]

export default function MenuOrder() {
  const { data } = useDishListQuery()
  const dishes = useMemo(() => data?.payload.data ?? [], [data])
  const [orders, setOrders] = useState<GuestCreateOrdersBodyType>([])
  const { mutateAsync } = useGuestOrderMutation()
  const router = useRouter()

  // Search & category state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả')
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null)
  const [modalQuantity, setModalQuantity] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Fetch indicator for popular badges
  const now = useMemo(() => new Date(), [])
  const { data: indicatorData } = useDashboardIndicator({
    fromDate: startOfMonth(now),
    toDate: endOfDay(now)
  })
  const popularDishIds = useMemo(
    () => new Set((indicatorData?.payload.data.dishIndicator ?? []).map((d) => d.id)),
    [indicatorData]
  )

  // Debounce search
  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timerRef.current)
  }, [search])
  // Available dishes (not hidden)
  const availableDishes = useMemo(
    () => dishes.filter((dish) => dish.status !== DishStatus.Hidden),
    [dishes]
  )

  // Categories & filtered dishes
  const categories = useMemo(() => getDishCategories(availableDishes), [availableDishes])

  const filteredDishes = useMemo(() => {
    let result = filterDishesByCategory(availableDishes, activeCategory)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
      )
    }
    return result
  }, [availableDishes, debouncedSearch, activeCategory])

  const totalPrice = useMemo(() => {
    return dishes.reduce((result, dish) => {
      const order = orders.find((order) => order.dishId === dish.id)
      if (!order) return result
      return result + order.quantity * dish.price
    }, 0)
  }, [dishes, orders])

  const handleQuantityChange = (dishId: number, quantity: number) => {
    setOrders((prevOrders) => {
      if (quantity === 0) {
        return prevOrders.filter((order) => order.dishId !== dishId)
      }
      const index = prevOrders.findIndex((order) => order.dishId === dishId)
      if (index === -1) {
        return [...prevOrders, { dishId, quantity }]
      }
      const newOrders = [...prevOrders]
      newOrders[index] = { ...newOrders[index], quantity }
      return newOrders
    })
  }

  const handleOrder = async () => {
    try {
      await mutateAsync(orders)
      router.push(`/guest/orders`)
    } catch (error) {
      handleErrorApi({
        error
      })
    }
  }

  const openDishDetail = (dish: DishItem) => {
    setSelectedDish(dish)
    setModalQuantity(orders.find((o) => o.dishId === dish.id)?.quantity ?? 0)
  }

  const confirmModalQuantity = () => {
    if (selectedDish) {
      handleQuantityChange(selectedDish.id, modalQuantity)
      setSelectedDish(null)
    }
  }
  return (
    <>
      {/* Search */}
      <div className='relative'>
        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Tìm món ăn...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-8 h-9 text-sm'
        />
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className='flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide'>
          <Button
            variant={activeCategory === 'Tất cả' ? 'default' : 'outline'}
            size='sm'
            className='flex-shrink-0 h-7 text-xs px-2.5'
            onClick={() => setActiveCategory('Tất cả')}
          >
            Tất cả
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size='sm'
              className='flex-shrink-0 h-7 text-xs px-2.5'
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Dish List */}
      {filteredDishes.length === 0 ? (
        <p className='text-center text-muted-foreground py-6 text-sm'>Không tìm thấy món ăn nào</p>
      ) : (
        filteredDishes.map((dish) => (
          <div
            key={dish.id}
            className={cn('flex gap-4 rounded-lg p-2 transition-all duration-200 hover:bg-accent/50', {
              'pointer-events-none opacity-60': dish.status === DishStatus.Unavailable
            })}
          >
            <div
              className='flex-shrink-0 relative cursor-pointer overflow-hidden rounded-md'
              onClick={() => openDishDetail(dish)}
            >
              {dish.status === DishStatus.Unavailable && (
                <span className='absolute inset-0 flex items-center justify-center text-sm bg-background/70 z-10'>
                  Hết hàng
                </span>
              )}
              {popularDishIds.has(dish.id) && (
                <Badge className='absolute top-0.5 right-0.5 z-10 bg-amber-500 hover:bg-amber-600 text-white text-[9px] px-1 py-0 gap-0.5'>
                  <Flame className='h-2 w-2' />
                  Hot
                </Badge>
              )}
              <Image
                src={dish.image}
                alt={dish.name}
                height={100}
                width={100}
                quality={100}
                className='object-cover w-[80px] h-[80px] rounded-md transition-transform duration-300 hover:scale-105'
              />
            </div>
            <div className='space-y-1 min-w-0 flex-1' onClick={() => openDishDetail(dish)}>
              <h3 className='text-sm font-medium truncate cursor-pointer'>{dish.name}</h3>
              <p className='text-xs text-muted-foreground line-clamp-2'>{dish.description}</p>
              <p className='text-xs font-semibold text-primary'>{formatCurrency(dish.price)}</p>
            </div>
            <div className='flex-shrink-0 ml-auto flex justify-center items-center'>
              <Quantity
                onChange={(value) => handleQuantityChange(dish.id, value)}
                value={orders.find((order) => order.dishId === dish.id)?.quantity ?? 0}
              />
            </div>
          </div>
        ))
      )}
      {/* Sticky Order Bar */}
      {orders.length > 0 && (
        <div className='sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-3 -mx-4 px-4 shadow-lg'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>{orders.length} món</span>
              <span className='text-xs text-muted-foreground'>
                ({orders.reduce((sum, o) => sum + o.quantity, 0)} phần)
              </span>
            </div>
            <span className='text-lg font-bold'>{formatCurrency(totalPrice)}</span>
          </div>
          <Button className='w-full' onClick={handleOrder} size='lg'>
            Đặt hàng
          </Button>
        </div>
      )}

      {/* Dish Detail Modal */}
      <Dialog open={!!selectedDish} onOpenChange={(open) => !open && setSelectedDish(null)}>
        <DialogContent className='max-w-[360px]'>
          {selectedDish && (
            <>
              <DialogHeader>
                <DialogTitle className='text-base'>{selectedDish.name}</DialogTitle>
              </DialogHeader>
              <div className='space-y-3'>
                <div className='relative overflow-hidden rounded-md'>
                  {popularDishIds.has(selectedDish.id) && (
                    <Badge className='absolute top-1 right-1 z-10 bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-1.5 py-0.5 gap-0.5'>
                      <Flame className='h-2.5 w-2.5' />
                      Phổ biến
                    </Badge>
                  )}
                  <Image
                    src={selectedDish.image}
                    alt={selectedDish.name}
                    width={360}
                    height={240}
                    quality={90}
                    className='object-cover w-full h-[200px] rounded-md'
                  />
                </div>
                <div
                  className='text-sm text-muted-foreground'
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(selectedDish.description)
                  }}
                />
                <p className='text-lg font-bold text-primary'>{formatCurrency(selectedDish.price)}</p>
                <div className='flex items-center justify-between pt-2 border-t'>
                  <span className='text-sm font-medium'>Số lượng</span>
                  <Quantity onChange={setModalQuantity} value={modalQuantity} />
                </div>
                <Button className='w-full' onClick={confirmModalQuantity}>
                  {modalQuantity > 0 ? `Thêm ${modalQuantity} phần — ${formatCurrency(selectedDish.price * modalQuantity)}` : 'Đóng'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

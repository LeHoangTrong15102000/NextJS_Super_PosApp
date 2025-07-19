import { formatCurrency } from '@/lib/utils'
import { DishResType } from '@/schemaValidations/dish.schema'
import Image from 'next/image'

export default async function DishDetail({ dish }: { dish: DishResType['data'] | undefined }) {
  if (!dish)
    return (
      <div>
        <h1 className='text-2xl lg:text-3xl font-semibold'>Món ăn không tồn tại</h1>
      </div>
    )
  return (
    <div className='space-y-4'>
      <h1 className='text-2xl lg:text-3xl font-semibold'>{dish.name}</h1>
      <div className='font-semibold'>Giá: {formatCurrency(dish.price)}</div>
      <Image
        src={dish.image}
        width={700}
        height={700}
        quality={85}
        alt={dish.name}
        className='object-cover w-full h-full max-w-[1080px] max-h-[1080px] rounded-md'
        title={dish.name}
        priority={false}
        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px'
      />
      <p>{dish.description}</p>
    </div>
  )
}

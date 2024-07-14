import dishApiRequest from '@/apiRequests/dish'
import { formatCurrency } from '@/lib/utils'
import { DishListResType } from '@/schemaValidations/dish.schema'
import Image from 'next/image'

const Home = async () => {
  //  dishListResType và lấy giá trị của data
  let dishList: DishListResType['data'] = []
  try {
    const result = await dishApiRequest.getListDish()
    const {
      payload: { data }
    } = result
    dishList = data
  } catch (error) {
    return <div>Something went wrong</div>
  }
  return (
    <div className='w-full space-y-4'>
      <section className='relative z-10 h-[300px]'>
        <span className='absolute left-0 top-0 z-10 h-full w-full bg-black opacity-50'></span>
        <Image
          src='/banner.png'
          width={400}
          height={250}
          quality={100}
          alt='Banner'
          className='absolute left-0 top-0 h-full w-full object-cover'
        />
        <div className='relative z-20 px-4 py-10 sm:px-10 md:px-20 md:py-20'>
          <h1 className='text-center text-xl font-bold sm:text-2xl md:text-4xl lg:text-5xl'>Nhà hàng Big Boy</h1>
          <p className='mt-4 text-center text-sm sm:text-base'>Vị ngon, trọn khoảnh khắc</p>
        </div>
      </section>
      <section className='space-y-10 py-16'>
        <h2 className='text-center text-2xl font-bold'>Đa dạng các món ăn</h2>
        <div className='grid grid-cols-1 gap-10 sm:grid-cols-2'>
          {dishList.map((dish, index) => (
            <div className='w flex gap-4' key={dish.id}>
              <div className='flex-shrink-0'>
                <Image
                  src={dish.image}
                  width={150}
                  height={150}
                  quality={100}
                  className='h-[150px] w-[150px] rounded-md object-cover'
                  alt={dish.name}
                />
              </div>
              <div className='space-y-1'>
                <h3 className='text-xl font-semibold'>{dish.name}</h3>
                <p className=''>{dish.description}</p>
                <p className='font-semibold'>{formatCurrency(dish.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

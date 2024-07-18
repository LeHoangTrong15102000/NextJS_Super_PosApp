import http from '@/lib/http'
import { CreateDishBodyType, DishListResType, DishResType, UpdateDishBodyType } from '@/schemaValidations/dish.schema'

const PREFIX = '/dishes'
const dishApiRequest = {
  // Nextjs 14 thì mặc định nó là `cache: 'no-store'` (static rendering)
  // Nextjs 15 thì mặc định nó sẽ là `cache: 'force-cache'` (dynamic rendering)
  getListDish: () => http.get<DishListResType>(`${PREFIX}`, { next: { tags: ['dishes-collection'] } }),
  getDishDetail: (dishId: number) => http.get<DishResType>(`${PREFIX}/${dishId}`),
  addDish: (body: CreateDishBodyType) => http.post<DishResType>(`${PREFIX}`, body),
  updateDish: (dishId: number, body: UpdateDishBodyType) => http.put<DishResType>(`${PREFIX}/${dishId}`, body),
  deleteDish: (dishId: number) => http.delete<DishResType>(`${PREFIX}/${dishId}`)
}

export default dishApiRequest

import http from '@/lib/http'
import { CreateDishBodyType, DishListResType, DishResType, UpdateDishBodyType } from '@/schemaValidations/dish.schema'

const PREFIX = '/dishes'
const dishApiRequest = {
  getListDish: () => http.get<DishListResType>(`${PREFIX}`),
  getDishDetail: (dishId: number) => http.get<DishResType>(`${PREFIX}/${dishId}`),
  addDish: (body: CreateDishBodyType) => http.post<DishResType>(`${PREFIX}`, body),
  updateDish: (dishId: number, body: UpdateDishBodyType) => http.post<DishResType>(`${PREFIX}/${dishId}`, body),
  deleteDish: (dishId: number) => http.delete<DishResType>(`${PREFIX}/${dishId}`)
}

export default dishApiRequest

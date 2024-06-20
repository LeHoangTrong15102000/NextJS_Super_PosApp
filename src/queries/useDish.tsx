// Tạo query cho Dishes

import dishApiRequest from '@/apiRequests/dish'
import { CreateDishBodyType, UpdateDishBodyType } from '@/schemaValidations/dish.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useDishListQuery = () => {
  return useQuery({
    queryKey: ['dishes-list'],
    queryFn: () => dishApiRequest.getListDish()
  })
}

export const useGetDishQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryKey: ['dishes-detail', id],
    queryFn: () => dishApiRequest.getDishDetail(id),
    enabled
  })
}

export const useAddDishMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDishBodyType) => dishApiRequest.addDish(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dishes-list']
      })
    }
  })
}

export const useUpdateDishMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateDishBodyType & { id: number }) => dishApiRequest.updateDish(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dishes-list'],
        exact: true
      })
    }
  })
}

export const useDeleteDishMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dishId: number) => dishApiRequest.deleteDish(dishId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dishes-list']
      })
    }
  })
}

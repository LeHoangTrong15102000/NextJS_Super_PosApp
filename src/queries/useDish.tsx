import dishApiRequest from '@/apiRequests/dish'
import { UpdateDishBodyType } from '@/schemaValidations/dish.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useDishListQuery = () => {
  return useQuery({
    queryKey: ['dishes'],
    queryFn: dishApiRequest.list
  })
}

export const useGetDishQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryKey: ['dishes', id],
    queryFn: () => dishApiRequest.getDish(id),
    enabled
  })
}

export const useAddDishMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dishApiRequest.add,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dishes']
      })
    }
  })
}

export const useUpdateDishMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateDishBodyType & { id: number }) => dishApiRequest.updateDish(id, body),
    onSuccess: (data, variables) => {
      // Update specific dish in cache
      queryClient.setQueryData(['dishes', variables.id], data)

      // Invalidate list only
      queryClient.invalidateQueries({
        queryKey: ['dishes'],
        predicate: (query) => query.queryKey.length === 1
      })
    }
  })
}

export const useDeleteDishMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: dishApiRequest.deleteDish,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['dishes']
      })
    }
  })
}

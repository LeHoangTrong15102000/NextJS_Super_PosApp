import accountApiRequest from '@/apiRequests/account'
import { AccountResType, ChangePasswordBodyType, UpdateMeBodyType } from '@/schemaValidations/account.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useAccountMe = () => {
  return useQuery({
    queryKey: ['account-me'],
    queryFn: () => accountApiRequest.getMeProfile()
  })
}

export const useUpdateMeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMeBodyType) => accountApiRequest.updateMeProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-me'] })
    }
  })
}

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: (body: ChangePasswordBodyType) => accountApiRequest.changePassword(body)
  })
}

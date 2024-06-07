import accountApiRequest from '@/apiRequests/account'
import { AccountResType } from '@/schemaValidations/account.schema'
import { useQuery } from '@tanstack/react-query'

export const useAccountProfile = () => {
  return useQuery({
    queryKey: ['account-profile'],
    queryFn: () => accountApiRequest.getMeProfile()
  })
}

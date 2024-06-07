import authApiRequest from '@/apiRequests/auth'
import { LoginBodyType } from '@/schemaValidations/auth.schema'
import { useMutation } from '@tanstack/react-query'

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (body: LoginBodyType) => authApiRequest.login(body)
  })
}

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: () => authApiRequest.logout()
  })
}

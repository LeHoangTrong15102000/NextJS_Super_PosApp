// Query guest
import guestApiRequest from '@/apiRequests/guest'
import { GuestCreateOrdersBodyType } from '@/schemaValidations/guest.schema'
import { useMutation, useQuery } from '@tanstack/react-query'

export const useGuestLoginMutation = () => {
  return useMutation({
    mutationFn: guestApiRequest.login
  })
}

export const useGuestLogoutMutation = () => {
  return useMutation({
    mutationFn: guestApiRequest.logout
  })
}

export const useGuestGetOrderListQuery = () => {
  return useQuery({
    queryKey: ['guest-orders-list'],
    queryFn: () => guestApiRequest.getOrderList()
  })
}

export const useGuestOrderMutation = () => {
  return useMutation({
    mutationFn: (body: GuestCreateOrdersBodyType) => guestApiRequest.createOrder(body)
  })
}

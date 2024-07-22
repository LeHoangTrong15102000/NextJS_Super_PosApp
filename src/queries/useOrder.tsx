import orderApiRequest from '@/apiRequests/order'
import {
  CreateOrdersBodyType,
  GetOrdersQueryParamsType,
  PayGuestOrdersBodyType,
  UpdateOrderBodyType
} from '@/schemaValidations/order.schema'
import { useMutation, useQuery } from '@tanstack/react-query'

export const useUpdateOrderMutation = () => {
  return useMutation({
    mutationFn: ({
      orderId,
      ...body
    }: UpdateOrderBodyType & {
      orderId: number
    }) => orderApiRequest.updateOrder(orderId, body)
  })
}

// lấy ra danh sách order ở trên hệ thống
export const useGetOrderListQuery = (queryParams: GetOrdersQueryParamsType) => {
  return useQuery({
    queryKey: ['orders-list', queryParams],
    queryFn: () => orderApiRequest.getOrderList(queryParams)
  })
}

export const useGetOrderDetailQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryFn: () => orderApiRequest.getOrderDetail(id),
    queryKey: ['orders', id],
    enabled
  })
}

export const usePayForGuestMutation = () => {
  return useMutation({
    mutationFn: (body: PayGuestOrdersBodyType) => orderApiRequest.pay(body)
  })
}

export const useCreateOrderMutation = () => {
  return useMutation({
    mutationFn: (body: CreateOrdersBodyType) => orderApiRequest.createOrders(body)
  })
}

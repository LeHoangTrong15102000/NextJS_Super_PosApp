import orderApiRequest from '@/apiRequests/order'
import { GetOrdersQueryParamsType, UpdateOrderBodyType } from '@/schemaValidations/order.schema'
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

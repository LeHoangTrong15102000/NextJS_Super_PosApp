import orderApiRequest from '@/apiRequests/order'
import { UpdateOrderBodyType } from '@/schemaValidations/order.schema'
import { useMutation, useQuery } from '@tanstack/react-query'

export const useUpdateOrderMutation = () => {
  return useMutation({
    mutationFn: ({
      orderId,
      ...body
    }: UpdateOrderBodyType & {
      orderId: string
    }) => orderApiRequest.updateOrder(orderId, body)
  })
}

// lấy ra danh sách order ở trên hệ thống
export const useGetOrderListQuery = () => {
  return useQuery({
    queryKey: ['orders-list'],
    queryFn: () => orderApiRequest.getOrderList()
  })
}

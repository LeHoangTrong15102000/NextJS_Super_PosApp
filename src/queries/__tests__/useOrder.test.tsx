import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useUpdateOrderMutation,
  useGetOrderListQuery,
  useGetOrderDetailQuery,
  usePayForGuestMutation,
  useCreateOrderMutation
} from '../useOrder'
import orderApiRequest from '@/apiRequests/order'
import { OrderStatus } from '@/constants/type'

// Mock the API request module
jest.mock('@/apiRequests/order')
const mockOrderApiRequest = orderApiRequest as jest.Mocked<typeof orderApiRequest>

// Mock data
const mockGuest = {
  id: 1,
  name: 'Nguyen Van A',
  tableNumber: 5,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z')
}

const mockDishSnapshot = {
  id: 1,
  name: 'Phở Bò',
  price: 85000,
  image: 'https://example.com/pho-bo.jpg',
  description: 'Phở bò truyền thống',
  status: 'Available' as any,
  dishId: 1,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z')
}

const mockOrderHandler = {
  id: 1,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'Owner' as any,
  avatar: null,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z')
}

const mockOrder = {
  id: 1,
  guestId: 1,
  guest: mockGuest,
  tableNumber: 5,
  dishSnapshotId: 1,
  dishSnapshot: mockDishSnapshot,
  quantity: 2,
  orderHandlerId: 1,
  orderHandler: mockOrderHandler,
  status: OrderStatus.Pending,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z')
}

const mockOrderList = [
  mockOrder,
  {
    ...mockOrder,
    id: 2,
    quantity: 1,
    status: OrderStatus.Processing
  }
]

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {} // Silence error logs in tests
    }
  })

const createWrapper = () => {
  const queryClient = createTestQueryClient()
  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  TestWrapper.displayName = 'TestWrapper'
  return TestWrapper
}

describe('useOrder Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useGetOrderListQuery', () => {
    const queryParams = {
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-01-31')
    }

    it('should fetch order list successfully', async () => {
      const mockResponse = {
        status: 200,
        payload: {
          data: mockOrderList,
          message: 'Orders retrieved successfully'
        }
      }

      mockOrderApiRequest.getOrderList.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useGetOrderListQuery(queryParams), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.data?.payload.data).toHaveLength(2)
      expect(result.current.data?.payload.data[0].status).toBe(OrderStatus.Pending)
      expect(mockOrderApiRequest.getOrderList).toHaveBeenCalledWith(queryParams)
      expect(mockOrderApiRequest.getOrderList).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state', () => {
      const mockResponse = {
        status: 200,
        payload: {
          data: mockOrderList,
          message: 'Orders retrieved successfully'
        }
      }

      mockOrderApiRequest.getOrderList.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
      )

      const { result } = renderHook(() => useGetOrderListQuery(queryParams), { wrapper: createWrapper() })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch orders')
      mockOrderApiRequest.getOrderList.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useGetOrderListQuery(queryParams), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
      expect(result.current.data).toBeUndefined()
    })

    it('should use correct query key with parameters', async () => {
      const mockResponse = {
        status: 200,
        payload: {
          data: mockOrderList,
          message: 'Orders retrieved successfully'
        }
      }

      mockOrderApiRequest.getOrderList.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useGetOrderListQuery(queryParams), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockOrderApiRequest.getOrderList).toHaveBeenCalledWith(queryParams)
    })

    it('should refetch when query parameters change', async () => {
      const mockResponse = {
        status: 200,
        payload: {
          data: mockOrderList,
          message: 'Orders retrieved successfully'
        }
      }

      mockOrderApiRequest.getOrderList.mockResolvedValue(mockResponse)

      const { result, rerender } = renderHook(({ params }) => useGetOrderListQuery(params), {
        wrapper: createWrapper(),
        initialProps: { params: queryParams }
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Change query parameters
      const newParams = {
        fromDate: new Date('2024-02-01'),
        toDate: new Date('2024-02-28')
      }

      rerender({ params: newParams })

      await waitFor(() => {
        expect(mockOrderApiRequest.getOrderList).toHaveBeenCalledTimes(2)
      })

      expect(mockOrderApiRequest.getOrderList).toHaveBeenNthCalledWith(1, queryParams)
      expect(mockOrderApiRequest.getOrderList).toHaveBeenNthCalledWith(2, newParams)
    })
  })

  describe('useGetOrderDetailQuery', () => {
    it('should fetch order detail when enabled', async () => {
      const mockResponse = {
        status: 200,
        payload: {
          data: mockOrder,
          message: 'Order retrieved successfully'
        }
      }

      mockOrderApiRequest.getOrderDetail.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useGetOrderDetailQuery({ id: 1, enabled: true }), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(result.current.data?.payload.data.id).toBe(1)
      expect(mockOrderApiRequest.getOrderDetail).toHaveBeenCalledWith(1)
      expect(mockOrderApiRequest.getOrderDetail).toHaveBeenCalledTimes(1)
    })

    it('should not fetch when disabled', () => {
      const { result } = renderHook(() => useGetOrderDetailQuery({ id: 1, enabled: false }), {
        wrapper: createWrapper()
      })

      expect(result.current.fetchStatus).toBe('idle')
      expect(result.current.data).toBeUndefined()
      expect(mockOrderApiRequest.getOrderDetail).not.toHaveBeenCalled()
    })

    it('should handle error when fetching order detail', async () => {
      const mockError = new Error('Order not found')
      mockOrderApiRequest.getOrderDetail.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useGetOrderDetailQuery({ id: 999, enabled: true }), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
      expect(mockOrderApiRequest.getOrderDetail).toHaveBeenCalledWith(999)
    })
  })

  describe('useCreateOrderMutation', () => {
    it('should create order successfully', async () => {
      const orderData = {
        guestId: 1,
        orders: [
          { dishId: 1, quantity: 2 },
          { dishId: 2, quantity: 1 }
        ]
      }

      const mockResponse = {
        status: 201,
        payload: {
          data: mockOrderList,
          message: 'Orders created successfully'
        }
      }

      mockOrderApiRequest.createOrders.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCreateOrderMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(orderData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(mockOrderApiRequest.createOrders).toHaveBeenCalledWith(orderData, expect.anything())
      expect(mockOrderApiRequest.createOrders).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state during order creation', async () => {
      mockOrderApiRequest.createOrders.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      const { result } = renderHook(() => useCreateOrderMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        guestId: 1,
        orders: [{ dishId: 1, quantity: 1 }]
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(true)
      })
    })

    it('should handle error during order creation', async () => {
      const mockError = new Error('Failed to create orders')
      mockOrderApiRequest.createOrders.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useCreateOrderMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        guestId: 1,
        orders: [{ dishId: 1, quantity: 1 }]
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should validate order data structure', async () => {
      const validOrderData = {
        guestId: 1,
        orders: [
          { dishId: 1, quantity: 2 },
          { dishId: 3, quantity: 1 }
        ]
      }

      const mockResponse = {
        status: 201,
        payload: {
          data: mockOrderList,
          message: 'Orders created successfully'
        }
      }

      mockOrderApiRequest.createOrders.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useCreateOrderMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(validOrderData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockOrderApiRequest.createOrders).toHaveBeenCalledWith(validOrderData, expect.anything())
    })
  })

  describe('useUpdateOrderMutation', () => {
    it('should update order status successfully', async () => {
      const updateData = {
        orderId: 1,
        status: OrderStatus.Processing
      }

      const mockResponse = {
        status: 200,
        payload: {
          data: { ...mockOrder, status: OrderStatus.Processing },
          message: 'Order updated successfully'
        }
      }

      mockOrderApiRequest.updateOrder.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useUpdateOrderMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(updateData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(mockOrderApiRequest.updateOrder).toHaveBeenCalledWith(1, {
        status: OrderStatus.Processing
      })
    })

    it('should handle all order status transitions', async () => {
      const statuses = [
        OrderStatus.Pending,
        OrderStatus.Processing,
        OrderStatus.Delivered,
        OrderStatus.Paid,
        OrderStatus.Rejected
      ]

      for (const status of statuses) {
        const mockResponse = {
          status: 200,
          payload: {
            data: { ...mockOrder, status },
            message: 'Order updated successfully'
          }
        }

        mockOrderApiRequest.updateOrder.mockResolvedValueOnce(mockResponse)

        const { result } = renderHook(() => useUpdateOrderMutation(), {
          wrapper: createWrapper()
        })

        result.current.mutate({ orderId: 1, status })

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data?.payload.data.status).toBe(status)
        result.current.reset()
      }

      expect(mockOrderApiRequest.updateOrder).toHaveBeenCalledTimes(statuses.length)
    })

    it('should handle error during order update', async () => {
      const mockError = new Error('Failed to update order')
      mockOrderApiRequest.updateOrder.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useUpdateOrderMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        orderId: 1,
        status: OrderStatus.Processing
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should handle concurrent order updates', async () => {
      const mockResponse1 = {
        status: 200,
        payload: {
          data: { ...mockOrder, id: 1, status: OrderStatus.Processing },
          message: 'Order 1 updated successfully'
        }
      }

      const mockResponse2 = {
        status: 200,
        payload: {
          data: { ...mockOrder, id: 2, status: OrderStatus.Delivered },
          message: 'Order 2 updated successfully'
        }
      }

      mockOrderApiRequest.updateOrder.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2)

      const { result: result1 } = renderHook(() => useUpdateOrderMutation(), {
        wrapper: createWrapper()
      })

      const { result: result2 } = renderHook(() => useUpdateOrderMutation(), {
        wrapper: createWrapper()
      })

      // Update two different orders simultaneously
      result1.current.mutate({ orderId: 1, status: OrderStatus.Processing })
      result2.current.mutate({ orderId: 2, status: OrderStatus.Delivered })

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
        expect(result2.current.isSuccess).toBe(true)
      })

      expect(mockOrderApiRequest.updateOrder).toHaveBeenCalledTimes(2)
      expect(mockOrderApiRequest.updateOrder).toHaveBeenNthCalledWith(1, 1, {
        status: OrderStatus.Processing
      })
      expect(mockOrderApiRequest.updateOrder).toHaveBeenNthCalledWith(2, 2, {
        status: OrderStatus.Delivered
      })
    })
  })

  describe('usePayForGuestMutation', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        guestId: 1
      }

      const mockResponse = {
        status: 200,
        payload: {
          data: mockOrderList.map((order) => ({ ...order, status: OrderStatus.Paid })),
          message: 'Payment processed successfully'
        }
      }

      mockOrderApiRequest.pay.mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => usePayForGuestMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(paymentData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(mockOrderApiRequest.pay).toHaveBeenCalledWith(paymentData)
      expect(mockOrderApiRequest.pay).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state during payment', async () => {
      mockOrderApiRequest.pay.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      const { result } = renderHook(() => usePayForGuestMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({ guestId: 1 })

      await waitFor(() => {
        expect(result.current.isPending).toBe(true)
      })
    })

    it('should handle payment error', async () => {
      const mockError = new Error('Payment failed')
      mockOrderApiRequest.pay.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => usePayForGuestMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({ guestId: 1 })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should handle payment for different guests', async () => {
      const mockResponse = {
        status: 200,
        payload: {
          data: [],
          message: 'Payment processed successfully'
        }
      }

      mockOrderApiRequest.pay.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => usePayForGuestMutation(), {
        wrapper: createWrapper()
      })

      // Pay for guest 1
      result.current.mutate({ guestId: 1 })
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Reset and pay for guest 2
      result.current.reset()
      result.current.mutate({ guestId: 2 })
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockOrderApiRequest.pay).toHaveBeenCalledTimes(2)
      expect(mockOrderApiRequest.pay).toHaveBeenNthCalledWith(1, { guestId: 1 })
      expect(mockOrderApiRequest.pay).toHaveBeenNthCalledWith(2, { guestId: 2 })
    })
  })

  describe('Integration Tests', () => {
    it('should handle order lifecycle from creation to payment', async () => {
      const queryClient = createTestQueryClient()

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      // Setup hooks
      const { result: createResult } = renderHook(() => useCreateOrderMutation(), { wrapper })
      const { result: updateResult } = renderHook(() => useUpdateOrderMutation(), { wrapper })
      const { result: payResult } = renderHook(() => usePayForGuestMutation(), { wrapper })

      // 1. Create order
      const orderData = {
        guestId: 1,
        orders: [{ dishId: 1, quantity: 2 }]
      }

      const createResponse = {
        status: 201,
        payload: {
          data: [mockOrder],
          message: 'Orders created successfully'
        }
      }

      mockOrderApiRequest.createOrders.mockResolvedValueOnce(createResponse)
      createResult.current.mutate(orderData)

      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true)
      })

      // 2. Update order status
      const updateResponse = {
        status: 200,
        payload: {
          data: { ...mockOrder, status: OrderStatus.Delivered },
          message: 'Order updated successfully'
        }
      }

      mockOrderApiRequest.updateOrder.mockResolvedValueOnce(updateResponse)
      updateResult.current.mutate({ orderId: 1, status: OrderStatus.Delivered })

      await waitFor(() => {
        expect(updateResult.current.isSuccess).toBe(true)
      })

      // 3. Process payment
      const payResponse = {
        status: 200,
        payload: {
          data: [{ ...mockOrder, status: OrderStatus.Paid }],
          message: 'Payment processed successfully'
        }
      }

      mockOrderApiRequest.pay.mockResolvedValueOnce(payResponse)
      payResult.current.mutate({ guestId: 1 })

      await waitFor(() => {
        expect(payResult.current.isSuccess).toBe(true)
      })

      // Verify all operations completed successfully
      expect(createResult.current.isSuccess).toBe(true)
      expect(updateResult.current.isSuccess).toBe(true)
      expect(payResult.current.isSuccess).toBe(true)
    })
  })
})

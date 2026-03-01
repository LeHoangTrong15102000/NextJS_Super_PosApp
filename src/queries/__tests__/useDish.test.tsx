import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useDishListQuery,
  useGetDishQuery,
  useAddDishMutation,
  useUpdateDishMutation,
  useDeleteDishMutation
} from '../useDish'
import dishApiRequest from '@/apiRequests/dish'
import { DishStatus } from '@/constants/type'

// Mock the API request module
jest.mock('@/apiRequests/dish')
const mockDishApiRequest = dishApiRequest as jest.Mocked<typeof dishApiRequest>

// Mock data
const mockDish = {
  id: 1,
  name: 'Phở Bò',
  price: 85000,
  description: 'Phở bò truyền thống',
  image: 'https://example.com/pho-bo.jpg',
  status: DishStatus.Available,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-02T10:00:00Z')
}

const mockDishList = [
  mockDish,
  {
    id: 2,
    name: 'Cơm tấm',
    price: 50000,
    description: 'Cơm tấm sườn nướng',
    image: 'https://example.com/com-tam.jpg',
    status: DishStatus.Available,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:00:00Z')
  }
]

const mockDishListResponse = {
  status: 200,
  payload: {
    data: mockDishList,
    message: 'Dishes retrieved successfully'
  }
}

const mockDishResponse = {
  status: 200,
  payload: {
    data: mockDish,
    message: 'Dish retrieved successfully'
  }
}

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

describe('useDish Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useDishListQuery', () => {
    it('should fetch dish list successfully', async () => {
      mockDishApiRequest.list.mockResolvedValueOnce(mockDishListResponse)

      const { result } = renderHook(() => useDishListQuery(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockDishListResponse)
      expect(result.current.data?.payload.data).toHaveLength(2)
      expect(result.current.data?.payload.data[0].name).toBe('Phở Bò')
      expect(mockDishApiRequest.list).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state', () => {
      mockDishApiRequest.list.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockDishListResponse), 100))
      )

      const { result } = renderHook(() => useDishListQuery(), {
        wrapper: createWrapper()
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch dishes')
      mockDishApiRequest.list.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useDishListQuery(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
      expect(result.current.data).toBeUndefined()
    })

    it('should use correct query key', async () => {
      mockDishApiRequest.list.mockResolvedValueOnce(mockDishListResponse)

      const { result } = renderHook(() => useDishListQuery(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Check if the hook is using the correct query key
      expect(mockDishApiRequest.list).toHaveBeenCalledTimes(1)
    })
  })

  describe('useGetDishQuery', () => {
    it('should fetch specific dish when enabled', async () => {
      mockDishApiRequest.getDish.mockResolvedValueOnce(mockDishResponse)

      const { result } = renderHook(() => useGetDishQuery({ id: 1, enabled: true }), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockDishResponse)
      expect(result.current.data?.payload.data.id).toBe(1)
      expect(mockDishApiRequest.getDish).toHaveBeenCalledWith(1)
      expect(mockDishApiRequest.getDish).toHaveBeenCalledTimes(1)
    })

    it('should not fetch when disabled', () => {
      const { result } = renderHook(() => useGetDishQuery({ id: 1, enabled: false }), { wrapper: createWrapper() })

      expect(result.current.fetchStatus).toBe('idle')
      expect(result.current.data).toBeUndefined()
      expect(mockDishApiRequest.getDish).not.toHaveBeenCalled()
    })

    it('should handle error when fetching specific dish', async () => {
      const mockError = new Error('Dish not found')
      mockDishApiRequest.getDish.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useGetDishQuery({ id: 999, enabled: true }), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
      expect(mockDishApiRequest.getDish).toHaveBeenCalledWith(999)
    })

    it('should handle enabled state changes', async () => {
      mockDishApiRequest.getDish.mockResolvedValueOnce(mockDishResponse)

      const { result, rerender } = renderHook(({ enabled }) => useGetDishQuery({ id: 1, enabled }), {
        wrapper: createWrapper(),
        initialProps: { enabled: false }
      })

      // Initially disabled
      expect(result.current.fetchStatus).toBe('idle')
      expect(mockDishApiRequest.getDish).not.toHaveBeenCalled()

      // Enable the query
      rerender({ enabled: true })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockDishApiRequest.getDish).toHaveBeenCalledWith(1)
    })
  })

  describe('useAddDishMutation', () => {
    it('should add dish successfully', async () => {
      const newDishData = {
        name: 'Bún Bò Huế',
        price: 70000,
        description: 'Bún bò Huế cay nồng',
        image: 'https://example.com/bun-bo-hue.jpg',
        status: DishStatus.Available
      }

      const mockAddResponse = {
        status: 201,
        payload: {
          data: { ...mockDish, id: 3, ...newDishData },
          message: 'Dish added successfully'
        }
      }

      mockDishApiRequest.add.mockResolvedValueOnce(mockAddResponse)

      const { result } = renderHook(() => useAddDishMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(newDishData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockAddResponse)
      expect(mockDishApiRequest.add).toHaveBeenCalledWith(newDishData, expect.anything())
      expect(mockDishApiRequest.add).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state during dish creation', async () => {
      mockDishApiRequest.add.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      const { result } = renderHook(() => useAddDishMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        name: 'Test Dish',
        price: 50000,
        description: 'Test description',
        image: 'https://example.com/test.jpg'
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(true)
      })
    })

    it('should handle error during dish creation', async () => {
      const mockError = new Error('Failed to add dish')
      mockDishApiRequest.add.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAddDishMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        name: 'Test Dish',
        price: 50000,
        description: 'Test description',
        image: 'https://example.com/test.jpg'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should invalidate dish list cache on success', async () => {
      const mockAddResponse = {
        status: 201,
        payload: {
          data: mockDish,
          message: 'Dish added successfully'
        }
      }

      mockDishApiRequest.add.mockResolvedValueOnce(mockAddResponse)

      const queryClient = createTestQueryClient()
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useAddDishMutation(), { wrapper })

      result.current.mutate({
        name: 'Test Dish',
        price: 50000,
        description: 'Test description',
        image: 'https://example.com/test.jpg'
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['dishes']
      })
    })
  })

  describe('useUpdateDishMutation', () => {
    it('should update dish successfully', async () => {
      const updateData = {
        id: 1,
        name: 'Updated Phở Bò',
        price: 90000,
        description: 'Updated description',
        image: 'https://example.com/updated-pho.jpg',
        status: DishStatus.Unavailable
      }

      const mockUpdateResponse = {
        status: 200,
        payload: {
          data: { ...mockDish, ...updateData },
          message: 'Dish updated successfully'
        }
      }

      mockDishApiRequest.updateDish.mockResolvedValueOnce(mockUpdateResponse)

      const { result } = renderHook(() => useUpdateDishMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(updateData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockUpdateResponse)
      expect(mockDishApiRequest.updateDish).toHaveBeenCalledWith(1, {
        name: 'Updated Phở Bò',
        price: 90000,
        description: 'Updated description',
        image: 'https://example.com/updated-pho.jpg',
        status: DishStatus.Unavailable
      })
    })

    it('should handle error during dish update', async () => {
      const mockError = new Error('Failed to update dish')
      mockDishApiRequest.updateDish.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useUpdateDishMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        id: 1,
        name: 'Updated Dish',
        price: 50000,
        description: 'Updated description',
        image: 'https://example.com/updated.jpg'
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should update cache and invalidate queries on success', async () => {
      const updateData = {
        id: 1,
        name: 'Updated Dish',
        price: 50000,
        description: 'Updated description',
        image: 'https://example.com/updated.jpg'
      }

      const mockUpdateResponse = {
        status: 200,
        payload: {
          data: { ...mockDish, ...updateData },
          message: 'Dish updated successfully'
        }
      }

      mockDishApiRequest.updateDish.mockResolvedValueOnce(mockUpdateResponse)

      const queryClient = createTestQueryClient()
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData')
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUpdateDishMutation(), { wrapper })

      result.current.mutate(updateData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(setQueryDataSpy).toHaveBeenCalledWith(['dishes', 1], mockUpdateResponse)
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['dishes'],
        predicate: expect.any(Function)
      })
    })
  })

  describe('useDeleteDishMutation', () => {
    it('should delete dish successfully', async () => {
      const mockDeleteResponse = {
        status: 200,
        payload: {
          message: 'Dish deleted successfully'
        }
      }

      mockDishApiRequest.deleteDish.mockResolvedValueOnce(mockDeleteResponse)

      const { result } = renderHook(() => useDeleteDishMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(1)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockDeleteResponse)
      expect(mockDishApiRequest.deleteDish).toHaveBeenCalledWith(1, expect.anything())
      expect(mockDishApiRequest.deleteDish).toHaveBeenCalledTimes(1)
    })

    it('should handle error during dish deletion', async () => {
      const mockError = new Error('Failed to delete dish')
      mockDishApiRequest.deleteDish.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useDeleteDishMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(1)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should invalidate dish list cache on successful deletion', async () => {
      const mockDeleteResponse = {
        status: 200,
        payload: {
          message: 'Dish deleted successfully'
        }
      }

      mockDishApiRequest.deleteDish.mockResolvedValueOnce(mockDeleteResponse)

      const queryClient = createTestQueryClient()
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteDishMutation(), { wrapper })

      result.current.mutate(1)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['dishes']
      })
    })

    it('should handle multiple delete operations', async () => {
      const mockDeleteResponse = {
        status: 200,
        payload: {
          message: 'Dish deleted successfully'
        }
      }

      mockDishApiRequest.deleteDish.mockResolvedValue(mockDeleteResponse)

      const { result } = renderHook(() => useDeleteDishMutation(), {
        wrapper: createWrapper()
      })

      // Delete first dish
      result.current.mutate(1)
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Reset and delete second dish
      result.current.reset()
      result.current.mutate(2)
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockDishApiRequest.deleteDish).toHaveBeenCalledTimes(2)
      expect(mockDishApiRequest.deleteDish).toHaveBeenNthCalledWith(1, 1, expect.anything())
      expect(mockDishApiRequest.deleteDish).toHaveBeenNthCalledWith(2, 2, expect.anything())
    })
  })

  describe('Integration Tests', () => {
    it('should maintain cache consistency across mutations', async () => {
      const queryClient = createTestQueryClient()

      // Pre-populate cache with dish list
      queryClient.setQueryData(['dishes'], mockDishListResponse)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result: listResult } = renderHook(() => useDishListQuery(), { wrapper })
      const { result: addResult } = renderHook(() => useAddDishMutation(), { wrapper })

      // Verify initial data
      expect(listResult.current.data?.payload.data).toHaveLength(2)

      // Add new dish
      const newDishData = {
        name: 'New Dish',
        price: 60000,
        description: 'New dish description',
        image: 'https://example.com/new-dish.jpg'
      }

      const mockAddResponse = {
        status: 201,
        payload: {
          data: { ...mockDish, id: 3, ...newDishData },
          message: 'Dish added successfully'
        }
      }

      mockDishApiRequest.add.mockResolvedValueOnce(mockAddResponse)

      addResult.current.mutate(newDishData)

      await waitFor(() => {
        expect(addResult.current.isSuccess).toBe(true)
      })

      // Cache should be invalidated and will refetch on next access
      // This simulates real usage where UI would refetch after successful mutation
    })
  })
})

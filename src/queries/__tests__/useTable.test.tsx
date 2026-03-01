import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useTableListQuery,
  useGetTableQuery,
  useAddTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation
} from '../useTable'
import tableApiRequest from '@/apiRequests/table'
import { TableStatus } from '@/constants/type'

// Mock the API request module
jest.mock('@/apiRequests/table')
const mockTableApiRequest = tableApiRequest as jest.Mocked<typeof tableApiRequest>

// Mock data
const mockTable = {
  number: 5,
  capacity: 4,
  status: TableStatus.Available,
  token: 'abc123def456',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-02T10:00:00Z')
}

const mockTableList = [
  mockTable,
  {
    number: 1,
    capacity: 2,
    status: TableStatus.Reserved,
    token: 'token1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:00:00Z')
  },
  {
    number: 10,
    capacity: 8,
    status: TableStatus.Hidden,
    token: 'token10',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:00:00Z')
  }
]

const mockTableListResponse = {
  status: 200,
  payload: {
    data: mockTableList,
    message: 'Tables retrieved successfully'
  }
}

const mockTableResponse = {
  status: 200,
  payload: {
    data: mockTable,
    message: 'Table retrieved successfully'
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

describe('useTable Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useTableListQuery', () => {
    it('should fetch table list successfully', async () => {
      mockTableApiRequest.list.mockResolvedValueOnce(mockTableListResponse)

      const { result } = renderHook(() => useTableListQuery(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockTableListResponse)
      expect(result.current.data?.payload.data).toHaveLength(3)
      expect(result.current.data?.payload.data[0].number).toBe(5)
      expect(result.current.data?.payload.data[0].status).toBe(TableStatus.Available)
      expect(mockTableApiRequest.list).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state', () => {
      mockTableApiRequest.list.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTableListResponse), 100))
      )

      const { result } = renderHook(() => useTableListQuery(), {
        wrapper: createWrapper()
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle error state', async () => {
      const mockError = new Error('Failed to fetch tables')
      mockTableApiRequest.list.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useTableListQuery(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
      expect(result.current.data).toBeUndefined()
    })

    it('should use correct query key', async () => {
      mockTableApiRequest.list.mockResolvedValueOnce(mockTableListResponse)

      const { result } = renderHook(() => useTableListQuery(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockTableApiRequest.list).toHaveBeenCalledTimes(1)
    })

    it('should handle empty table list', async () => {
      const emptyResponse = {
        status: 200,
        payload: {
          data: [],
          message: 'No tables found'
        }
      }

      mockTableApiRequest.list.mockResolvedValueOnce(emptyResponse)

      const { result } = renderHook(() => useTableListQuery(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.payload.data).toHaveLength(0)
    })
  })

  describe('useGetTableQuery', () => {
    it('should fetch specific table when enabled', async () => {
      mockTableApiRequest.getTable.mockResolvedValueOnce(mockTableResponse)

      const { result } = renderHook(() => useGetTableQuery({ id: 5, enabled: true }), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockTableResponse)
      expect(result.current.data?.payload.data.number).toBe(5)
      expect(mockTableApiRequest.getTable).toHaveBeenCalledWith(5)
      expect(mockTableApiRequest.getTable).toHaveBeenCalledTimes(1)
    })

    it('should not fetch when disabled', () => {
      const { result } = renderHook(() => useGetTableQuery({ id: 5, enabled: false }), { wrapper: createWrapper() })

      expect(result.current.fetchStatus).toBe('idle')
      expect(result.current.data).toBeUndefined()
      expect(mockTableApiRequest.getTable).not.toHaveBeenCalled()
    })

    it('should handle error when fetching specific table', async () => {
      const mockError = new Error('Table not found')
      mockTableApiRequest.getTable.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useGetTableQuery({ id: 999, enabled: true }), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
      expect(mockTableApiRequest.getTable).toHaveBeenCalledWith(999)
    })

    it('should handle enabled state changes', async () => {
      mockTableApiRequest.getTable.mockResolvedValueOnce(mockTableResponse)

      const { result, rerender } = renderHook(({ enabled }) => useGetTableQuery({ id: 5, enabled }), {
        wrapper: createWrapper(),
        initialProps: { enabled: false }
      })

      // Initially disabled
      expect(result.current.fetchStatus).toBe('idle')
      expect(mockTableApiRequest.getTable).not.toHaveBeenCalled()

      // Enable the query
      rerender({ enabled: true })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockTableApiRequest.getTable).toHaveBeenCalledWith(5)
    })
  })

  describe('useAddTableMutation', () => {
    it('should add table successfully', async () => {
      const newTableData = {
        number: 15,
        capacity: 6,
        status: TableStatus.Available
      }

      const mockAddResponse = {
        status: 201,
        payload: {
          data: {
            ...newTableData,
            token: 'newtoken123',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          message: 'Table added successfully'
        }
      }

      mockTableApiRequest.add.mockResolvedValueOnce(mockAddResponse)

      const { result } = renderHook(() => useAddTableMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(newTableData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockAddResponse)
      expect(mockTableApiRequest.add).toHaveBeenCalledWith(newTableData, expect.anything())
      expect(mockTableApiRequest.add).toHaveBeenCalledTimes(1)
    })

    it('should handle loading state during table creation', async () => {
      mockTableApiRequest.add.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      const { result } = renderHook(() => useAddTableMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        number: 20,
        capacity: 4,
        status: TableStatus.Available
      })

      await waitFor(() => {
        expect(result.current.isPending).toBe(true)
      })
    })

    it('should handle error during table creation', async () => {
      const mockError = new Error('Failed to add table')
      mockTableApiRequest.add.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useAddTableMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        number: 25,
        capacity: 4,
        status: TableStatus.Available
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should invalidate table list cache on success', async () => {
      const mockAddResponse = {
        status: 201,
        payload: {
          data: {
            number: 30,
            capacity: 4,
            status: TableStatus.Available,
            token: 'token30',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          message: 'Table added successfully'
        }
      }

      mockTableApiRequest.add.mockResolvedValueOnce(mockAddResponse)

      const queryClient = createTestQueryClient()
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useAddTableMutation(), { wrapper })

      result.current.mutate({
        number: 30,
        capacity: 4,
        status: TableStatus.Available
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tables']
      })
    })

    it('should handle different table statuses', async () => {
      const statuses = [TableStatus.Available, TableStatus.Reserved, TableStatus.Hidden]

      for (const status of statuses) {
        const tableData = {
          number: 40,
          capacity: 6,
          status
        }

        const mockResponse = {
          status: 201,
          payload: {
            data: {
              ...tableData,
              token: `token-${status}`,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            message: 'Table added successfully'
          }
        }

        mockTableApiRequest.add.mockResolvedValueOnce(mockResponse)

        const { result } = renderHook(() => useAddTableMutation(), {
          wrapper: createWrapper()
        })

        result.current.mutate(tableData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data?.payload.data.status).toBe(status)
        result.current.reset()
      }
    })
  })

  describe('useUpdateTableMutation', () => {
    it('should update table successfully', async () => {
      const updateData = {
        id: 5,
        changeToken: true,
        capacity: 6,
        status: TableStatus.Reserved
      }

      const mockUpdateResponse = {
        status: 200,
        payload: {
          data: {
            ...mockTable,
            capacity: 6,
            status: TableStatus.Reserved,
            token: 'newtoken456' // New token because changeToken is true
          },
          message: 'Table updated successfully'
        }
      }

      mockTableApiRequest.updateTable.mockResolvedValueOnce(mockUpdateResponse)

      const { result } = renderHook(() => useUpdateTableMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(updateData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockUpdateResponse)
      expect(mockTableApiRequest.updateTable).toHaveBeenCalledWith(5, {
        changeToken: true,
        capacity: 6,
        status: TableStatus.Reserved
      })
    })

    it('should handle token regeneration', async () => {
      const updateDataWithTokenChange = {
        id: 5,
        changeToken: true,
        capacity: 4,
        status: TableStatus.Available
      }

      const updateDataWithoutTokenChange = {
        id: 5,
        changeToken: false,
        capacity: 4,
        status: TableStatus.Available
      }

      const mockResponseWithNewToken = {
        status: 200,
        payload: {
          data: { ...mockTable, token: 'regenerated-token' },
          message: 'Table updated with new token'
        }
      }

      const mockResponseSameToken = {
        status: 200,
        payload: {
          data: mockTable,
          message: 'Table updated without token change'
        }
      }

      // Test with token change
      mockTableApiRequest.updateTable.mockResolvedValueOnce(mockResponseWithNewToken)

      const { result: result1 } = renderHook(() => useUpdateTableMutation(), {
        wrapper: createWrapper()
      })

      result1.current.mutate(updateDataWithTokenChange)

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
      })

      expect(result1.current.data?.payload.data.token).toBe('regenerated-token')

      // Test without token change
      mockTableApiRequest.updateTable.mockResolvedValueOnce(mockResponseSameToken)

      const { result: result2 } = renderHook(() => useUpdateTableMutation(), {
        wrapper: createWrapper()
      })

      result2.current.mutate(updateDataWithoutTokenChange)

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true)
      })

      expect(result2.current.data?.payload.data.token).toBe(mockTable.token)
    })

    it('should handle error during table update', async () => {
      const mockError = new Error('Failed to update table')
      mockTableApiRequest.updateTable.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useUpdateTableMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate({
        id: 5,
        changeToken: false,
        capacity: 6
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should invalidate table list cache on success', async () => {
      const mockUpdateResponse = {
        status: 200,
        payload: {
          data: mockTable,
          message: 'Table updated successfully'
        }
      }

      mockTableApiRequest.updateTable.mockResolvedValueOnce(mockUpdateResponse)

      const queryClient = createTestQueryClient()
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useUpdateTableMutation(), { wrapper })

      result.current.mutate({
        id: 5,
        changeToken: false,
        capacity: 6
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tables'],
        exact: true
      })
    })

    it('should handle capacity updates', async () => {
      const capacities = [1, 2, 4, 6, 8, 12]

      for (const capacity of capacities) {
        const updateData = {
          id: 5,
          changeToken: false,
          capacity
        }

        const mockResponse = {
          status: 200,
          payload: {
            data: { ...mockTable, capacity },
            message: 'Table capacity updated'
          }
        }

        mockTableApiRequest.updateTable.mockResolvedValueOnce(mockResponse)

        const { result } = renderHook(() => useUpdateTableMutation(), {
          wrapper: createWrapper()
        })

        result.current.mutate(updateData)

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })

        expect(result.current.data?.payload.data.capacity).toBe(capacity)
        result.current.reset()
      }
    })
  })

  describe('useDeleteTableMutation', () => {
    it('should delete table successfully', async () => {
      const mockDeleteResponse = {
        status: 200,
        payload: {
          message: 'Table deleted successfully'
        }
      }

      mockTableApiRequest.deleteTable.mockResolvedValueOnce(mockDeleteResponse)

      const { result } = renderHook(() => useDeleteTableMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(5)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockDeleteResponse)
      expect(mockTableApiRequest.deleteTable).toHaveBeenCalledWith(5, expect.anything())
      expect(mockTableApiRequest.deleteTable).toHaveBeenCalledTimes(1)
    })

    it('should handle error during table deletion', async () => {
      const mockError = new Error('Failed to delete table')
      mockTableApiRequest.deleteTable.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useDeleteTableMutation(), {
        wrapper: createWrapper()
      })

      result.current.mutate(5)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toEqual(mockError)
    })

    it('should invalidate table list cache on successful deletion', async () => {
      const mockDeleteResponse = {
        status: 200,
        payload: {
          message: 'Table deleted successfully'
        }
      }

      mockTableApiRequest.deleteTable.mockResolvedValueOnce(mockDeleteResponse)

      const queryClient = createTestQueryClient()
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useDeleteTableMutation(), { wrapper })

      result.current.mutate(5)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['tables']
      })
    })

    it('should handle multiple delete operations', async () => {
      const mockDeleteResponse = {
        status: 200,
        payload: {
          message: 'Table deleted successfully'
        }
      }

      mockTableApiRequest.deleteTable.mockResolvedValue(mockDeleteResponse)

      const { result } = renderHook(() => useDeleteTableMutation(), {
        wrapper: createWrapper()
      })

      // Delete first table
      result.current.mutate(1)
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Reset and delete second table
      result.current.reset()
      result.current.mutate(2)
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(mockTableApiRequest.deleteTable).toHaveBeenCalledTimes(2)
      expect(mockTableApiRequest.deleteTable).toHaveBeenNthCalledWith(1, 1, expect.anything())
      expect(mockTableApiRequest.deleteTable).toHaveBeenNthCalledWith(2, 2, expect.anything())
    })
  })

  describe('Integration Tests', () => {
    it('should maintain cache consistency across mutations', async () => {
      const queryClient = createTestQueryClient()

      // Pre-populate cache with table list
      queryClient.setQueryData(['tables'], mockTableListResponse)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result: listResult } = renderHook(() => useTableListQuery(), { wrapper })
      const { result: addResult } = renderHook(() => useAddTableMutation(), { wrapper })
      const { result: updateResult } = renderHook(() => useUpdateTableMutation(), { wrapper })

      // Verify initial data
      expect(listResult.current.data?.payload.data).toHaveLength(3)

      // Add new table
      const newTableData = {
        number: 50,
        capacity: 4,
        status: TableStatus.Available
      }

      const mockAddResponse = {
        status: 201,
        payload: {
          data: {
            ...newTableData,
            token: 'token50',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          message: 'Table added successfully'
        }
      }

      mockTableApiRequest.add.mockResolvedValueOnce(mockAddResponse)
      addResult.current.mutate(newTableData)

      await waitFor(() => {
        expect(addResult.current.isSuccess).toBe(true)
      })

      // Update existing table
      const updateData = {
        id: 5,
        changeToken: true,
        capacity: 8,
        status: TableStatus.Reserved
      }

      const mockUpdateResponse = {
        status: 200,
        payload: {
          data: { ...mockTable, capacity: 8, status: TableStatus.Reserved },
          message: 'Table updated successfully'
        }
      }

      mockTableApiRequest.updateTable.mockResolvedValueOnce(mockUpdateResponse)
      updateResult.current.mutate(updateData)

      await waitFor(() => {
        expect(updateResult.current.isSuccess).toBe(true)
      })

      // Verify operations completed
      expect(addResult.current.isSuccess).toBe(true)
      expect(updateResult.current.isSuccess).toBe(true)
    })

    it('should handle table lifecycle from creation to deletion', async () => {
      const queryClient = createTestQueryClient()

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      // Setup hooks
      const { result: addResult } = renderHook(() => useAddTableMutation(), { wrapper })
      const { result: updateResult } = renderHook(() => useUpdateTableMutation(), { wrapper })
      const { result: deleteResult } = renderHook(() => useDeleteTableMutation(), { wrapper })

      // 1. Create table
      const tableData = {
        number: 100,
        capacity: 4,
        status: TableStatus.Available
      }

      const addResponse = {
        status: 201,
        payload: {
          data: {
            ...tableData,
            token: 'token100',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          message: 'Table created successfully'
        }
      }

      mockTableApiRequest.add.mockResolvedValueOnce(addResponse)
      addResult.current.mutate(tableData)

      await waitFor(() => {
        expect(addResult.current.isSuccess).toBe(true)
      })

      // 2. Update table
      const updateResponse = {
        status: 200,
        payload: {
          data: {
            ...addResponse.payload.data,
            capacity: 6,
            status: TableStatus.Reserved
          },
          message: 'Table updated successfully'
        }
      }

      mockTableApiRequest.updateTable.mockResolvedValueOnce(updateResponse)
      updateResult.current.mutate({
        id: 100,
        changeToken: false,
        capacity: 6,
        status: TableStatus.Reserved
      })

      await waitFor(() => {
        expect(updateResult.current.isSuccess).toBe(true)
      })

      // 3. Delete table
      const deleteResponse = {
        status: 200,
        payload: {
          message: 'Table deleted successfully'
        }
      }

      mockTableApiRequest.deleteTable.mockResolvedValueOnce(deleteResponse)
      deleteResult.current.mutate(100)

      await waitFor(() => {
        expect(deleteResult.current.isSuccess).toBe(true)
      })

      // Verify all operations completed successfully
      expect(addResult.current.isSuccess).toBe(true)
      expect(updateResult.current.isSuccess).toBe(true)
      expect(deleteResult.current.isSuccess).toBe(true)
    })
  })
})

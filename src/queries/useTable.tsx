// Tạo query cho Table
import tableApiRequest from '@/apiRequests/table'
import { CreateTableBodyType, UpdateTableBodyType } from '@/schemaValidations/table.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useTableListQuery = () => {
  return useQuery({
    queryKey: ['tables-list'],
    queryFn: () => tableApiRequest.getListTable()
  })
}

export const useGetTableQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  return useQuery({
    queryKey: ['tables-detai', id],
    queryFn: () => tableApiRequest.getDetailTable(id),
    enabled
  })
}

export const useAddTableMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateTableBodyType) => tableApiRequest.addTable(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tables-list']
      })
    }
  })
}

export const useUpdateTableMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateTableBodyType & { id: number }) => tableApiRequest.updateTable(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tables-list'],
        exact: true
      })
    }
  })
}

export const useDeleteTableMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => tableApiRequest.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tables-list']
      })
    }
  })
}

import accountApiRequest from '@/apiRequests/account'
import {
  AccountResType,
  ChangePasswordBodyType,
  CreateEmployeeAccountBodyType,
  GetGuestListQueryParamsType,
  UpdateEmployeeAccountBodyType,
  UpdateMeBodyType
} from '@/schemaValidations/account.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useAccountMe = () => {
  return useQuery({
    queryKey: ['account-me'],
    queryFn: () => accountApiRequest.getMeProfile()
  })
}

export const useUpdateMeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMeBodyType) => accountApiRequest.updateMeProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-me'] })
    }
  })
}

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: (body: ChangePasswordBodyType) => accountApiRequest.changePassword(body)
  })
}

// Get list Employee account
export const useGetListAccountQuery = () => {
  return useQuery({
    queryKey: ['account-list'],
    queryFn: () => accountApiRequest.getListAccount()
  })
}

// Get detail employee accountn
export const useGetEmployeeQuery = ({ id, enabled }: { id: number; enabled: boolean }) => {
  //  Truyền vào trong queryKey là id để mà react-query nó biết được là nó sẽ gọi tới thằng nào
  // Để khi mà id thay đổi thì nó sẽ chạy lại cái queryFn
  return useQuery({
    queryKey: ['employee-account', id],
    queryFn: () => accountApiRequest.getEmployeeDetail(id),
    // Khi mà enabled là true thì nó sẽ gọi API còn false thì nó sẽ không gọi
    enabled
  })
}

// Add employee account
export const useAddEmployeeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateEmployeeAccountBodyType) => accountApiRequest.addEmployee(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-list'] })
    }
  })
}

// Update employee account
export const useUpdateEmployeeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateEmployeeAccountBodyType & { id: number }) =>
      accountApiRequest.updateEmployee(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-list'] })
    }
  })
}

// Delete employee account
export const useDeleteEmployeeMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (employeeId: number) => accountApiRequest.deleteEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-list'] })
    }
  })
}

export const useGetGuestListQuery = (queryParams: GetGuestListQueryParamsType) => {
  return useQuery({
    queryFn: () => accountApiRequest.guestList(queryParams),
    queryKey: ['guests', queryParams]
  })
}

export const useCreateGuestMutation = () => {
  return useMutation({
    mutationFn: accountApiRequest.createGuest
  })
}

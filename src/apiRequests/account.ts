import http from '@/lib/http'
import {
  AccountListResType,
  AccountResType,
  ChangePasswordBodyType,
  CreateEmployeeAccountBodyType,
  UpdateEmployeeAccountBodyType,
  UpdateMeBodyType
} from '@/schemaValidations/account.schema'
import { AccountRes } from '../schemaValidations/account.schema'

const PREFIX = '/accounts'
const accountApiRequest = {
  getMeProfile: () => http.get<AccountResType>(`${PREFIX}/me`),
  sMeProfile: (accessToken: string) =>
    http.get<AccountResType>(`${PREFIX}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }),
  updateMeProfile: (body: UpdateMeBodyType) => http.put<AccountResType>(`${PREFIX}/me`, body),
  changePassword: (body: ChangePasswordBodyType) => http.put<AccountResType>(`${PREFIX}/change-password`, body),
  getListAccount: () => http.get<AccountListResType>(PREFIX),
  getEmployeeDetail: (employeeId: number) => http.get<AccountResType>(`${PREFIX}/detail/${employeeId}`),
  addEmployee: (body: CreateEmployeeAccountBodyType) => http.post<AccountResType>(PREFIX, body),
  updateEmployee: (employeeId: number, body: UpdateEmployeeAccountBodyType) =>
    http.put<AccountResType>(`${PREFIX}/detail/${employeeId}`, body),
  deleteEmployee: (employeeId: number) => http.delete<AccountResType>(`${PREFIX}/detail/${employeeId}`)
}

export default accountApiRequest

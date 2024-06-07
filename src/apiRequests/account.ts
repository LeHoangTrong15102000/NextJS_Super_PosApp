import http from '@/lib/http'
import { AccountResType, ChangePasswordBodyType, UpdateMeBodyType } from '@/schemaValidations/account.schema'
import { AccountRes } from '../schemaValidations/account.schema'

const accountApiRequest = {
  getMeProfile: () => http.get<AccountResType>('/accounts/me'),
  updateMeProfile: (body: UpdateMeBodyType) => http.put<AccountResType>('/accounts/me', body),
  changePassword: (body: ChangePasswordBodyType) => http.put<AccountResType>('/accounts/change-password', body)
}

export default accountApiRequest

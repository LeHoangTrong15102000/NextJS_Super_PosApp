import http from '@/lib/http'
import {
  LoginBodyType,
  LoginResType,
  LogoutBodyType,
  RefreshTokenBodyType,
  RefreshTokenResType
} from '@/schemaValidations/auth.schema'
import { MessageResType } from '@/schemaValidations/common.schema'

const authApiRequest = {
  // Một cái biến để check xem là cái API refresh-token đã được call hay chưa nếu đang gọi thì ko cho các thằng khác gọi vào
  refreshTokenRequest: null as Promise<{
    status: number
    payload: RefreshTokenResType
  }> | null,
  sLogin: (body: LoginBodyType) => http.post<LoginResType>('/auth/login', body),
  login: (body: LoginBodyType) =>
    http.post<LoginResType>('/api/auth/login', body, {
      baseUrl: ''
    }),
  // register: (body: RegisterBodyType) => http.post<RegisterResType>('/auth/register', body),

  // Do thằng sLogout chúng ta sẽ khai báo  ở môi trường server nên là nó không tự động truyền accessToken được
  sLogout: (
    body: LogoutBodyType & {
      accessToken: string
    }
  ) =>
    http.post<MessageResType>(
      '/auth/logout',
      {
        refreshToken: body.refreshToken
      },
      {
        headers: {
          Authorization: `Bearer ${body.accessToken}`
        }
      }
    ),

  // logout ở client này khi mà request đến serverNext(route handler) thì AT và RT nó tự động gửi lên cái cookie rồi nên là không cần truyền
  logout: () =>
    http.post<MessageResType>('/api/auth/logout', null, {
      baseUrl: ''
    }),
  sRefreshToken: (body: RefreshTokenBodyType) => http.post<RefreshTokenResType>('/auth/refresh-token', body),
  async refreshToken() {
    // Nếu mà đã có rồi thì trả về luôn để tranh thằng khác gọi thêm trong 1 khoảng t/g ngắn gay ra duplicate
    if (this.refreshTokenRequest) {
      // Nếu nó đang khác null thì return  lại chính nó chứ không có nhảy xuống dưới
      return this.refreshTokenRequest
    }
    this.refreshTokenRequest = http.post<RefreshTokenResType>('/api/auth/refresh-token', null, {
      baseUrl: ''
    })
    const result = await this.refreshTokenRequest
    this.refreshTokenRequest = null
    return result
  }
}

export default authApiRequest

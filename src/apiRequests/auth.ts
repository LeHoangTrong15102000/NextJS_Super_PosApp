import http from '@/lib/http'
import { LoginBodyType, LoginResType, LogoutBodyType } from '@/schemaValidations/auth.schema'
import { MessageResType } from '@/schemaValidations/common.schema'

const authApiRequest = {
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
    http.post<MessageResType>('/api/auth/logout', {
      baseUrl: ''
    })
}

export default authApiRequest

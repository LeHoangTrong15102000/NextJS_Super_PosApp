import http from '@/lib/http'
import { LoginBodyType, LoginResType } from '@/schemaValidations/auth.schema'
import { MessageResType } from '@/schemaValidations/common.schema'

const authApiRequest = {
  sLogin: (body: LoginBodyType) => http.post<LoginResType>('/auth/login', body),
  login: (body: LoginBodyType) =>
    http.post<LoginResType>('/api/auth/login', body, {
      baseUrl: ''
    }),
  // register: (body: RegisterBodyType) => http.post<RegisterResType>('/auth/register', body),
  auth: (body: { sessionToken: string; expiresAt: string }) =>
    http.post('/api/auth', body, {
      baseUrl: ''
    }),

  // API  logout truyền từ `next-server` đến `serverBE`
  // Body nó không nhận vào là null nên chúng ta sẽ để là object rỗng
  logoutFromNextServerToServer: (sessionToken: string) =>
    http.post<MessageResType>(
      '/auth/logout',
      {},
      {
        // Thì thằng server-next gửi sessionToken qua server BE thông qua `Authorization`
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      }
    ),
  // API logout truyền từ next-client đến next-server, từ server NextJS trả về và cũng muốn response là tương tự luôn
  logoutFromNextClientToNextServer: (force?: boolean | undefined, signal?: AbortSignal | undefined) =>
    http.post<MessageResType>(
      '/api/auth/logout',
      { force },
      {
        baseUrl: '',
        signal
      }
    )
}

export default authApiRequest

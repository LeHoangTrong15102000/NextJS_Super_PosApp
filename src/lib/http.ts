import envConfig from '@/config'
import { normalizePath } from '@/lib/utils'
import { LoginResType } from '@/schemaValidations/auth.schema'
import { redirect, useRouter } from 'next/navigation'

type CustomOptions = Omit<RequestInit, 'method'> & {
  baseUrl?: string | undefined
}

const ENTITY_ERROR_STATUS = 422
const AUTHENTICATION_ERROR_STATUS = 401

// format API trả về thì nó sẽ có kiểu như thế này
type EntityErrorPayload = {
  message: string
  errors: {
    field: string
    message: string
  }[]
}

// const router = useRouter()

// Nên throw một cái object nó kế thừa lỗi từ một cái object error,để khi mà có bị lỗi tại đâu thì nó sẽ show ra được dòng lỗi cho chúng ta, còn throw bình thường thì nó không có để lỗi đâu
export class HttpError extends Error {
  status: number
  payload: {
    message: string
    // Ngoài ra còn những cái key gì chúng ta không biết thì sẽ viết như này
    [key: string]: any
  }
  constructor({ status, payload, message = 'Lỗi HTTP' }: { status: number; payload: any; message?: string }) {
    // Không truyền vào thì lấy cái message mặc định, nhưng mà bây giờ có thể truyền cái message mặc định ở ngoài vào
    super(message)
    this.status = status
    this.payload = payload
  }
}

// Khai báo class EntityError nhừng mà nó sẽ chi tiết hơn nhiều
// Vì chỗ này chúng ta sử dụng typescript nên là nó check lỗi khá lá kĩ rồi
export class EntityError extends HttpError {
  status: typeof ENTITY_ERROR_STATUS
  payload: EntityErrorPayload
  constructor({ status, payload }: { status: typeof ENTITY_ERROR_STATUS; payload: EntityErrorPayload }) {
    super({ status, payload, message: 'Lỗi thực thể' })
    if (status !== ENTITY_ERROR_STATUS) {
      throw new Error('EntityError must have status 422')
    }
    this.status = status
    this.payload = payload
  }
}

// // Class tự động hóa sessionToken, nó sẽ lưu giá trị clientSessionToken vào trong cái object này
// class SessionToken {
//   // lưu trong ram bộ nhớ nên là sẽ lấy ra nhanh hơn
//   private token = '';
//   // Ban đầu chưa set thì cho _expiresAt thời gian hiện tại
//   private _expiresAt = new Date().toISOString();
//   get value() {
//     return this.token;
//   }
//   set value(token: string) {
//     // Kiểm tra để mà đảm bảo rằng khi mà gọi các getter setter thì nó đều thực hiện ở client cả
//     // nếu không phải là môi trường client thì sẽ throw ra lỗi
//     if (typeof window === 'undefined') {
//       throw new Error('Cannot set token on server side');
//     }
//     this.token = token;
//   }
//   get expiresAt() {
//     return this._expiresAt;
//   }
//   set expiresAt(expiresAt: string) {
//     if (typeof window === 'undefined') {
//       throw new Error('Cannot set token on server side');
//     }
//     this._expiresAt = expiresAt;
//   }
// }

// SessionToken chỉ được truy cập ở client mà thôi, khi mà truy cập từ server thì nó sẽ không có giá trị
// export const clientSessionToken = new SessionToken();
let clientLogoutRequest: null | Promise<any> = null

// function  sẽ check xem thử là môi trường client hay là môi trường server
// Nên sử dụng function vì khi mà cái `request` thì chúng ta biết được là đang ở môi trường nào, còn cái biến chỉ được tạo giá trị cố định khi mà chúng ta build nên là nó ko biết được là đang ở môi trường nào
export const isClient = typeof window !== 'undefined'

// request thực hiện gọi API cở client và server component
const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  options?: CustomOptions | undefined
) => {
  let body: FormData | string | undefined = undefined
  if (options?.body instanceof FormData) {
    body = options.body
  } else if (options?.body) {
    body = JSON.stringify(options.body)
  }

  const baseHeaders: {
    [key: string]: string
  } =
    body instanceof FormData
      ? {}
      : {
          'Content-Type': 'application/json'
        }
  if (isClient) {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      baseHeaders.Authorization = `Bearer ${accessToken}`
    }
  }

  // Nếu truyền vào baseUrl thì lấy giá trị truyền vào, nếu truyền vào '' thì đồng nghĩa với việc chúng ta gọi API đến Nextjs server
  const baseUrl = options?.baseUrl === undefined ? envConfig.NEXT_PUBLIC_API_ENDPOINT : options.baseUrl

  // const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
  const fullUrl = `${baseUrl}/${normalizePath(url)}`
  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...baseHeaders,
      // Truyền những cái headers khác như là Authorization hoặc là Multiple: form/data để mà upload hình ảnh
      ...options?.headers
    } as any,
    body,
    method
  })
  // Convert dữ liệu từ server trả về ra dữ liệu được định dạng
  const payload: Response = await res.json()
  const data = {
    status: res.status,
    payload
  }
  // Xử lý interceptor là nơi xử lý request và response trước khi trả về cho client component
  if (!res.ok) {
    if (res.status === ENTITY_ERROR_STATUS) {
      // payload của thằng request thì nó có kiểu là response, còn cái payload của thằng entityError  thì là EntityErrorPayload
      throw new EntityError(
        data as {
          // Ép kiểu như thế này thì nó sẽ hết bị lỗi
          status: typeof ENTITY_ERROR_STATUS
          payload: EntityErrorPayload
        }
      )
    }
    // Khi mà goi đến server bị lỗi 401 thì nó sẽ chạy vào đây
    else if (res.status === AUTHENTICATION_ERROR_STATUS) {
      // Do cái file đều có thể gọi client-next và server-next, nên là chúng ta cần phải kiểm tra điều kiện trước khi gọi
      // Nếu mà lỗi 401 ở client thì
      if (isClient) {
        // Khi mà không có thì mới gọi còn không thì sẽ không gọi, như vậy thì nó sẽ không bị duplicate request logout nữa
        if (!clientLogoutRequest) {
          clientLogoutRequest = fetch('/api/auth/logout', {
            method: 'POST',
            body: null,
            headers: {
              ...baseHeaders
            } as any
          })

          try {
            await clientLogoutRequest
          } catch (error) {
          } finally {
            // Nhảy vào finally rồi nếu có lỗi hay không lỗi thì chúng ta vẫn xử lý
            // Sau khi mà logout thành công thì set cái sessionToken lại thành rỗng
            // clientSessionToken.value = '';
            // clientSessionToken.expiresAt = new Date().toISOString();
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            clientLogoutRequest = null
            // Và cho nó redirect sang cái page là login
            // Redirect về trang login có thể dẫn đến lặp vô hạn, nếu không được xử lý đúng cách, vì nếu rơi vào trường hợp tại trang login chúng ta có gọi các API cần accessToken, mà accessToken bị xóa thì nó lại nhảy vào đây, và cứ thể nó sẽ bị lặp
            location.href = '/login' // thằng location.href nó sẽ làm cho cái app của chúng ta bị refresh thì cái network-tab nó sẽ bị clear đi, nên là chúng ta không thể nào mà debug để mà check được
          }
        }
      } else {
        // Và chúng ta gọi API ở server Nextjs (router handler, server component) đến serverBE thì chúng ta cũng sẽ cho logout luôn
        // lấy sessionToken từ trên cái headers ở server component truyền lên  serverBE
        // Cái headers.Authorization là từ cái thằng `request` server component mà chúng ta truyền lỗi cái sessionToken lên
        const accessToken = (options?.headers as any)?.Authorization.split('Bearer ')[1]
        // Đang test trực tiếp thằng redirect đang chạy ở logic của server mà thôi chứ chúng ta chưa trực tiếp chạy cái  thằng này ở server component
        redirect(`/logout?accessToken=${accessToken}`)
      }
    } else {
      // Nếu không phải là lỗi 422 thì chúng ta sẽ throw new Error
      throw new HttpError(data)
    }
  }

  // Nếu là res.ok thì nếu mà người dùng login hay logout thì xử lý như bên dưới
  //  Xử lý sau khi login hoặc là register thì sẽ set giá trị cho clientSessionToken luôn
  // Đảm bảo logic chỉ chạy ở phía client(browser)
  if (isClient) {
    const normalizeUrl = normalizePath(url)
    // if (['auth/login'].some((item) => item === normalizeUrl))

    if (normalizeUrl === 'api/auth/login') {
      const { accessToken, refreshToken } = (payload as LoginResType).data
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      // clientSessionToken.value = (payload as LoginResType | RegisterResType).data.token;
    } else if (normalizeUrl === 'api/auth/logout') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }
  // Trả về data từ  server đã được .json và được xử lý rồi
  return data
}

const http = {
  get<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('GET', url, options)
  },
  post<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('POST', url, { ...options, body })
  },
  put<Response>(url: string, body: any, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('PUT', url, { ...options, body })
  },
  delete<Response>(url: string, options?: Omit<CustomOptions, 'body'> | undefined) {
    return request<Response>('DELETE', url, options)
  }
}

export default http

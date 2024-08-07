import { toast } from '@/components/ui/use-toast'
import { EntityError } from '@/lib/http'
import { type ClassValue, clsx } from 'clsx'
import { UseFormSetError } from 'react-hook-form'
import { twMerge } from 'tailwind-merge'
import { DishStatus, OrderStatus, Role, TableStatus } from '@/constants/type'
import envConfig from '@/config'
import jwt from 'jsonwebtoken'
import authApiRequest from '@/apiRequests/auth'
import { TokenPayload } from '@/types/jwt.types'
import guestApiRequest from '../apiRequests/guest'
import { BookX, CookingPot, HandCoins, Loader, Truck } from 'lucide-react'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const handleErrorApi = ({
  error,
  setError,
  duration
}: {
  error: any
  setError?: UseFormSetError<any>
  duration?: number
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((error) => {
      setError(error.field, {
        type: 'server',
        message: error.message
      })
    })
  } else {
    toast({
      title: 'Lỗi rồi',
      description: error?.payload?.message ?? 'Lỗi không xác định',
      variant: 'destructive',
      duration: duration ?? 3000
    })
  }
}

const isBrowser = typeof window !== 'undefined'

export const getAccessTokenFromLocalStorage = () => (isBrowser ? localStorage.getItem('accessToken') : null)

export const getRefreshTokenFromLocalStorage = () => (isBrowser ? localStorage.getItem('refreshToken') : null)

export const setAccessTokenToLocalStorage = (value: string) => isBrowser && localStorage.setItem('accessToken', value)
export const setRefreshTokenToLocalStorage = (value: string) => isBrowser && localStorage.setItem('refreshToken', value)

// Remove tokens from localStorage
export const removeTokensFromLocalStorage = () => {
  isBrowser && localStorage.removeItem('accessToken')
  isBrowser && localStorage.removeItem('refreshToken')
}

// Check and Refresh Token
export const checkAndRefreshToken = async (param?: {
  onError?: () => void
  onSuccess?: () => void
  force?: boolean
}) => {
  // Không nên đưa logic lấy accessToken và refreshToken ra khỏi cái function này
  // Vì để mỗi lần mà checkAndRefreshToken được gọi thì chúng ta sẽ có AT và RT mới
  // Tránh hiện tượng nó lấy AT và RT cũ rồi gọi cho lần tiếp theo
  const accessToken = getAccessTokenFromLocalStorage()
  const refreshToken = getRefreshTokenFromLocalStorage()
  // Chưa đăng nhập thì cũng không cho chạy
  if (!accessToken || !refreshToken) return

  // const decodedAccessToken = jwt.decode(accessToken) as {
  //   exp: number
  //   iat: number
  // }
  // const decodedRefreshToken = jwt.decode(refreshToken) as {
  //   exp: number
  //   iat: number
  // }
  const decodedAccessToken = decodeToken(accessToken)
  const decodedRefreshToken = decodeToken(refreshToken)
  //  Thời điểm hết hạn của token là tính theo epoch time (s)
  // Còn khi chúng ta dùng cú pháp new Date().getTime() thì nó sẽ trả về epoch time là (ms)

  // Lấy ra thời điểm hiện tại theo s, math.round là để nó làm tròn
  // Trừ đi cho 1 vì phòng cái trường hợp mà nó chênh lệch ra ms ở lúc set vào cookie
  // Xử lý như này để mà cái token ở thằng cookies nó sẽ bị xóa trước khi mà thằng middleware nó sẽ check cái logic redirect
  const now = new Date().getTime() / 1000 - 1 // Theo tiêu chuẩn Epoch time(s)

  // Trường hợp refreshToken hết hạn thì không xử lý nữa
  if (decodedRefreshToken.exp <= now) {
    removeTokensFromLocalStorage()
    // Mục đích của việc cái callback này là cho nó clear đi cái interval không gọi làm checkAndRefreshToken nữa
    return param?.onError && param.onError()
  }
  // Ví dụ accessToken của chúng ta có thời gian hết hạn là 10s
  // Thì mình sẽ kiểm tra còn 1/3 thời gian thì chúng ta sẽ cho refreshToken lại
  // Thời gian còn lại sẽ dựa trên: decodedAccessToken.exp - now <= 3(bé hơn khoảng thời gian sống của AT/3)
  // Thời gian hết hạn AT decodedAccessToken.exp - decodedAccessToken.iat

  // Khi mà accessToken chưa hết hạn thì nếu mà chúng ta muốn nó refreshToken thì truyền vào cho nó một biến là force
  if (param?.force || decodedAccessToken.exp - now < (decodedAccessToken.exp - decodedAccessToken.iat) / 3) {
    // Gọi API refreshToken
    try {
      // const { payload } = await authApiRequest.refreshToken()
      const role = decodedRefreshToken.role
      const res = role === Role.Guest ? await guestApiRequest.refreshToken() : await authApiRequest.refreshToken()
      setAccessTokenToLocalStorage(res.payload.data.accessToken)
      setRefreshTokenToLocalStorage(res.payload.data.refreshToken)
      param?.onSuccess && param.onSuccess()
    } catch (error) {
      // Khi bị lỗi thì chúng ta sẽ logout vì đã handle ở bên route handler khi bị lỗi 401,
      // Cùng với đó là clearInterval
      param?.onError && param.onError()
    }
  }
}

/**
 * Xóa đi ký tự `/` đầu tiên của path
 */
export const normalizePath = (path: string) => {
  return path.startsWith('/') ? path.slice(1) : path
}

// Trẳ về payload có kiểu là any
export const decodeJWT = <Payload extends any>(token: string) => {
  return jwt.decode(token) as Payload
}

export const formatCurrency = (number: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number)
}

// {}['A' | 'B' | 'C'] => {}['A'] | {}['B'] | {}['C'] -> 'A' | 'B' | 'C'
// Thì thằng status nó sẽ là một trong ba giá trị đó
export const getVietnameseDishStatus = (status: (typeof DishStatus)[keyof typeof DishStatus]) => {
  switch (status) {
    case DishStatus.Available:
      return 'Có sẵn'
    case DishStatus.Unavailable:
      return 'Không có sẵn'
    default:
      return 'Ẩn'
  }
}

export const getVietnameseTableStatus = (status: (typeof TableStatus)[keyof typeof TableStatus]) => {
  switch (status) {
    case TableStatus.Available:
      return 'Có sẵn'
    case TableStatus.Reserved:
      return 'Đã đặt'
    default:
      return 'Ẩn'
  }
}

export const getVietnameseOrderStatus = (status: (typeof OrderStatus)[keyof typeof OrderStatus]) => {
  switch (status) {
    case OrderStatus.Delivered:
      return 'Đã phục vụ'
    case OrderStatus.Paid:
      return 'Đã thanh toán'
    case OrderStatus.Pending:
      return 'Chờ xử lý'
    case OrderStatus.Processing:
      return 'Đang chuẩn bị'
    default:
      return 'Từ chối'
  }
}

export const getTableLink = ({ token, tableNumber }: { token: string; tableNumber: number }) => {
  return envConfig.NEXT_PUBLIC_URL + '/tables/' + tableNumber + '?token=' + token
}

// Decode token
export const decodeToken = (token: string) => {
  return jwt.decode(token) as TokenPayload
}

export function removeAccents(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export const simpleMatchText = (fullText: string, matchText: string) => {
  return removeAccents(fullText.toLowerCase()).includes(removeAccents(matchText.trim().toLowerCase()))
}

export const formatDateTimeToLocaleString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm:ss dd/MM/yyyy')
}

export const formatDateTimeToTimeString = (date: string | Date) => {
  return format(date instanceof Date ? date : new Date(date), 'HH:mm:ss')
}

export const OrderStatusIcon = {
  [OrderStatus.Pending]: Loader,
  [OrderStatus.Processing]: CookingPot,
  [OrderStatus.Rejected]: BookX,
  [OrderStatus.Delivered]: Truck,
  [OrderStatus.Paid]: HandCoins
}

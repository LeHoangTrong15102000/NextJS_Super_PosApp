import { create } from 'zustand'

export type NotificationType = 'new-order' | 'update-order' | 'payment'

export type Notification = {
  id: string
  type: NotificationType
  message: string
  timestamp: Date
  read: boolean
}

const MAX_NOTIFICATIONS = 50
const AUTO_CLEANUP_MS = 60 * 60 * 1000 // 1 hour

type NotificationStore = {
  notifications: Notification[]
  addNotification: (type: NotificationType, message: string) => void
  markAllRead: () => void
  unreadCount: () => number
  cleanup: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  addNotification: (type, message) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      read: false
    }
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS)
    }))
  },
  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }))
  },
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
  cleanup: () => {
    const cutoff = new Date(Date.now() - AUTO_CLEANUP_MS)
    set((state) => ({
      notifications: state.notifications.filter((n) => n.timestamp > cutoff)
    }))
  }
}))


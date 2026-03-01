export const queryKeys = {
  accountMe: {
    all: ['account-me'] as const
  },
  accounts: {
    all: ['accounts'] as const,
    detail: (id: number) => ['accounts', id] as const
  },
  guests: {
    list: (queryParams: unknown) => ['guests', queryParams] as const
  },
  guestOrders: {
    all: ['guest-orders'] as const
  },
  dishes: {
    all: ['dishes'] as const,
    detail: (id: number) => ['dishes', id] as const
  },
  orders: {
    list: (queryParams: unknown) => ['orders', queryParams] as const,
    detail: (id: number) => ['orders', id] as const
  },
  tables: {
    all: ['tables'] as const,
    detail: (id: number) => ['tables', id] as const
  },
  dashboardIndicators: {
    list: (queryParams: unknown) => ['dashboardIndicators', queryParams] as const
  }
} as const


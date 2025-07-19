import {
  CreateOrdersBody,
  UpdateOrderBody,
  OrderSchema,
  GetOrdersRes,
  PayGuestOrdersBody,
  CreateOrdersBodyType,
  UpdateOrderBodyType,
  PayGuestOrdersBodyType
} from '../order.schema'
import { OrderStatus } from '@/constants/type'

describe('Order Schema Validation', () => {
  describe('CreateOrdersBody', () => {
    const validOrderData: CreateOrdersBodyType = {
      guestId: 1,
      orders: [
        { dishId: 1, quantity: 2 },
        { dishId: 2, quantity: 1 }
      ]
    }

    it('should validate correct order creation data', () => {
      const result = CreateOrdersBody.safeParse(validOrderData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.guestId).toBe(1)
        expect(result.data.orders).toHaveLength(2)
        expect(result.data.orders[0].dishId).toBe(1)
        expect(result.data.orders[0].quantity).toBe(2)
      }
    })

    describe('Guest ID Validation', () => {
      it('should accept valid guest ID', () => {
        const validData = { ...validOrderData, guestId: 123 }
        const result = CreateOrdersBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.guestId).toBe(123)
        }
      })

      it('should reject negative guest ID', () => {
        const invalidData = { ...validOrderData, guestId: -1 }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['guestId'])
        }
      })

      it('should reject zero guest ID', () => {
        const invalidData = { ...validOrderData, guestId: 0 }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['guestId'])
        }
      })

      it('should coerce string guest ID to number', () => {
        const dataWithStringId = { ...validOrderData, guestId: '123' as any }
        const result = CreateOrdersBody.safeParse(dataWithStringId)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.guestId).toBe(123)
          expect(typeof result.data.guestId).toBe('number')
        }
      })
    })

    describe('Orders Array Validation', () => {
      it('should accept single order item', () => {
        const validData = {
          ...validOrderData,
          orders: [{ dishId: 1, quantity: 1 }]
        }
        const result = CreateOrdersBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.orders).toHaveLength(1)
        }
      })

      it('should accept multiple order items', () => {
        const validData = {
          ...validOrderData,
          orders: [
            { dishId: 1, quantity: 2 },
            { dishId: 2, quantity: 1 },
            { dishId: 3, quantity: 5 }
          ]
        }
        const result = CreateOrdersBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.orders).toHaveLength(3)
        }
      })

      it('should reject empty orders array', () => {
        const invalidData = { ...validOrderData, orders: [] }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['orders'])
        }
      })

      it('should validate individual order items', () => {
        const invalidData = {
          ...validOrderData,
          orders: [
            { dishId: 1, quantity: 2 },
            { dishId: -1, quantity: 1 } // Invalid dish ID
          ]
        }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['orders', 1, 'dishId'])
        }
      })
    })

    describe('Order Item Validation', () => {
      it('should validate dish ID', () => {
        const validData = {
          ...validOrderData,
          orders: [{ dishId: 999, quantity: 1 }]
        }
        const result = CreateOrdersBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.orders[0].dishId).toBe(999)
        }
      })

      it('should reject negative dish ID', () => {
        const invalidData = {
          ...validOrderData,
          orders: [{ dishId: -1, quantity: 1 }]
        }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
      })

      it('should reject zero dish ID', () => {
        const invalidData = {
          ...validOrderData,
          orders: [{ dishId: 0, quantity: 1 }]
        }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
      })

      it('should validate quantity', () => {
        const validData = {
          ...validOrderData,
          orders: [{ dishId: 1, quantity: 10 }]
        }
        const result = CreateOrdersBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.orders[0].quantity).toBe(10)
        }
      })

      it('should reject negative quantity', () => {
        const invalidData = {
          ...validOrderData,
          orders: [{ dishId: 1, quantity: -1 }]
        }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
      })

      it('should reject zero quantity', () => {
        const invalidData = {
          ...validOrderData,
          orders: [{ dishId: 1, quantity: 0 }]
        }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
      })

      it('should coerce string values to numbers', () => {
        const dataWithStrings = {
          ...validOrderData,
          orders: [{ dishId: '1' as any, quantity: '5' as any }]
        }
        const result = CreateOrdersBody.safeParse(dataWithStrings)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.orders[0].dishId).toBe(1)
          expect(result.data.orders[0].quantity).toBe(5)
          expect(typeof result.data.orders[0].dishId).toBe('number')
          expect(typeof result.data.orders[0].quantity).toBe('number')
        }
      })
    })

    describe('Required Fields', () => {
      it('should require guestId', () => {
        const { guestId, ...dataWithoutGuestId } = validOrderData
        const result = CreateOrdersBody.safeParse(dataWithoutGuestId)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['guestId'])
        }
      })

      it('should require orders array', () => {
        const { orders, ...dataWithoutOrders } = validOrderData
        const result = CreateOrdersBody.safeParse(dataWithoutOrders)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['orders'])
        }
      })

      it('should require dishId in order items', () => {
        const invalidData = {
          ...validOrderData,
          orders: [{ quantity: 2 } as any]
        }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['orders', 0, 'dishId'])
        }
      })

      it('should require quantity in order items', () => {
        const invalidData = {
          ...validOrderData,
          orders: [{ dishId: 1 } as any]
        }
        const result = CreateOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['orders', 0, 'quantity'])
        }
      })
    })
  })

  describe('UpdateOrderBody', () => {
    const validUpdateData: UpdateOrderBodyType = {
      status: OrderStatus.Processing
    }

    it('should validate correct order update data', () => {
      const result = UpdateOrderBody.safeParse(validUpdateData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe(OrderStatus.Processing)
      }
    })

    describe('Status Validation', () => {
      it('should accept Pending status', () => {
        const validData = { status: OrderStatus.Pending }
        const result = UpdateOrderBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(OrderStatus.Pending)
        }
      })

      it('should accept Processing status', () => {
        const validData = { status: OrderStatus.Processing }
        const result = UpdateOrderBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(OrderStatus.Processing)
        }
      })

      it('should accept Delivered status', () => {
        const validData = { status: OrderStatus.Delivered }
        const result = UpdateOrderBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(OrderStatus.Delivered)
        }
      })

      it('should accept Paid status', () => {
        const validData = { status: OrderStatus.Paid }
        const result = UpdateOrderBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(OrderStatus.Paid)
        }
      })

      it('should accept Rejected status', () => {
        const validData = { status: OrderStatus.Rejected }
        const result = UpdateOrderBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(OrderStatus.Rejected)
        }
      })

      it('should reject invalid status', () => {
        const invalidData = { status: 'InvalidStatus' as any }
        const result = UpdateOrderBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['status'])
        }
      })
    })

    it('should require status field', () => {
      const result = UpdateOrderBody.safeParse({})

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['status'])
      }
    })
  })

  describe('PayGuestOrdersBody', () => {
    const validPaymentData: PayGuestOrdersBodyType = {
      guestId: 1
    }

    it('should validate correct payment data', () => {
      const result = PayGuestOrdersBody.safeParse(validPaymentData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.guestId).toBe(1)
      }
    })

    describe('Guest ID Validation', () => {
      it('should accept valid guest ID', () => {
        const validData = { guestId: 999 }
        const result = PayGuestOrdersBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.guestId).toBe(999)
        }
      })

      it('should reject negative guest ID', () => {
        const invalidData = { guestId: -1 }
        const result = PayGuestOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['guestId'])
        }
      })

      it('should reject zero guest ID', () => {
        const invalidData = { guestId: 0 }
        const result = PayGuestOrdersBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['guestId'])
        }
      })

      it('should coerce string guest ID to number', () => {
        const dataWithStringId = { guestId: '123' as any }
        const result = PayGuestOrdersBody.safeParse(dataWithStringId)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.guestId).toBe(123)
          expect(typeof result.data.guestId).toBe('number')
        }
      })
    })

    it('should require guestId field', () => {
      const result = PayGuestOrdersBody.safeParse({})

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['guestId'])
      }
    })
  })

  describe('OrderSchema', () => {
    const validOrderSchema = {
      id: 1,
      guestId: 1,
      guest: {
        id: 1,
        name: 'Nguyen Van A',
        tableNumber: 5,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      tableNumber: 5,
      dishSnapshotId: 1,
      dishSnapshot: {
        id: 1,
        name: 'Phở Bò',
        price: 85000,
        image: 'https://example.com/pho-bo.jpg',
        description: 'Phở bò truyền thống',
        status: 'Available' as any,
        dishId: 1,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      quantity: 2,
      orderHandlerId: 1,
      orderHandler: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Owner' as any,
        avatar: null,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      status: OrderStatus.Pending,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z')
    }

    it('should validate complete order schema', () => {
      const result = OrderSchema.safeParse(validOrderSchema)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(1)
        expect(result.data.guestId).toBe(1)
        expect(result.data.tableNumber).toBe(5)
        expect(result.data.quantity).toBe(2)
        expect(result.data.status).toBe(OrderStatus.Pending)
      }
    })

    it('should allow null values for nullable fields', () => {
      const dataWithNulls = {
        ...validOrderSchema,
        guestId: null,
        guest: null,
        tableNumber: null,
        orderHandlerId: null,
        orderHandler: null
      }
      const result = OrderSchema.safeParse(dataWithNulls)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.guestId).toBeNull()
        expect(result.data.guest).toBeNull()
        expect(result.data.tableNumber).toBeNull()
        expect(result.data.orderHandlerId).toBeNull()
        expect(result.data.orderHandler).toBeNull()
      }
    })

    it('should validate nested guest object', () => {
      const dataWithInvalidGuest = {
        ...validOrderSchema,
        guest: {
          ...validOrderSchema.guest,
          id: 'invalid' // Should be number
        }
      }
      const result = OrderSchema.safeParse(dataWithInvalidGuest)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['guest', 'id'])
      }
    })

    it('should validate nested dish snapshot object', () => {
      const dataWithInvalidDishSnapshot = {
        ...validOrderSchema,
        dishSnapshot: {
          ...validOrderSchema.dishSnapshot,
          price: -1000 // Invalid price
        }
      }
      const result = OrderSchema.safeParse(dataWithInvalidDishSnapshot)

      expect(result.success).toBe(false)
    })

    it('should require all non-nullable fields', () => {
      const { id, ...dataWithoutId } = validOrderSchema
      const result = OrderSchema.safeParse(dataWithoutId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })
  })

  describe('GetOrdersRes', () => {
    it('should validate orders list response structure', () => {
      const validResponse = {
        data: [
          {
            id: 1,
            guestId: 1,
            guest: {
              id: 1,
              name: 'Nguyen Van A',
              tableNumber: 5,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            tableNumber: 5,
            dishSnapshotId: 1,
            dishSnapshot: {
              id: 1,
              name: 'Phở Bò',
              price: 85000,
              image: 'https://example.com/pho-bo.jpg',
              description: 'Phở bò truyền thống',
              status: 'Available' as any,
              dishId: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            quantity: 2,
            orderHandlerId: null,
            orderHandler: null,
            status: OrderStatus.Pending,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        message: 'Orders retrieved successfully'
      }

      const result = GetOrdersRes.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should accept empty orders array', () => {
      const validResponse = {
        data: [],
        message: 'No orders found'
      }

      const result = GetOrdersRes.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should require both data and message fields', () => {
      const invalidResponse = {
        data: []
        // missing message
      }

      const result = GetOrdersRes.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })
})

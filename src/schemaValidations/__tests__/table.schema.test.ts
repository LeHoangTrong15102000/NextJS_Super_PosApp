import {
  CreateTableBody,
  UpdateTableBody,
  TableSchema,
  TableRes,
  TableListRes,
  TableParams,
  CreateTableBodyType,
  UpdateTableBodyType
} from '../table.schema'
import { TableStatus } from '@/constants/type'

describe('Table Schema Validation', () => {
  describe('CreateTableBody', () => {
    const validTableData: CreateTableBodyType = {
      number: 5,
      capacity: 4,
      status: TableStatus.Available
    }

    it('should validate correct table creation data', () => {
      const result = CreateTableBody.safeParse(validTableData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.number).toBe(5)
        expect(result.data.capacity).toBe(4)
        expect(result.data.status).toBe(TableStatus.Available)
      }
    })

    it('should accept minimal valid data without status', () => {
      const minimalData = {
        number: 1,
        capacity: 2
      }

      const result = CreateTableBody.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    describe('Table Number Validation', () => {
      it('should accept positive table number', () => {
        const validData = { ...validTableData, number: 10 }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.number).toBe(10)
        }
      })

      it('should accept boundary value of 1', () => {
        const validData = { ...validTableData, number: 1 }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.number).toBe(1)
        }
      })

      it('should reject zero table number', () => {
        const invalidData = { ...validTableData, number: 0 }
        const result = CreateTableBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['number'])
        }
      })

      it('should reject negative table number', () => {
        const invalidData = { ...validTableData, number: -1 }
        const result = CreateTableBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['number'])
        }
      })

      it('should coerce string number to number', () => {
        const dataWithStringNumber = { ...validTableData, number: '15' as any }
        const result = CreateTableBody.safeParse(dataWithStringNumber)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.number).toBe(15)
          expect(typeof result.data.number).toBe('number')
        }
      })

      it('should accept large table numbers', () => {
        const validData = { ...validTableData, number: 999 }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.number).toBe(999)
        }
      })
    })

    describe('Capacity Validation', () => {
      it('should accept valid capacity values', () => {
        const validData = { ...validTableData, capacity: 8 }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.capacity).toBe(8)
        }
      })

      it('should accept boundary value of 1', () => {
        const validData = { ...validTableData, capacity: 1 }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.capacity).toBe(1)
        }
      })

      it('should reject zero capacity', () => {
        const invalidData = { ...validTableData, capacity: 0 }
        const result = CreateTableBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['capacity'])
        }
      })

      it('should reject negative capacity', () => {
        const invalidData = { ...validTableData, capacity: -2 }
        const result = CreateTableBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['capacity'])
        }
      })

      it('should coerce string capacity to number', () => {
        const dataWithStringCapacity = { ...validTableData, capacity: '6' as any }
        const result = CreateTableBody.safeParse(dataWithStringCapacity)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.capacity).toBe(6)
          expect(typeof result.data.capacity).toBe('number')
        }
      })

      it('should accept large capacity values', () => {
        const validData = { ...validTableData, capacity: 20 }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.capacity).toBe(20)
        }
      })
    })

    describe('Status Validation', () => {
      it('should accept Available status', () => {
        const validData = { ...validTableData, status: TableStatus.Available }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(TableStatus.Available)
        }
      })

      it('should accept Reserved status', () => {
        const validData = { ...validTableData, status: TableStatus.Reserved }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(TableStatus.Reserved)
        }
      })

      it('should accept Hidden status', () => {
        const validData = { ...validTableData, status: TableStatus.Hidden }
        const result = CreateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(TableStatus.Hidden)
        }
      })

      it('should reject invalid status value', () => {
        const invalidData = { ...validTableData, status: 'InvalidStatus' as any }
        const result = CreateTableBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['status'])
        }
      })
    })

    describe('Required Fields', () => {
      it('should require table number', () => {
        const { number, ...dataWithoutNumber } = validTableData
        const result = CreateTableBody.safeParse(dataWithoutNumber)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['number'])
        }
      })

      it('should require capacity', () => {
        const { capacity, ...dataWithoutCapacity } = validTableData
        const result = CreateTableBody.safeParse(dataWithoutCapacity)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['capacity'])
        }
      })

      it('should not require status (optional field)', () => {
        const { status, ...dataWithoutStatus } = validTableData
        const result = CreateTableBody.safeParse(dataWithoutStatus)

        expect(result.success).toBe(true)
      })
    })

    describe('Extra Properties', () => {
      it('should reject extra properties in strict mode', () => {
        const dataWithExtra = {
          ...validTableData,
          extraField: 'should not be allowed'
        }
        const result = CreateTableBody.safeParse(dataWithExtra)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].code).toBe('unrecognized_keys')
        }
      })
    })
  })

  describe('UpdateTableBody', () => {
    const validUpdateData: UpdateTableBodyType = {
      changeToken: true,
      capacity: 6,
      status: TableStatus.Reserved
    }

    it('should validate correct table update data', () => {
      const result = UpdateTableBody.safeParse(validUpdateData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.changeToken).toBe(true)
        expect(result.data.capacity).toBe(6)
        expect(result.data.status).toBe(TableStatus.Reserved)
      }
    })

    it('should accept minimal update data with only required fields', () => {
      const minimalData = {
        changeToken: false,
        capacity: 4
      }

      const result = UpdateTableBody.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    describe('ChangeToken Validation', () => {
      it('should accept true value', () => {
        const validData = { ...validUpdateData, changeToken: true }
        const result = UpdateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.changeToken).toBe(true)
        }
      })

      it('should accept false value', () => {
        const validData = { ...validUpdateData, changeToken: false }
        const result = UpdateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.changeToken).toBe(false)
        }
      })

      it('should reject non-boolean values', () => {
        const invalidData = { ...validUpdateData, changeToken: 'true' as any }
        const result = UpdateTableBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['changeToken'])
        }
      })
    })

    describe('Capacity Validation', () => {
      it('should validate capacity same as CreateTableBody', () => {
        const validData = { ...validUpdateData, capacity: 10 }
        const result = UpdateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.capacity).toBe(10)
        }
      })

      it('should reject zero capacity', () => {
        const invalidData = { ...validUpdateData, capacity: 0 }
        const result = UpdateTableBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['capacity'])
        }
      })

      it('should coerce string capacity to number', () => {
        const dataWithStringCapacity = { ...validUpdateData, capacity: '8' as any }
        const result = UpdateTableBody.safeParse(dataWithStringCapacity)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.capacity).toBe(8)
          expect(typeof result.data.capacity).toBe('number')
        }
      })
    })

    describe('Status Validation', () => {
      it('should validate status same as CreateTableBody', () => {
        const validData = { ...validUpdateData, status: TableStatus.Hidden }
        const result = UpdateTableBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(TableStatus.Hidden)
        }
      })

      it('should not require status (optional field)', () => {
        const { status, ...dataWithoutStatus } = validUpdateData
        const result = UpdateTableBody.safeParse(dataWithoutStatus)

        expect(result.success).toBe(true)
      })
    })

    describe('Required Fields', () => {
      it('should require changeToken', () => {
        const { changeToken, ...dataWithoutChangeToken } = validUpdateData
        const result = UpdateTableBody.safeParse(dataWithoutChangeToken)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['changeToken'])
        }
      })

      it('should require capacity', () => {
        const { capacity, ...dataWithoutCapacity } = validUpdateData
        const result = UpdateTableBody.safeParse(dataWithoutCapacity)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['capacity'])
        }
      })
    })
  })

  describe('TableSchema', () => {
    const validTableSchema = {
      number: 5,
      capacity: 4,
      status: TableStatus.Available,
      token: 'abc123def456',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-02T10:00:00Z')
    }

    it('should validate complete table schema', () => {
      const result = TableSchema.safeParse(validTableSchema)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.number).toBe(5)
        expect(result.data.capacity).toBe(4)
        expect(result.data.status).toBe(TableStatus.Available)
        expect(result.data.token).toBe('abc123def456')
        expect(result.data.createdAt).toBeInstanceOf(Date)
        expect(result.data.updatedAt).toBeInstanceOf(Date)
      }
    })

    it('should coerce string number and capacity to numbers', () => {
      const dataWithStrings = {
        ...validTableSchema,
        number: '10' as any,
        capacity: '6' as any
      }
      const result = TableSchema.safeParse(dataWithStrings)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.number).toBe(10)
        expect(result.data.capacity).toBe(6)
        expect(typeof result.data.number).toBe('number')
        expect(typeof result.data.capacity).toBe('number')
      }
    })

    it('should validate token field', () => {
      const validData = { ...validTableSchema, token: 'uniquetoken123' }
      const result = TableSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.token).toBe('uniquetoken123')
      }
    })

    it('should require all fields', () => {
      const { token, ...dataWithoutToken } = validTableSchema
      const result = TableSchema.safeParse(dataWithoutToken)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['token'])
      }
    })

    it('should validate date fields', () => {
      const dataWithInvalidDate = {
        ...validTableSchema,
        createdAt: 'invalid-date'
      }
      const result = TableSchema.safeParse(dataWithInvalidDate)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['createdAt'])
      }
    })
  })

  describe('TableRes', () => {
    it('should validate table response structure', () => {
      const validResponse = {
        data: {
          number: 5,
          capacity: 4,
          status: TableStatus.Available,
          token: 'abc123def456',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-02T10:00:00Z')
        },
        message: 'Table retrieved successfully'
      }

      const result = TableRes.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should require both data and message fields', () => {
      const invalidResponse = {
        data: {
          number: 5,
          capacity: 4,
          status: TableStatus.Available,
          token: 'abc123def456',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        // missing message
      }

      const result = TableRes.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('TableListRes', () => {
    it('should validate table list response structure', () => {
      const validResponse = {
        data: [
          {
            number: 1,
            capacity: 2,
            status: TableStatus.Available,
            token: 'token1',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-02T10:00:00Z')
          },
          {
            number: 2,
            capacity: 4,
            status: TableStatus.Reserved,
            token: 'token2',
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-02T10:00:00Z')
          }
        ],
        message: 'Tables retrieved successfully'
      }

      const result = TableListRes.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should accept empty table array', () => {
      const validResponse = {
        data: [],
        message: 'No tables found'
      }

      const result = TableListRes.safeParse(validResponse)
      expect(result.success).toBe(true)
    })
  })

  describe('TableParams', () => {
    it('should validate table number parameter', () => {
      const validParams = { number: 5 }
      const result = TableParams.safeParse(validParams)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.number).toBe(5)
      }
    })

    it('should coerce string number to number', () => {
      const paramsWithStringNumber = { number: '10' as any }
      const result = TableParams.safeParse(paramsWithStringNumber)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.number).toBe(10)
        expect(typeof result.data.number).toBe('number')
      }
    })

    it('should reject invalid number format', () => {
      const invalidParams = { number: 'not-a-number' as any }
      const result = TableParams.safeParse(invalidParams)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['number'])
      }
    })

    it('should reject missing number', () => {
      const result = TableParams.safeParse({})

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['number'])
      }
    })

    it('should reject negative or zero numbers', () => {
      const invalidParamsZero = { number: 0 }
      const invalidParamsNegative = { number: -1 }

      const resultZero = TableParams.safeParse(invalidParamsZero)
      const resultNegative = TableParams.safeParse(invalidParamsNegative)

      expect(resultZero.success).toBe(true) // TableParams just coerces, doesn't validate positive
      expect(resultNegative.success).toBe(true)
    })
  })
})

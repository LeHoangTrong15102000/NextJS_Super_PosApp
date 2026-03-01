import {
  CreateDishBody,
  UpdateDishBody,
  DishSchema,
  DishRes,
  DishListRes,
  DishParams,
  CreateDishBodyType
} from '../dish.schema'
import { DishStatus } from '@/constants/type'

describe('Dish Schema Validation', () => {
  describe('CreateDishBody', () => {
    const validDishData: CreateDishBodyType = {
      name: 'Phở Bò Tái',
      price: 85000,
      description: 'Phở bò tái với thịt tươi ngon',
      image: 'https://example.com/pho-bo-tai.jpg',
      status: DishStatus.Available
    }

    it('should validate correct dish data', () => {
      const result = CreateDishBody.safeParse(validDishData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Phở Bò Tái')
        expect(result.data.price).toBe(85000)
        expect(result.data.status).toBe(DishStatus.Available)
      }
    })

    it('should accept minimal valid data without status', () => {
      const minimalData = {
        name: 'Cơm tấm',
        price: 50000,
        description: 'Cơm tấm sườn nướng',
        image: 'https://example.com/com-tam.jpg'
      }

      const result = CreateDishBody.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    describe('Name Validation', () => {
      it('should reject empty name', () => {
        const invalidData = { ...validDishData, name: '' }
        const result = CreateDishBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['name'])
        }
      })

      it('should reject name longer than 256 characters', () => {
        const longName = 'a'.repeat(257)
        const invalidData = { ...validDishData, name: longName }
        const result = CreateDishBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['name'])
        }
      })

      it('should accept name with 256 characters (boundary)', () => {
        const boundaryName = 'a'.repeat(256)
        const validData = { ...validDishData, name: boundaryName }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should accept name with 1 character (boundary)', () => {
        const validData = { ...validDishData, name: 'A' }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })
    })

    describe('Price Validation', () => {
      it('should coerce string number to number', () => {
        const dataWithStringPrice = { ...validDishData, price: '100000' as any }
        const result = CreateDishBody.safeParse(dataWithStringPrice)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.price).toBe(100000)
          expect(typeof result.data.price).toBe('number')
        }
      })

      it('should reject negative price', () => {
        const invalidData = { ...validDishData, price: -1000 }
        const result = CreateDishBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['price'])
        }
      })

      it('should reject zero price', () => {
        const invalidData = { ...validDishData, price: 0 }
        const result = CreateDishBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['price'])
        }
      })

      it('should accept positive price (boundary)', () => {
        const validData = { ...validDishData, price: 1 }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should accept large price values', () => {
        const validData = { ...validDishData, price: 999999999 }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })
    })

    describe('Description Validation', () => {
      it('should accept empty description', () => {
        const validData = { ...validDishData, description: '' }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should accept description with 10000 characters (boundary)', () => {
        const maxDescription = 'a'.repeat(10000)
        const validData = { ...validDishData, description: maxDescription }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should reject description longer than 10000 characters', () => {
        const longDescription = 'a'.repeat(10001)
        const invalidData = { ...validDishData, description: longDescription }
        const result = CreateDishBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['description'])
        }
      })

      it('should handle special characters in description', () => {
        const specialCharsDescription = 'Món ăn đặc biệt với gia vị: !@#$%^&*()_+{}|:"<>?'
        const validData = { ...validDishData, description: specialCharsDescription }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })
    })

    describe('Image URL Validation', () => {
      it('should accept valid HTTP URL', () => {
        const validData = { ...validDishData, image: 'http://example.com/image.jpg' }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should accept valid HTTPS URL', () => {
        const validData = { ...validDishData, image: 'https://example.com/image.jpg' }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })

      it('should reject invalid URL format', () => {
        const invalidData = { ...validDishData, image: 'not-a-url' }
        const result = CreateDishBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['image'])
        }
      })

      it('should reject empty string as image URL', () => {
        const invalidData = { ...validDishData, image: '' }
        const result = CreateDishBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['image'])
        }
      })

      it('should accept URL with query parameters', () => {
        const validData = { ...validDishData, image: 'https://example.com/image.jpg?width=300&height=200' }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
      })
    })

    describe('Status Validation', () => {
      it('should accept Available status', () => {
        const validData = { ...validDishData, status: DishStatus.Available }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(DishStatus.Available)
        }
      })

      it('should accept Unavailable status', () => {
        const validData = { ...validDishData, status: DishStatus.Unavailable }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(DishStatus.Unavailable)
        }
      })

      it('should accept Hidden status', () => {
        const validData = { ...validDishData, status: DishStatus.Hidden }
        const result = CreateDishBody.safeParse(validData)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe(DishStatus.Hidden)
        }
      })

      it('should reject invalid status value', () => {
        const invalidData = { ...validDishData, status: 'InvalidStatus' as any }
        const result = CreateDishBody.safeParse(invalidData)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['status'])
        }
      })
    })

    describe('Required Fields', () => {
      it('should reject missing name', () => {
        const { name, ...dataWithoutName } = validDishData
        const result = CreateDishBody.safeParse(dataWithoutName)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['name'])
        }
      })

      it('should reject missing price', () => {
        const { price, ...dataWithoutPrice } = validDishData
        const result = CreateDishBody.safeParse(dataWithoutPrice)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['price'])
        }
      })

      it('should reject missing description', () => {
        const { description, ...dataWithoutDescription } = validDishData
        const result = CreateDishBody.safeParse(dataWithoutDescription)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['description'])
        }
      })

      it('should reject missing image', () => {
        const { image, ...dataWithoutImage } = validDishData
        const result = CreateDishBody.safeParse(dataWithoutImage)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(['image'])
        }
      })
    })

    describe('Extra Properties', () => {
      it('should strip extra properties', () => {
        const dataWithExtra = {
          ...validDishData,
          extraField: 'should be stripped'
        }
        const result = CreateDishBody.safeParse(dataWithExtra)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).not.toHaveProperty('extraField')
        }
      })
    })
  })

  describe('UpdateDishBody', () => {
    it('should have same validation as CreateDishBody', () => {
      const validData = {
        name: 'Updated Dish Name',
        price: 120000,
        description: 'Updated description',
        image: 'https://example.com/updated-image.jpg',
        status: DishStatus.Unavailable
      }

      const createResult = CreateDishBody.safeParse(validData)
      const updateResult = UpdateDishBody.safeParse(validData)

      expect(createResult.success).toBe(true)
      expect(updateResult.success).toBe(true)
      expect(
        createResult.success &&
          updateResult.success &&
          JSON.stringify(createResult.data) === JSON.stringify(updateResult.data)
      ).toBe(true)
    })
  })

  describe('DishSchema', () => {
    const validDishSchema = {
      id: 1,
      name: 'Phở Bò',
      price: 85000,
      description: 'Phở bò truyền thống',
      image: 'https://example.com/pho-bo.jpg',
      status: DishStatus.Available,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-02T10:00:00Z')
    }

    it('should validate complete dish schema', () => {
      const result = DishSchema.safeParse(validDishSchema)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(1)
        expect(result.data.name).toBe('Phở Bò')
        expect(result.data.price).toBe(85000)
        expect(result.data.status).toBe(DishStatus.Available)
        expect(result.data.createdAt).toBeInstanceOf(Date)
        expect(result.data.updatedAt).toBeInstanceOf(Date)
      }
    })

    it('should coerce string price to number', () => {
      const dataWithStringPrice = { ...validDishSchema, price: '85000' as any }
      const result = DishSchema.safeParse(dataWithStringPrice)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.price).toBe(85000)
        expect(typeof result.data.price).toBe('number')
      }
    })

    it('should require all fields', () => {
      const { id, ...dataWithoutId } = validDishSchema
      const result = DishSchema.safeParse(dataWithoutId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should validate date fields', () => {
      const dataWithInvalidDate = {
        ...validDishSchema,
        createdAt: 'invalid-date'
      }
      const result = DishSchema.safeParse(dataWithInvalidDate)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['createdAt'])
      }
    })
  })

  describe('DishRes', () => {
    it('should validate dish response structure', () => {
      const validResponse = {
        data: {
          id: 1,
          name: 'Phở Bò',
          price: 85000,
          description: 'Phở bò truyền thống',
          image: 'https://example.com/pho-bo.jpg',
          status: DishStatus.Available,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-02T10:00:00Z')
        },
        message: 'Dish retrieved successfully'
      }

      const result = DishRes.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should require both data and message fields', () => {
      const invalidResponse = {
        data: {
          id: 1,
          name: 'Phở Bò',
          price: 85000,
          description: 'Phở bò truyền thống',
          image: 'https://example.com/pho-bo.jpg',
          status: DishStatus.Available,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        // missing message
      }

      const result = DishRes.safeParse(invalidResponse)
      expect(result.success).toBe(false)
    })
  })

  describe('DishListRes', () => {
    it('should validate dish list response structure', () => {
      const validResponse = {
        data: [
          {
            id: 1,
            name: 'Phở Bò',
            price: 85000,
            description: 'Phở bò truyền thống',
            image: 'https://example.com/pho-bo.jpg',
            status: DishStatus.Available,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-02T10:00:00Z')
          },
          {
            id: 2,
            name: 'Cơm tấm',
            price: 50000,
            description: 'Cơm tấm sườn nướng',
            image: 'https://example.com/com-tam.jpg',
            status: DishStatus.Available,
            createdAt: new Date('2024-01-01T10:00:00Z'),
            updatedAt: new Date('2024-01-02T10:00:00Z')
          }
        ],
        message: 'Dishes retrieved successfully'
      }

      const result = DishListRes.safeParse(validResponse)
      expect(result.success).toBe(true)
    })

    it('should accept empty dish array', () => {
      const validResponse = {
        data: [],
        message: 'No dishes found'
      }

      const result = DishListRes.safeParse(validResponse)
      expect(result.success).toBe(true)
    })
  })

  describe('DishParams', () => {
    it('should validate dish ID parameter', () => {
      const validParams = { id: 123 }
      const result = DishParams.safeParse(validParams)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(123)
      }
    })

    it('should coerce string ID to number', () => {
      const paramsWithStringId = { id: '123' as any }
      const result = DishParams.safeParse(paramsWithStringId)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(123)
        expect(typeof result.data.id).toBe('number')
      }
    })

    it('should reject invalid ID format', () => {
      const invalidParams = { id: 'not-a-number' as any }
      const result = DishParams.safeParse(invalidParams)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })

    it('should reject missing ID', () => {
      const result = DishParams.safeParse({})

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['id'])
      }
    })
  })
})

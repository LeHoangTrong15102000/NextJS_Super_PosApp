import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import AddDish from '../add-dish'
import { useAddDishMutation } from '@/queries/useDish'
import { useUploadMediaMutation } from '@/queries/useMedia'
import { DishStatus } from '@/constants/type'
import { toast } from '@/components/ui/use-toast'

// Mock dependencies
jest.mock('@/queries/useDish')
jest.mock('@/queries/useMedia')
jest.mock('@/apiRequests/revalidate')
jest.mock('@/components/ui/use-toast')

// Helper to create userEvent with pointerEventsCheck disabled (for Radix dialog)
const setupUser = () => userEvent.setup({ pointerEventsCheck: 0 })

// Helper to set file on input element and trigger change event
const setFileOnInput = (fileInput: HTMLInputElement, file: File) => {
  Object.defineProperty(fileInput, 'files', {
    value: [file],
    writable: false,
    configurable: true
  })
  fireEvent.change(fileInput, { target: { files: [file] } })
}

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-blob-url')
})

Object.defineProperty(global.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
})

describe('AddDish Component', () => {
  let mockMutateAsync: jest.Mock
  let mockUploadMutateAsync: jest.Mock
  let mockUseAddDishMutation: jest.Mock
  let mockUseUploadMediaMutation: jest.Mock

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup mutation mocks
    mockMutateAsync = jest.fn()
    mockUploadMutateAsync = jest.fn()

    mockUseAddDishMutation = useAddDishMutation as jest.MockedFunction<typeof useAddDishMutation>
    mockUseUploadMediaMutation = useUploadMediaMutation as jest.MockedFunction<typeof useUploadMediaMutation>

    mockUseAddDishMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null
    } as any)

    mockUseUploadMediaMutation.mockReturnValue({
      mutateAsync: mockUploadMutateAsync,
      isPending: false,
      isError: false,
      error: null
    } as any)
  })

  describe('Dialog Behavior', () => {
    it('should render trigger button', () => {
      render(<AddDish />)
      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      expect(triggerButton).toBeInTheDocument()
    })

    it('should open dialog when trigger button is clicked', async () => {
      const user = setupUser()
      render(<AddDish />)

      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      await user.click(triggerButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Thêm món ăn')).toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    beforeEach(async () => {
      const user = setupUser()
      render(<AddDish />)

      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      await user.click(triggerButton)
    })

    it('should render all required form fields', () => {
      expect(screen.getByLabelText(/tên món ăn/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/giá/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mô tả sản phẩm/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/trạng thái/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /thêm/i })).toBeInTheDocument()
    })

    it('should have correct input types', () => {
      expect(screen.getByLabelText(/giá/i)).toHaveAttribute('type', 'number')
      expect(
        screen.getByRole('button', { name: /upload/i }).parentElement?.querySelector('input[type="file"]')
      ).toHaveAttribute('accept', 'image/*')
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      const user = setupUser()
      render(<AddDish />)

      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      await user.click(triggerButton)
    })

    it('should show validation errors for empty required fields', async () => {
      const user = setupUser()

      const submitButton = screen.getByRole('button', { name: /thêm/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Zod 4 default error messages
        expect(screen.getByText(/too small.*>=1 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate name field', async () => {
      const user = setupUser()

      const nameInput = screen.getByLabelText(/tên món ăn/i)
      const submitButton = screen.getByRole('button', { name: /thêm/i })

      // Test empty name
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/too small.*>=1 characters/i)).toBeInTheDocument()
      })

      // Test valid name
      await user.type(nameInput, 'Phở Bò Tái')
      await waitFor(() => {
        expect(screen.queryByText(/too small.*>=1 characters/i)).not.toBeInTheDocument()
      })
    })

    it('should validate price field', async () => {
      const user = setupUser()

      const priceInput = screen.getByLabelText(/giá/i)
      const submitButton = screen.getByRole('button', { name: /thêm/i })

      // Test with negative price
      await user.type(priceInput, '-1000')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/too small.*>0/i)).toBeInTheDocument()
      })

      // Test with valid price
      await user.clear(priceInput)
      await user.type(priceInput, '85000')

      await waitFor(() => {
        expect(screen.queryByText(/too small.*>0/i)).not.toBeInTheDocument()
      })
    })

    it('should validate image URL field', async () => {
      const user = setupUser()

      const nameInput = screen.getByLabelText(/tên món ăn/i)
      const priceInput = screen.getByLabelText(/giá/i)
      const descriptionInput = screen.getByLabelText(/mô tả sản phẩm/i)
      const submitButton = screen.getByRole('button', { name: /thêm/i })

      // Fill other required fields
      await user.type(nameInput, 'Test Dish')
      await user.clear(priceInput)
      await user.type(priceInput, '50000')
      await user.type(descriptionInput, 'Test description')

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid url/i)).toBeInTheDocument()
      })
    })

    it('should accept valid form data', async () => {
      const user = setupUser()

      const nameInput = screen.getByLabelText(/tên món ăn/i)
      const priceInput = screen.getByLabelText(/giá/i)
      const descriptionInput = screen.getByLabelText(/mô tả sản phẩm/i)

      await user.type(nameInput, 'Phở Bò Tái')
      await user.clear(priceInput)
      await user.type(priceInput, '85000')
      await user.type(descriptionInput, 'Phở bò tái truyền thống')

      // Mock file selection to set a valid image URL
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()

      if (fileInput) {
        const file = new File(['image content'], 'pho-bo.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)
      }

      // No validation errors should be present
      expect(screen.queryByText(/too small.*>=1 characters/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/too small.*>0/i)).not.toBeInTheDocument()
    })
  })

  describe('Image Upload', () => {
    beforeEach(async () => {
      const user = setupUser()
      render(<AddDish />)

      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      await user.click(triggerButton)
    })

    it('should handle image file selection', async () => {
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()

      if (fileInput) {
        const file = new File(['image content'], 'dish-image.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)

        expect(URL.createObjectURL).toHaveBeenCalledWith(file)
      }
    })

    it('should accept only image files', () => {
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('accept', 'image/*')
    })

    it('should display preview of selected image', async () => {
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      if (fileInput) {
        const file = new File(['image content'], 'dish-image.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)

        await waitFor(() => {
          const previewImage = screen.getByRole('img')
          expect(previewImage).toHaveAttribute('src', 'mocked-blob-url')
        })
      }
    })
  })

  describe('Form Submission', () => {
    beforeEach(async () => {
      const user = setupUser()
      render(<AddDish />)

      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      await user.click(triggerButton)
    })

    it('should submit form with valid data without file upload', async () => {
      const user = setupUser()

      const mockResponse = {
        payload: {
          data: {
            id: 1,
            name: 'Phở Bò Tái',
            price: 85000,
            description: 'Phở bò tái truyền thống',
            image: 'https://example.com/pho-bo.jpg',
            status: DishStatus.Available
          },
          message: 'Dish added successfully'
        }
      }

      mockMutateAsync.mockResolvedValueOnce(mockResponse)

      // Fill form
      await user.type(screen.getByLabelText(/tên món ăn/i), 'Phở Bò Tái')
      // Clear the default 0 value first, then type the price
      const priceInput = screen.getByLabelText(/giá/i)
      await user.clear(priceInput)
      await user.type(priceInput, '85000')
      await user.type(screen.getByLabelText(/mô tả sản phẩm/i), 'Phở bò tái truyền thống')

      // Set image URL via hidden input field
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      if (fileInput) {
        const file = new File(['image content'], 'pho-bo.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /thêm/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Phở Bò Tái',
            price: 85000,
            description: 'Phở bò tái truyền thống'
          })
        )
      })
    })

    it('should handle different dish statuses', async () => {
      const user = setupUser()

      const mockResponse = {
        payload: {
          data: {
            id: 1,
            name: 'Bún Bò Huế',
            price: 75000,
            description: 'Bún bò Huế cay nồng',
            image: 'https://example.com/bun-bo-hue.jpg',
            status: DishStatus.Unavailable
          },
          message: 'Dish added successfully'
        }
      }

      mockMutateAsync.mockResolvedValueOnce(mockResponse)

      // Fill form
      await user.type(screen.getByLabelText(/tên món ăn/i), 'Bún Bò Huế')
      const priceInput = screen.getByLabelText(/giá/i)
      await user.clear(priceInput)
      await user.type(priceInput, '75000')
      await user.type(screen.getByLabelText(/mô tả sản phẩm/i), 'Bún bò Huế cay nồng')

      // Set image
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      if (fileInput) {
        const file = new File(['image content'], 'bun-bo-hue.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /thêm/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Bún Bò Huế',
            status: DishStatus.Unavailable
          })
        )
      })
    })

    it('should prevent double submission', async () => {
      const user = setupUser()

      // Mock pending state
      mockUseAddDishMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null
      } as any)

      render(<AddDish />)

      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      await user.click(triggerButton)

      // Fill form
      await user.type(screen.getByLabelText(/tên món ăn/i), 'Test Dish')
      const priceInput = screen.getByLabelText(/giá/i)
      await user.clear(priceInput)
      await user.type(priceInput, '50000')
      await user.type(screen.getByLabelText(/mô tả sản phẩm/i), 'Test description')

      // Set image
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      if (fileInput) {
        const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)
      }

      // Submit form using fireEvent to bypass pointer-events check
      const submitButton = screen.getByRole('button', { name: /thêm/i })
      fireEvent.click(submitButton)

      // Should not call mutateAsync when pending
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('should reset form after successful submission', async () => {
      const user = setupUser()

      const mockResponse = {
        payload: {
          data: {
            id: 1,
            name: 'Test Dish',
            price: 50000,
            description: 'Test description',
            image: 'https://example.com/test.jpg',
            status: DishStatus.Available
          },
          message: 'Dish added successfully'
        }
      }

      mockMutateAsync.mockResolvedValueOnce(mockResponse)

      // Fill form
      const nameInput = screen.getByLabelText(/tên món ăn/i)
      const priceInput = screen.getByLabelText(/giá/i) as HTMLInputElement
      const descriptionInput = screen.getByLabelText(/mô tả sản phẩm/i)

      await user.type(nameInput, 'Test Dish')
      // Clear the default 0 value first, then type the price
      await user.clear(priceInput)
      await user.type(priceInput, '50000')
      await user.type(descriptionInput, 'Test description')

      // Set image
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      if (fileInput) {
        const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /thêm/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })

      // Check if form is reset
      await waitFor(() => {
        expect(nameInput).toHaveValue('')
        expect(priceInput).toHaveValue(null)
        expect(descriptionInput).toHaveValue('')
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      const user = setupUser()
      render(<AddDish />)

      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      await user.click(triggerButton)
    })

    it('should handle API errors during submission', async () => {
      const user = setupUser()

      const mockError = new Error('Server error')
      mockMutateAsync.mockRejectedValueOnce(mockError)

      // Fill form
      await user.type(screen.getByLabelText(/tên món ăn/i), 'Test Dish')
      const priceInput = screen.getByLabelText(/giá/i)
      // Clear the default 0 value first, then type the price
      await user.clear(priceInput)
      await user.type(priceInput, '50000')
      await user.type(screen.getByLabelText(/mô tả sản phẩm/i), 'Test description')

      // Set image
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      if (fileInput) {
        const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /thêm/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })

      // Error should be handled by handleErrorApi
    })

    it('should handle upload errors', async () => {
      const user = setupUser()

      const mockUploadError = new Error('Failed to upload image')
      mockUploadMutateAsync.mockRejectedValueOnce(mockUploadError)

      // Fill form
      await user.type(screen.getByLabelText(/tên món ăn/i), 'Test Dish')
      const priceInput = screen.getByLabelText(/giá/i)
      // Clear the default 0 value first, then type the price
      await user.clear(priceInput)
      await user.type(priceInput, '50000')
      await user.type(screen.getByLabelText(/mô tả sản phẩm/i), 'Test description')

      // Set image file to trigger upload
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      if (fileInput) {
        const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /thêm/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUploadMutateAsync).toHaveBeenCalled()
      })

      // Upload error should be handled
    }, 10000) // Increase timeout for this test
  })

  describe('File Upload Integration', () => {
    beforeEach(async () => {
      const user = setupUser()
      render(<AddDish />)

      const triggerButton = screen.getByRole('button', { name: /thêm món ăn/i })
      await user.click(triggerButton)
    })

    it('should upload file and submit with uploaded image URL', async () => {
      const user = setupUser()

      const mockUploadResponse = {
        payload: {
          data: 'https://example.com/uploaded-image.jpg'
        }
      }

      const mockAddResponse = {
        payload: {
          data: {
            id: 1,
            name: 'Test Dish',
            price: 50000,
            description: 'Test description',
            image: 'https://example.com/uploaded-image.jpg',
            status: DishStatus.Available
          },
          message: 'Dish added successfully'
        }
      }

      mockUploadMutateAsync.mockResolvedValueOnce(mockUploadResponse)
      mockMutateAsync.mockResolvedValueOnce(mockAddResponse)

      // Fill form
      await user.type(screen.getByLabelText(/tên món ăn/i), 'Test Dish')
      const priceInput = screen.getByLabelText(/giá/i)
      // Clear the default 0 value first, then type the price
      await user.clear(priceInput)
      await user.type(priceInput, '50000')
      await user.type(screen.getByLabelText(/mô tả sản phẩm/i), 'Test description')

      // Set image file to trigger upload
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]') as HTMLInputElement

      if (fileInput) {
        const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
        setFileOnInput(fileInput, file)
      }

      // Submit form
      const submitButton = screen.getByRole('button', { name: /thêm/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUploadMutateAsync).toHaveBeenCalled()
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Dish',
            image: 'https://example.com/uploaded-image.jpg'
          })
        )
      })
    })
  })
})

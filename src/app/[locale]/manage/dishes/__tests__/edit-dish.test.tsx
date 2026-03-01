import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import EditDish from '../edit-dish'
import { useGetDishQuery, useUpdateDishMutation } from '@/queries/useDish'
import { useUploadMediaMutation } from '@/queries/useMedia'
import revalidateApiRequest from '@/apiRequests/revalidate'
import { toast } from '@/components/ui/use-toast'
import { DishStatus } from '@/constants/type'

// Mock dependencies
jest.mock('@/queries/useDish')
jest.mock('@/queries/useMedia')
jest.mock('@/apiRequests/revalidate')
jest.mock('@/components/ui/use-toast')

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-blob-url')
global.URL.revokeObjectURL = jest.fn()

const mockUseGetDishQuery = useGetDishQuery as jest.MockedFunction<typeof useGetDishQuery>
const mockUseUpdateDishMutation = useUpdateDishMutation as jest.MockedFunction<typeof useUpdateDishMutation>
const mockUseUploadMediaMutation = useUploadMediaMutation as jest.MockedFunction<typeof useUploadMediaMutation>
const mockRevalidateApiRequest = revalidateApiRequest as jest.MockedFunction<typeof revalidateApiRequest>
const mockToast = toast as jest.MockedFunction<typeof toast>

describe('EditDish Component', () => {
  const mockSetId = jest.fn()
  const mockOnSubmitSuccess = jest.fn()
  const mockUpdateMutateAsync = jest.fn()
  const mockUploadMutateAsync = jest.fn()

  const mockDishData = {
    payload: {
      data: {
        id: 1,
        name: 'Phở Bò Tái',
        price: 85000,
        description: 'Phở bò tái truyền thống',
        image: 'https://example.com/pho-bo.jpg',
        status: DishStatus.Available
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseGetDishQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null
    })

    mockUseUpdateDishMutation.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
      isSuccess: false,
      reset: jest.fn(),
      mutate: jest.fn()
    })

    mockUseUploadMediaMutation.mockReturnValue({
      mutateAsync: mockUploadMutateAsync,
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
      isSuccess: false,
      reset: jest.fn(),
      mutate: jest.fn()
    })

    mockRevalidateApiRequest.mockResolvedValue(undefined)
  })

  describe('Rendering', () => {
    it('should not render dialog when no id is provided', () => {
      render(<EditDish id={undefined} setId={mockSetId} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render dialog when id is provided', () => {
      render(<EditDish id={1} setId={mockSetId} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Cập nhật món ăn')).toBeInTheDocument()
    })

    it('should render all form fields when dialog is open', () => {
      render(<EditDish id={1} setId={mockSetId} />)

      expect(screen.getByLabelText(/tên món ăn/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/giá/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/mô tả sản phẩm/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('Không có sẵn')).toBeInTheDocument() // Default status
    })

    it('should render image upload section', () => {
      render(<EditDish id={1} setId={mockSetId} />)

      const uploadButton = screen.getByRole('button', { name: /upload/i })
      expect(uploadButton).toBeInTheDocument()
    })

    it('should populate form with dish data when available', async () => {
      mockUseGetDishQuery.mockReturnValue({
        data: mockDishData,
        isLoading: false,
        isError: false,
        error: null
      })

      render(<EditDish id={1} setId={mockSetId} />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Phở Bò Tái')).toBeInTheDocument()
        expect(screen.getByDisplayValue('85000')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Phở bò tái truyền thống')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Có sẵn')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    beforeEach(() => {
      render(<EditDish id={1} setId={mockSetId} />)
    })

    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup()

      // Clear the name field
      const nameInput = screen.getByLabelText(/tên món ăn/i)
      await user.clear(nameInput)

      const submitButton = screen.getByRole('button', { name: /lưu/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Zod 4 error message for z.string().min(1)
        expect(screen.getByText(/too small.*>=1 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate price field', async () => {
      const user = userEvent.setup()

      const priceInput = screen.getByLabelText(/giá/i)

      // Test with negative price
      await user.clear(priceInput)
      await user.type(priceInput, '-1000')

      const submitButton = screen.getByRole('button', { name: /lưu/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Zod 4 error message for z.coerce.number().positive()
        expect(screen.getByText(/too small.*>0/i)).toBeInTheDocument()
      })
    })
  })

  describe('Image Upload', () => {
    beforeEach(() => {
      render(<EditDish id={1} setId={mockSetId} />)
    })

    it('should handle image file selection', async () => {
      const user = userEvent.setup()

      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()

      if (fileInput) {
        const file = new File(['image content'], 'dish-image.jpg', { type: 'image/jpeg' })
        await user.upload(fileInput, file)

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
      const user = userEvent.setup()

      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]')

      if (fileInput) {
        const file = new File(['image content'], 'dish-image.jpg', { type: 'image/jpeg' })
        await user.upload(fileInput, file)

        await waitFor(() => {
          const previewImage = screen.getByRole('img')
          expect(previewImage).toHaveAttribute('src', 'mocked-blob-url')
        })
      }
    })

    it('should display existing image when dish data is loaded', async () => {
      mockUseGetDishQuery.mockReturnValue({
        data: mockDishData,
        isLoading: false,
        isError: false,
        error: null
      })

      render(<EditDish id={1} setId={mockSetId} />)

      await waitFor(() => {
        const previewImage = screen.getByRole('img')
        expect(previewImage).toHaveAttribute('src', 'https://example.com/pho-bo.jpg')
      })
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      mockUseGetDishQuery.mockReturnValue({
        data: mockDishData,
        isLoading: false,
        isError: false,
        error: null
      })

      render(<EditDish id={1} setId={mockSetId} onSubmitSuccess={mockOnSubmitSuccess} />)
    })

    it('should submit form with updated data without file upload', async () => {
      const user = userEvent.setup()

      const mockResponse = {
        payload: {
          message: 'Dish updated successfully'
        }
      }

      mockUpdateMutateAsync.mockResolvedValueOnce(mockResponse)

      // Update name
      const nameInput = screen.getByLabelText(/tên món ăn/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Phở Bò Tái Chin')

      // Update price
      const priceInput = screen.getByLabelText(/giá/i)
      await user.clear(priceInput)
      await user.type(priceInput, '90000')

      const submitButton = screen.getByRole('button', { name: /lưu/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
          id: 1,
          name: 'Phở Bò Tái Chin',
          price: 90000,
          description: 'Phở bò tái truyền thống',
          image: 'https://example.com/pho-bo.jpg',
          status: DishStatus.Available
        })
      })

      expect(mockToast).toHaveBeenCalledWith({
        description: 'Dish updated successfully'
      })

      expect(mockRevalidateApiRequest).toHaveBeenCalledWith('dishes')
      expect(mockSetId).toHaveBeenCalledWith(undefined)
      expect(mockOnSubmitSuccess).toHaveBeenCalled()
    })

    it('should submit form with file upload', async () => {
      const user = userEvent.setup()

      const mockUploadResponse = {
        payload: {
          data: 'https://cdn.example.com/uploaded-image.jpg'
        }
      }

      const mockUpdateResponse = {
        payload: {
          message: 'Dish updated successfully'
        }
      }

      mockUploadMutateAsync.mockResolvedValueOnce(mockUploadResponse)
      mockUpdateMutateAsync.mockResolvedValueOnce(mockUpdateResponse)

      // Upload new image
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]')

      if (fileInput) {
        const file = new File(['image content'], 'new-dish-image.jpg', { type: 'image/jpeg' })
        await user.upload(fileInput, file)
      }

      const submitButton = screen.getByRole('button', { name: /lưu/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUploadMutateAsync).toHaveBeenCalledWith(expect.any(FormData))
      })

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
          id: 1,
          name: 'Phở Bò Tái',
          price: 85000,
          description: 'Phở bò tái truyền thống',
          image: 'https://cdn.example.com/uploaded-image.jpg',
          status: DishStatus.Available
        })
      })
    })

    it('should handle different dish statuses', async () => {
      const user = userEvent.setup()

      const mockResponse = {
        payload: {
          message: 'Dish updated successfully'
        }
      }

      mockUpdateMutateAsync.mockResolvedValueOnce(mockResponse)

      // Change status to Unavailable
      const statusSelect = screen.getByDisplayValue('Có sẵn')
      await user.click(statusSelect)

      const unavailableOption = screen.getByText('Không có sẵn')
      await user.click(unavailableOption)

      const submitButton = screen.getByRole('button', { name: /lưu/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            status: DishStatus.Unavailable
          })
        )
      })
    })

    it('should prevent double submission', async () => {
      const user = userEvent.setup()

      // Mock isPending as true
      mockUseUpdateDishMutation.mockReturnValue({
        mutateAsync: mockUpdateMutateAsync,
        isPending: true,
        isError: false,
        error: null,
        data: undefined,
        isSuccess: false,
        reset: jest.fn(),
        mutate: jest.fn()
      })

      render(<EditDish id={1} setId={mockSetId} />)

      const submitButton = screen.getByRole('button', { name: /lưu/i })

      // Click submit multiple times
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)

      // Should not be called due to isPending check
      expect(mockUpdateMutateAsync).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseGetDishQuery.mockReturnValue({
        data: mockDishData,
        isLoading: false,
        isError: false,
        error: null
      })

      render(<EditDish id={1} setId={mockSetId} />)
    })

    it('should handle API errors during submission', async () => {
      const user = userEvent.setup()

      const mockError = new Error('Failed to update dish')
      mockUpdateMutateAsync.mockRejectedValueOnce(mockError)

      const submitButton = screen.getByRole('button', { name: /lưu/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalled()
      })

      // Dialog should remain open on error
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should handle upload errors', async () => {
      const user = userEvent.setup()

      const mockUploadError = new Error('Failed to upload image')
      mockUploadMutateAsync.mockRejectedValueOnce(mockUploadError)

      // Upload file
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]')

      if (fileInput) {
        const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
        await user.upload(fileInput, file)
      }

      const submitButton = screen.getByRole('button', { name: /lưu/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUploadMutateAsync).toHaveBeenCalled()
      })

      // Should not proceed to update dish if upload fails
      expect(mockUpdateMutateAsync).not.toHaveBeenCalled()
    })
  })

  describe('Dialog Behavior', () => {
    it('should close dialog and reset state when dialog is closed', async () => {
      const user = userEvent.setup()
      render(<EditDish id={1} setId={mockSetId} />)

      // Dialog should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Close dialog by setting open state to false (escape key)
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

      await waitFor(() => {
        expect(mockSetId).toHaveBeenCalledWith(undefined)
      })
    })

    it('should handle dialog state changes correctly', () => {
      const { rerender } = render(<EditDish id={1} setId={mockSetId} />)

      // Initially dialog should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Close dialog by changing id to undefined
      rerender(<EditDish id={undefined} setId={mockSetId} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should reset form state when dialog is closed', async () => {
      const user = userEvent.setup()
      render(<EditDish id={1} setId={mockSetId} />)

      // Upload a file
      const fileInput = screen
        .getByRole('button', { name: /upload/i })
        .parentElement?.querySelector('input[type="file"]')

      if (fileInput) {
        const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' })
        await user.upload(fileInput, file)
      }

      // Close dialog
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

      await waitFor(() => {
        expect(mockSetId).toHaveBeenCalledWith(undefined)
      })
    })
  })

  describe('Data Loading', () => {
    it('should handle loading state', () => {
      mockUseGetDishQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null
      })

      render(<EditDish id={1} setId={mockSetId} />)

      // Dialog should still render with default form values while loading
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByLabelText(/tên món ăn/i)).toHaveValue('')
    })

    it('should handle error state from query', () => {
      mockUseGetDishQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch dish')
      })

      render(<EditDish id={1} setId={mockSetId} />)

      // Dialog should still render with default form values on error
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})

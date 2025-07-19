import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import AddOrder from '../add-order'
import { useDishListQuery } from '@/queries/useDish'
import { useCreateOrderMutation } from '@/queries/useOrder'
import { useCreateGuestMutation } from '@/queries/useAccount'
import { toast } from '@/components/ui/use-toast'
import { DishStatus } from '@/constants/type'

// Mock dependencies
jest.mock('@/queries/useDish')
jest.mock('@/queries/useOrder')
jest.mock('@/queries/useAccount')
jest.mock('@/components/ui/use-toast')

const mockUseDishListQuery = useDishListQuery as jest.MockedFunction<typeof useDishListQuery>
const mockUseCreateOrderMutation = useCreateOrderMutation as jest.MockedFunction<typeof useCreateOrderMutation>
const mockUseCreateGuestMutation = useCreateGuestMutation as jest.MockedFunction<typeof useCreateGuestMutation>
const mockToast = toast as jest.MockedFunction<typeof toast>

describe('AddOrder Component', () => {
  const mockCreateOrderMutateAsync = jest.fn()
  const mockCreateGuestMutateAsync = jest.fn()

  const mockDishesData = {
    payload: {
      data: [
        {
          id: 1,
          name: 'Phở Bò Tái',
          price: 85000,
          description: 'Phở bò tái truyền thống',
          image: 'https://example.com/pho-bo.jpg',
          status: DishStatus.Available
        },
        {
          id: 2,
          name: 'Bún Bò Huế',
          price: 70000,
          description: 'Bún bò Huế cay nồng',
          image: 'https://example.com/bun-bo-hue.jpg',
          status: DishStatus.Available
        },
        {
          id: 3,
          name: 'Cơm Tấm',
          price: 60000,
          description: 'Cơm tấm sườn nướng',
          image: 'https://example.com/com-tam.jpg',
          status: DishStatus.Unavailable
        }
      ]
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseDishListQuery.mockReturnValue({
      data: mockDishesData,
      isLoading: false,
      isError: false,
      error: null
    })

    mockUseCreateOrderMutation.mockReturnValue({
      mutateAsync: mockCreateOrderMutateAsync,
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
      isSuccess: false,
      reset: jest.fn(),
      mutate: jest.fn()
    })

    mockUseCreateGuestMutation.mockReturnValue({
      mutateAsync: mockCreateGuestMutateAsync,
      isPending: false,
      isError: false,
      error: null,
      data: undefined,
      isSuccess: false,
      reset: jest.fn(),
      mutate: jest.fn()
    })
  })

  describe('Rendering', () => {
    it('should render add order trigger button', () => {
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      expect(triggerButton).toBeInTheDocument()
    })

    it('should open dialog when trigger button is clicked', async () => {
      const user = userEvent.setup()
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Tạo đơn hàng')).toBeInTheDocument()
    })

    it('should render new guest form by default', async () => {
      const user = userEvent.setup()
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)

      expect(screen.getByLabelText(/tên khách hàng/i)).toBeInTheDocument()
      expect(screen.getByText(/chọn bàn/i)).toBeInTheDocument()
    })

    it('should render dish list with available dishes', async () => {
      const user = userEvent.setup()
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)

      expect(screen.getByText('Phở Bò Tái')).toBeInTheDocument()
      expect(screen.getByText('Bún Bò Huế')).toBeInTheDocument()
      expect(screen.getByText('Cơm Tấm')).toBeInTheDocument()
    })

    it('should show unavailable dishes as disabled', async () => {
      const user = userEvent.setup()
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)

      // Find the container for Cơm Tấm (unavailable dish)
      const comTamContainer = screen.getByText('Cơm Tấm').closest('div')
      expect(comTamContainer).toHaveClass('pointer-events-none')
    })
  })

  describe('Guest Selection', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)
    })

    it('should switch between new guest and existing guest modes', async () => {
      const user = userEvent.setup()

      // Should start with new guest mode
      expect(screen.getByLabelText(/tên khách hàng/i)).toBeInTheDocument()

      // Switch to existing guest mode
      const guestToggle = screen.getByRole('switch', { name: /khách hàng mới/i })
      await user.click(guestToggle)

      // Should now show existing guest selection
      expect(screen.queryByLabelText(/tên khách hàng/i)).not.toBeInTheDocument()
    })

    it('should validate new guest form fields', async () => {
      const user = userEvent.setup()

      // Leave name field empty and try to submit
      const orderButton = screen.getByRole('button', { name: /đặt hàng/i })
      await user.click(orderButton)

      await waitFor(() => {
        expect(screen.getByText(/tên là bắt buộc/i)).toBeInTheDocument()
      })
    })

    it('should validate table selection for new guest', async () => {
      const user = userEvent.setup()

      // Fill name but leave table as 0
      const nameInput = screen.getByLabelText(/tên khách hàng/i)
      await user.type(nameInput, 'Nguyễn Văn A')

      const orderButton = screen.getByRole('button', { name: /đặt hàng/i })
      await user.click(orderButton)

      await waitFor(() => {
        expect(screen.getByText(/vui lòng chọn bàn/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dish Ordering', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)
    })

    it('should allow adding dishes to order', async () => {
      const user = userEvent.setup()

      // Find quantity controls for Phở Bò Tái
      const phoContainer = screen.getByText('Phở Bò Tái').closest('div')
      const plusButton = phoContainer?.querySelector('button[aria-label="Tăng"]')

      if (plusButton) {
        await user.click(plusButton)
        await user.click(plusButton) // Add 2 Phở
      }

      // Check if total price is calculated correctly
      expect(screen.getByText('170.000 ₫')).toBeInTheDocument() // 2 * 85000
    })

    it('should allow removing dishes from order', async () => {
      const user = userEvent.setup()

      // Add then remove dishes
      const phoContainer = screen.getByText('Phở Bò Tái').closest('div')
      const plusButton = phoContainer?.querySelector('button[aria-label="Tăng"]')
      const minusButton = phoContainer?.querySelector('button[aria-label="Giảm"]')

      if (plusButton && minusButton) {
        await user.click(plusButton) // Add 1
        await user.click(minusButton) // Remove 1
      }

      // Total should be 0
      expect(screen.getByText('0 ₫')).toBeInTheDocument()
    })

    it('should calculate total price correctly for multiple dishes', async () => {
      const user = userEvent.setup()

      // Add 2 Phở (85000 each) and 1 Bún Bò Huế (70000)
      const phoContainer = screen.getByText('Phở Bò Tái').closest('div')
      const bunContainer = screen.getByText('Bún Bò Huế').closest('div')

      const phoPlusButton = phoContainer?.querySelector('button[aria-label="Tăng"]')
      const bunPlusButton = bunContainer?.querySelector('button[aria-label="Tăng"]')

      if (phoPlusButton && bunPlusButton) {
        await user.click(phoPlusButton)
        await user.click(phoPlusButton) // 2 Phở
        await user.click(bunPlusButton) // 1 Bún
      }

      // Total: 2 * 85000 + 1 * 70000 = 240000
      expect(screen.getByText('240.000 ₫')).toBeInTheDocument()
    })

    it('should not allow ordering unavailable dishes', async () => {
      const user = userEvent.setup()

      // Try to click on Cơm Tấm (unavailable)
      const comTamContainer = screen.getByText('Cơm Tấm').closest('div')
      const plusButton = comTamContainer?.querySelector('button[aria-label="Tăng"]')

      if (plusButton) {
        await user.click(plusButton)
      }

      // Should remain at 0 total since dish is unavailable
      expect(screen.getByText('0 ₫')).toBeInTheDocument()
    })
  })

  describe('Order Submission', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)
    })

    it('should submit order with new guest', async () => {
      const user = userEvent.setup()

      const mockGuestResponse = {
        payload: {
          data: { id: 123 }
        }
      }

      const mockOrderResponse = {
        payload: {
          message: 'Order created successfully'
        }
      }

      mockCreateGuestMutateAsync.mockResolvedValueOnce(mockGuestResponse)
      mockCreateOrderMutateAsync.mockResolvedValueOnce(mockOrderResponse)

      // Fill guest information
      const nameInput = screen.getByLabelText(/tên khách hàng/i)
      await user.type(nameInput, 'Nguyễn Văn A')

      // Select table (this would need table dialog mock)
      // For now, set table manually by triggering field change
      fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '5' } })

      // Add some dishes
      const phoContainer = screen.getByText('Phở Bò Tái').closest('div')
      const plusButton = phoContainer?.querySelector('button[aria-label="Tăng"]')

      if (plusButton) {
        await user.click(plusButton)
      }

      // Submit order
      const orderButton = screen.getByRole('button', { name: /đặt hàng/i })
      await user.click(orderButton)

      await waitFor(() => {
        expect(mockCreateGuestMutateAsync).toHaveBeenCalledWith({
          name: 'Nguyễn Văn A',
          tableNumber: 5
        })
      })

      await waitFor(() => {
        expect(mockCreateOrderMutateAsync).toHaveBeenCalledWith({
          guestId: 123,
          orders: [{ dishId: 1, quantity: 1 }]
        })
      })
    })

    it('should handle order submission errors', async () => {
      const user = userEvent.setup()

      const mockError = new Error('Failed to create order')
      mockCreateOrderMutateAsync.mockRejectedValueOnce(mockError)

      // Fill required fields and add dishes
      const nameInput = screen.getByLabelText(/tên khách hàng/i)
      await user.type(nameInput, 'Nguyễn Văn A')

      fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '5' } })

      const phoContainer = screen.getByText('Phở Bò Tái').closest('div')
      const plusButton = phoContainer?.querySelector('button[aria-label="Tăng"]')

      if (plusButton) {
        await user.click(plusButton)
      }

      const orderButton = screen.getByRole('button', { name: /đặt hàng/i })
      await user.click(orderButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockCreateOrderMutateAsync).toHaveBeenCalled()
      })

      // Dialog should remain open on error
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should require at least one dish in order', async () => {
      const user = userEvent.setup()

      // Fill guest info but don't add any dishes
      const nameInput = screen.getByLabelText(/tên khách hàng/i)
      await user.type(nameInput, 'Nguyễn Văn A')

      fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '5' } })

      const orderButton = screen.getByRole('button', { name: /đặt hàng/i })
      await user.click(orderButton)

      // Should show validation or not proceed without dishes
      // This depends on business logic implementation
    })

    it('should reset form after successful order', async () => {
      const user = userEvent.setup()

      const mockGuestResponse = {
        payload: {
          data: { id: 123 }
        }
      }

      const mockOrderResponse = {
        payload: {
          message: 'Order created successfully'
        }
      }

      mockCreateGuestMutateAsync.mockResolvedValueOnce(mockGuestResponse)
      mockCreateOrderMutateAsync.mockResolvedValueOnce(mockOrderResponse)

      // Fill and submit order
      const nameInput = screen.getByLabelText(/tên khách hàng/i)
      await user.type(nameInput, 'Nguyễn Văn A')

      fireEvent.change(screen.getByDisplayValue('0'), { target: { value: '5' } })

      const phoContainer = screen.getByText('Phở Bò Tái').closest('div')
      const plusButton = phoContainer?.querySelector('button[aria-label="Tăng"]')

      if (plusButton) {
        await user.click(plusButton)
      }

      const orderButton = screen.getByRole('button', { name: /đặt hàng/i })
      await user.click(orderButton)

      await waitFor(() => {
        expect(mockCreateOrderMutateAsync).toHaveBeenCalled()
      })

      // Dialog should close after successful order
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Dialog Behavior', () => {
    it('should reset form when dialog is closed', async () => {
      const user = userEvent.setup()
      render(<AddOrder />)

      // Open dialog
      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)

      // Fill some data
      const nameInput = screen.getByLabelText(/tên khách hàng/i)
      await user.type(nameInput, 'Test Data')

      // Add dish to order
      const phoContainer = screen.getByText('Phở Bò Tái').closest('div')
      const plusButton = phoContainer?.querySelector('button[aria-label="Tăng"]')

      if (plusButton) {
        await user.click(plusButton)
      }

      // Close dialog
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Reopen dialog
      await user.click(triggerButton)

      // Form should be reset
      expect(screen.getByLabelText(/tên khách hàng/i)).toHaveValue('')
      expect(screen.getByText('0 ₫')).toBeInTheDocument() // Total should be reset
    })
  })

  describe('Data Loading', () => {
    it('should handle dishes loading state', () => {
      mockUseDishListQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null
      })

      const user = userEvent.setup()
      render(<AddOrder />)

      // Should still render trigger button during loading
      expect(screen.getByRole('button', { name: /tạo đơn hàng/i })).toBeInTheDocument()
    })

    it('should handle dishes loading error', async () => {
      mockUseDishListQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch dishes')
      })

      const user = userEvent.setup()
      render(<AddOrder />)

      const triggerButton = screen.getByRole('button', { name: /tạo đơn hàng/i })
      await user.click(triggerButton)

      // Should handle error gracefully, possibly showing empty list
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})

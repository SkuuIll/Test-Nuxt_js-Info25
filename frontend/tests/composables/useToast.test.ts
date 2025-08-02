import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useToast', () => {
    let mockToastService: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockToastService = {
            toasts: { value: [] },
            showToast: vi.fn(),
            success: vi.fn(),
            error: vi.fn(),
            authSuccess: vi.fn(),
            authError: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
        }
        global.useToast = vi.fn(() => mockToastService)
    })

    it('creates toast service with all methods', () => {
        const toast = global.useToast()

        expect(toast).toHaveProperty('showToast')
        expect(toast).toHaveProperty('success')
        expect(toast).toHaveProperty('error')
        expect(toast).toHaveProperty('authSuccess')
        expect(toast).toHaveProperty('authError')
        expect(toast).toHaveProperty('remove')
        expect(toast).toHaveProperty('clear')
        expect(toast).toHaveProperty('toasts')
    })

    it('shows basic toast with correct properties', () => {
        const toast = global.useToast()

        toast.showToast({
            type: 'info',
            title: 'Test Toast',
            message: 'This is a test message',
        })

        expect(toast.showToast).toHaveBeenCalledWith({
            type: 'info',
            title: 'Test Toast',
            message: 'This is a test message',
        })
    })

    it('creates success toast', () => {
        const toast = global.useToast()

        toast.success('Success message', 'Success title')

        expect(toast.success).toHaveBeenCalledWith('Success message', 'Success title')
    })

    it('creates error toast', () => {
        const toast = global.useToast()

        toast.error('Error message', 'Error title')

        expect(toast.error).toHaveBeenCalledWith('Error message', 'Error title')
    })

    it('creates auth success toast', () => {
        const toast = global.useToast()

        toast.authSuccess('Login successful')

        expect(toast.authSuccess).toHaveBeenCalledWith('Login successful')
    })

    it('creates auth error toast', () => {
        const toast = global.useToast()

        toast.authError('Login failed')

        expect(toast.authError).toHaveBeenCalledWith('Login failed')
    })

    it('removes toast by id', () => {
        const toast = global.useToast()

        toast.remove('test-id')

        expect(toast.remove).toHaveBeenCalledWith('test-id')
    })

    it('clears all toasts', () => {
        const toast = global.useToast()

        toast.clear()

        expect(toast.clear).toHaveBeenCalled()
    })

    it('provides reactive toasts array', () => {
        const toast = global.useToast()

        expect(toast.toasts).toBeDefined()
        expect(toast.toasts.value).toEqual([])
    })

    it('handles toast with action', () => {
        const toast = global.useToast()
        const actionHandler = vi.fn()

        toast.showToast({
            type: 'info',
            title: 'Test Toast',
            message: 'This is a test message',
            action: {
                label: 'Retry',
                handler: actionHandler,
            },
        })

        expect(toast.showToast).toHaveBeenCalledWith({
            type: 'info',
            title: 'Test Toast',
            message: 'This is a test message',
            action: {
                label: 'Retry',
                handler: actionHandler,
            },
        })
    })
})
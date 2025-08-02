import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useToast } from '~/composables/useToast'

// Mock Nuxt composables
const mockNuxtApp = {
    $toast: {
        show: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
    },
    $bus: {
        emit: vi.fn()
    }
}

const mockNavigateTo = vi.fn()

vi.mock('#app', () => ({
    useNuxtApp: () => mockNuxtApp,
    navigateTo: mockNavigateTo
}))

describe('useToast', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('provides all required methods', () => {
        const toast = useToast()

        expect(toast).toHaveProperty('showToast')
        expect(toast).toHaveProperty('showSuccess')
        expect(toast).toHaveProperty('showError')
        expect(toast).toHaveProperty('showWarning')
        expect(toast).toHaveProperty('showInfo')
        expect(toast).toHaveProperty('removeToast')
        expect(toast).toHaveProperty('clearAllToasts')
        expect(toast).toHaveProperty('authSuccess')
        expect(toast).toHaveProperty('authError')
        expect(toast).toHaveProperty('success')
        expect(toast).toHaveProperty('error')
    })

    it('calls the provided toast service when available', () => {
        const toast = useToast()

        const mockToastOptions = {
            title: 'Test Title',
            message: 'Test Message',
            type: 'info' as const
        }

        toast.showToast(mockToastOptions)

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Test Title',
                message: 'Test Message',
                type: 'info',
                priority: 'normal'
            })
        )
    })

    it('falls back to bus emit when toast service is not available', () => {
        // Temporarily remove the toast service
        const originalToast = mockNuxtApp.$toast
        mockNuxtApp.$toast = null

        const toast = useToast()

        const mockToastOptions = {
            title: 'Test Title',
            message: 'Test Message',
            type: 'error' as const
        }

        toast.showToast(mockToastOptions)

        expect(mockNuxtApp.$bus.emit).toHaveBeenCalledWith(
            'show-toast',
            expect.objectContaining({
                title: 'Test Title',
                message: 'Test Message',
                type: 'error',
                priority: 'normal'
            })
        )

        // Restore the toast service
        mockNuxtApp.$toast = originalToast
    })

    it('handles success toasts correctly', () => {
        const toast = useToast()

        toast.showSuccess('Success Title', 'Success Message')

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Success Title',
                message: 'Success Message',
                type: 'success'
            })
        )
    })

    it('handles error toasts with persistent flag', () => {
        const toast = useToast()

        toast.showError('Error Title', 'Error Message')

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Error Title',
                message: 'Error Message',
                type: 'error',
                persistent: true
            })
        )
    })

    it('handles warning toasts with longer duration', () => {
        const toast = useToast()

        toast.showWarning('Warning Title', 'Warning Message')

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Warning Title',
                message: 'Warning Message',
                type: 'warning',
                duration: 7000
            })
        )
    })

    it('handles API errors correctly', () => {
        const toast = useToast()

        // Test with response error
        const apiError = {
            response: {
                data: {
                    message: 'API Error Message',
                    errors: {
                        field1: ['Error 1', 'Error 2'],
                        field2: ['Error 3']
                    }
                }
            }
        }

        toast.showApiError(apiError, 'Custom default message')

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Error',
                message: 'Error 1, Error 2, Error 3',
                type: 'error',
                persistent: true
            })
        )
    })

    it('handles API errors without response', () => {
        const toast = useToast()

        const apiError = {
            message: 'Network Error'
        }

        toast.showApiError(apiError)

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Error',
                message: 'Network Error',
                type: 'error',
                persistent: true
            })
        )
    })

    it('handles network errors', () => {
        const toast = useToast()

        toast.showNetworkError()

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Error de conexión',
                message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
                type: 'error',
                persistent: true
            })
        )
    })

    it('handles notification toasts with different priorities', () => {
        const toast = useToast()

        // Test urgent notification
        const urgentNotification = {
            title: 'Urgent Notification',
            message: 'This is urgent',
            priority: 'urgent',
            action_url: '/urgent-action'
        }

        toast.showNotificationToast(urgentNotification)

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Urgent Notification',
                message: 'This is urgent',
                type: 'error',
                duration: 0,
                persistent: true,
                action: expect.objectContaining({
                    label: 'Ver',
                    handler: expect.any(Function)
                })
            })
        )

        // Test high priority notification
        const highNotification = {
            title: 'High Priority',
            message: 'This is high priority',
            priority: 'high'
        }

        toast.showNotificationToast(highNotification)

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'warning'
            })
        )

        // Test low priority notification
        const lowNotification = {
            title: 'Low Priority',
            message: 'This is low priority',
            priority: 'low'
        }

        toast.showNotificationToast(lowNotification)

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'info'
            })
        )
    })

    it('handles system announcements', () => {
        const toast = useToast()

        const announcement = {
            title: 'System Announcement',
            message: 'Important system update',
            priority: 'normal',
            action_url: '/announcement'
        }

        toast.showSystemAnnouncementToast(announcement)

        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: '📢 System Announcement',
                message: 'Important system update',
                type: 'warning',
                duration: 10000,
                action: expect.objectContaining({
                    label: 'Ver más',
                    handler: expect.any(Function)
                })
            })
        )
    })

    it('provides auth-specific methods', () => {
        const toast = useToast()

        toast.authSuccess('Login successful')
        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Éxito',
                message: 'Login successful',
                type: 'success'
            })
        )

        toast.authError('Login failed')
        expect(mockNuxtApp.$toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Error de autenticación',
                message: 'Login failed',
                type: 'error'
            })
        )
    })

    it('provides simple success/error methods for compatibility', () => {
        const toast = useToast()

        toast.success('Success message', 'Custom Title')
        expect(mockNuxtApp.$toast.success).toHaveBeenCalledWith('Success message', 'Custom Title')

        toast.error('Error message', 'Custom Error Title')
        expect(mockNuxtApp.$toast.error).toHaveBeenCalledWith('Error message', 'Custom Error Title')
    })

    it('removes toasts correctly', () => {
        const toast = useToast()

        toast.removeToast('toast-123')

        expect(mockNuxtApp.$toast.remove).toHaveBeenCalledWith('toast-123')
    })

    it('clears all toasts correctly', () => {
        const toast = useToast()

        toast.clearAllToasts()

        expect(mockNuxtApp.$toast.clear).toHaveBeenCalled()
    })
})
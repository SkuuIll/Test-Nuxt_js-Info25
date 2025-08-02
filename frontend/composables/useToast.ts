/**
 * Composable for toast notifications
 */
import type { ToastNotification } from '~/types/notifications'

interface ToastOptions {
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    duration?: number
    persistent?: boolean
    action?: {
        label: string
        handler: () => void
    }
}

export const useToast = () => {
    const nuxtApp = useNuxtApp()

    const showToast = (options: ToastOptions) => {
        const toast: Omit<ToastNotification, 'id'> = {
            title: options.title,
            message: options.message,
            type: options.type || 'info',
            priority: 'normal', // Default priority
            duration: options.persistent ? 0 : (options.duration ?? 5000),
            persistent: options.persistent || false,
            action: options.action
        }

        // Use the provided toast service
        if (nuxtApp.$toast) {
            nuxtApp.$toast.show(toast)
        } else {
            // Fallback: emit event for ToastContainer to catch
            nuxtApp.$bus?.emit('show-toast', toast)
        }
    }

    const showSuccess = (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({
            title,
            message,
            type: 'success',
            ...options
        })
    }

    const showError = (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({
            title,
            message,
            type: 'error',
            persistent: true, // Errors should be persistent by default
            ...options
        })
    }

    const showWarning = (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({
            title,
            message,
            type: 'warning',
            duration: 7000, // Warnings should stay longer
            ...options
        })
    }

    const showInfo = (title: string, message: string, options?: Partial<ToastOptions>) => {
        showToast({
            title,
            message,
            type: 'info',
            ...options
        })
    }

    const removeToast = (id: string) => {
        nuxtApp.$bus?.emit('remove-toast', id)

        if (nuxtApp.$toast) {
            nuxtApp.$toast.remove(id)
        }
    }

    const clearAllToasts = () => {
        nuxtApp.$bus?.emit('clear-toasts')

        if (nuxtApp.$toast) {
            nuxtApp.$toast.clear()
        }
    }

    // Notification-specific toast methods
    const showNotificationToast = (notification: any) => {
        const toastType = (() => {
            switch (notification.priority) {
                case 'urgent':
                    return 'error'
                case 'high':
                    return 'warning'
                case 'low':
                    return 'info'
                default:
                    return 'info'
            }
        })()

        showToast({
            title: notification.title,
            message: notification.message,
            type: toastType,
            duration: notification.priority === 'urgent' ? 0 : 5000,
            persistent: notification.priority === 'urgent',
            action: notification.action_url ? {
                label: 'Ver',
                handler: () => navigateTo(notification.action_url)
            } : undefined
        })
    }

    const showSystemAnnouncementToast = (announcement: any) => {
        showToast({
            title: '📢 ' + announcement.title,
            message: announcement.message,
            type: 'warning',
            duration: 10000,
            persistent: announcement.priority === 'urgent',
            action: announcement.action_url ? {
                label: 'Ver más',
                handler: () => navigateTo(announcement.action_url)
            } : undefined
        })
    }

    // API error toast helper
    const showApiError = (error: any, defaultMessage: string = 'Ha ocurrido un error') => {
        let title = 'Error'
        let message = defaultMessage

        if (error?.response?.data?.message) {
            message = error.response.data.message
        } else if (error?.message) {
            message = error.message
        }

        // Handle validation errors
        if (error?.response?.data?.errors) {
            const errors = error.response.data.errors
            const errorMessages = Object.values(errors).flat().join(', ')
            message = errorMessages || message
        }

        showError(title, message)
    }

    // Network error toast helper
    const showNetworkError = () => {
        showError(
            'Error de conexión',
            'No se pudo conectar al servidor. Verifica tu conexión a internet.'
        )
    }

    // Loading toast helper
    const showLoadingToast = (message: string = 'Cargando...') => {
        return showToast({
            title: 'Cargando',
            message,
            type: 'info',
            persistent: true
        })
    }

    // Auth-specific toast helpers for compatibility
    const authSuccess = (message: string = 'Autenticación exitosa') => {
        showSuccess('Éxito', message)
    }

    const authError = (message: string = 'Error de autenticación') => {
        showError('Error de autenticación', message)
    }

    // Simple success/error methods for compatibility with existing code
    const success = (message: string, title?: string) => {
        if (nuxtApp.$toast?.success) {
            nuxtApp.$toast.success(message, title)
        } else {
            showSuccess(title || 'Éxito', message)
        }
    }

    const error = (message: string, title?: string) => {
        if (nuxtApp.$toast?.error) {
            nuxtApp.$toast.error(message, title)
        } else {
            showError(title || 'Error', message)
        }
    }

    return {
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast,
        clearAllToasts,
        showNotificationToast,
        showSystemAnnouncementToast,
        showApiError,
        showNetworkError,
        showLoadingToast,
        authSuccess,
        authError,
        success,
        error
    }
}
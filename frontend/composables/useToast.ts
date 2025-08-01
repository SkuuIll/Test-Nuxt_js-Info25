/**
 * Toast notification composable
 * Provides user-friendly notifications for various scenarios
 */

interface ToastOptions {
    duration?: number
    position?: 'top' | 'bottom' | 'center'
    persistent?: boolean
    actions?: Array<{
        label: string
        action: () => void
    }>
}

export const useToast = () => {
    const notifications = ref<Array<{
        id: string
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
        timestamp: Date
        duration: number
        persistent: boolean
    }>>([])

    const generateId = () => {
        return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const addNotification = (
        type: 'success' | 'error' | 'warning' | 'info',
        title: string,
        message: string,
        options: ToastOptions = {}
    ) => {
        const notification = {
            id: generateId(),
            type,
            title,
            message,
            timestamp: new Date(),
            duration: options.duration || (type === 'error' ? 5000 : 3000),
            persistent: options.persistent || false
        }

        notifications.value.unshift(notification)

        // Auto-remove non-persistent notifications
        if (!notification.persistent) {
            setTimeout(() => {
                removeNotification(notification.id)
            }, notification.duration)
        }

        // Keep only last 10 notifications
        if (notifications.value.length > 10) {
            notifications.value = notifications.value.slice(0, 10)
        }

        // Log to console for debugging
        console.log(`🔔 ${type.toUpperCase()}: ${title} - ${message}`)

        return notification.id
    }

    const removeNotification = (id: string) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index > -1) {
            notifications.value.splice(index, 1)
        }
    }

    const clearAll = () => {
        notifications.value = []
    }

    const success = (title: string, message: string, options?: ToastOptions) => {
        return addNotification('success', title, message, options)
    }

    const error = (title: string, message: string, options?: ToastOptions) => {
        return addNotification('error', title, message, {
            duration: 5000,
            ...options
        })
    }

    const warning = (title: string, message: string, options?: ToastOptions) => {
        return addNotification('warning', title, message, {
            duration: 4000,
            ...options
        })
    }

    const info = (title: string, message: string, options?: ToastOptions) => {
        return addNotification('info', title, message, options)
    }

    // Auth-specific toast methods
    const authSuccess = (message: string) => {
        return success('Autenticación Exitosa', message)
    }

    const authError = (message: string) => {
        return error('Error de Autenticación', message, { duration: 6000 })
    }

    const validationError = (message: string) => {
        return warning('Datos Inválidos', message, { duration: 5000 })
    }

    const networkError = (message: string = 'Error de conexión. Verifica tu internet.') => {
        return error('Error de Conexión', message, {
            duration: 7000,
            persistent: false
        })
    }

    const serverError = (message: string = 'Error del servidor. Intenta más tarde.') => {
        return error('Error del Servidor', message, { duration: 6000 })
    }

    return {
        notifications: readonly(notifications),
        success,
        error,
        warning,
        info,
        authSuccess,
        authError,
        validationError,
        networkError,
        serverError,
        removeNotification,
        clearAll
    }
}
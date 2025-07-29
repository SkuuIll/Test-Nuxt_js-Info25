interface ToastOptions {
    duration?: number
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

interface Toast {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration: number
    timestamp: number
}

export const useToast = () => {
    const toasts = ref<Toast[]>([])

    // Generate unique ID
    const generateId = () => {
        return Math.random().toString(36).substr(2, 9)
    }

    // Add toast
    const addToast = (type: Toast['type'], title: string, message?: string, options: ToastOptions = {}) => {
        const toast: Toast = {
            id: generateId(),
            type,
            title,
            message,
            duration: options.duration || 5000,
            timestamp: Date.now()
        }

        toasts.value.push(toast)

        // Auto remove after duration
        if (toast.duration > 0) {
            setTimeout(() => {
                removeToast(toast.id)
            }, toast.duration)
        }

        return toast.id
    }

    // Remove toast
    const removeToast = (id: string) => {
        const index = toasts.value.findIndex(toast => toast.id === id)
        if (index > -1) {
            toasts.value.splice(index, 1)
        }
    }

    // Clear all toasts
    const clearToasts = () => {
        toasts.value = []
    }

    // Convenience methods
    const success = (title: string, message?: string, options?: ToastOptions) => {
        return addToast('success', title, message, options)
    }

    const error = (title: string, message?: string, options?: ToastOptions) => {
        return addToast('error', title, message, options)
    }

    const warning = (title: string, message?: string, options?: ToastOptions) => {
        return addToast('warning', title, message, options)
    }

    const info = (title: string, message?: string, options?: ToastOptions) => {
        return addToast('info', title, message, options)
    }

    return {
        toasts: readonly(toasts),
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info
    }
}
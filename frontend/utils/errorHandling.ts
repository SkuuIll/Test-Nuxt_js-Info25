/**
 * Independent error handling utilities
 * These functions don't depend on any composables to avoid circular dependencies
 */

export interface ErrorInfo {
    message: string
    code?: string | number
    status?: number
    context?: string
    timestamp: Date
    url?: string
}

/**
 * Handle API errors independently
 */
export const handleApiError = (error: any, context?: string): ErrorInfo => {
    const errorInfo: ErrorInfo = {
        message: error?.data?.message || error?.data?.error || error?.message || error?.statusMessage || 'Error desconocido',
        code: error?.data?.code || error?.code,
        status: error?.statusCode || error?.status,
        context: context || 'Unknown context',
        timestamp: new Date(),
        url: error?.data?.url || (import.meta.client ? window.location.href : undefined)
    }

    console.error('🚨 API Error:', errorInfo)

    return errorInfo
}

/**
 * Handle authentication errors independently
 */
export const handleAuthError = (error: any, context?: string): ErrorInfo => {
    const errorInfo: ErrorInfo = {
        message: error?.data?.message || error?.message || 'Error de autenticación',
        code: error?.data?.code || error?.code,
        status: error?.statusCode || error?.status,
        context: context || 'Auth context',
        timestamp: new Date(),
        url: error?.data?.url || (import.meta.client ? window.location.href : undefined)
    }

    console.error('🔐 Auth Error:', errorInfo)

    // Clear tokens on auth error
    if (import.meta.client) {
        try {
            localStorage.removeItem('auth_tokens')
        } catch (e) {
            // Ignore localStorage errors
        }
    }

    return errorInfo
}

/**
 * Handle validation errors independently
 */
export const handleValidationError = (error: any, context?: string): ErrorInfo => {
    const errorInfo: ErrorInfo = {
        message: error?.data?.message || error?.message || 'Error de validación',
        code: error?.data?.code || error?.code,
        status: error?.statusCode || error?.status,
        context: context || 'Validation context',
        timestamp: new Date(),
        url: error?.data?.url || (import.meta.client ? window.location.href : undefined)
    }

    console.error('📝 Validation Error:', errorInfo)

    // Log validation details if available
    if (error?.data?.errors || error?.errors) {
        console.error('Validation details:', error.data?.errors || error.errors)
    }

    return errorInfo
}

/**
 * Handle network errors independently
 */
export const handleNetworkError = (error: any, context?: string): ErrorInfo => {
    const errorInfo: ErrorInfo = {
        message: error?.data?.message || error?.message || 'Error de conexión',
        code: error?.data?.code || error?.code,
        status: error?.statusCode || error?.status,
        context: context || 'Network context',
        timestamp: new Date(),
        url: error?.data?.url || (import.meta.client ? window.location.href : undefined)
    }

    console.error('🌐 Network Error:', errorInfo)

    // Check if device is offline
    if (import.meta.client && navigator.onLine === false) {
        console.warn('🔌 Device appears to be offline')
    }

    return errorInfo
}

/**
 * Generic error handler that routes to appropriate specific handler
 */
export const handleError = (error: any, context?: string): ErrorInfo => {
    const status = error?.statusCode || error?.status

    if (status === 401 || status === 403) {
        return handleAuthError(error, context)
    } else if (status === 422 || status === 400) {
        return handleValidationError(error, context)
    } else if (status >= 500) {
        return handleNetworkError(error, context)
    } else {
        return handleApiError(error, context)
    }
}

/**
 * Extract user-friendly error message
 */
export const getErrorMessage = (error: any): string => {
    return error?.data?.message ||
        error?.data?.error ||
        error?.message ||
        error?.statusMessage ||
        'Ha ocurrido un error inesperado'
}

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: any): boolean => {
    const status = error?.statusCode || error?.status

    // Network errors and server errors are typically retryable
    return status >= 500 || status === 0 || !status
}

/**
 * Log error for debugging
 */
export const logError = (error: any, context?: string) => {
    if (import.meta.dev) {
        console.group(`🐛 Error Debug: ${context || 'Unknown'}`)
        console.error('Error object:', error)
        console.error('Stack trace:', error?.stack)
        console.error('Timestamp:', new Date().toISOString())
        if (import.meta.client) {
            console.error('URL:', window.location.href)
            console.error('User Agent:', navigator.userAgent)
        }
        console.groupEnd()
    }
}
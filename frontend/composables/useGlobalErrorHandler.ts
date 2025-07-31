/**
 * Global Error Handler Composable
 * Provides centralized error handling for the entire application
 */

import type { ApiError, ValidationErrors } from '~/types'

interface ErrorContext {
    component?: string
    action?: string
    userId?: number | string
    additionalData?: Record<string, any>
}

interface ErrorHandlerOptions {
    showToast?: boolean
    logError?: boolean
    reportError?: boolean
    fallbackMessage?: string
    context?: ErrorContext
}

interface NetworkError extends Error {
    code?: string
    status?: number
    response?: any
}

interface ValidationError extends Error {
    field?: string
    errors?: string[]
}

interface BusinessError extends Error {
    code?: string
    type?: 'business' | 'validation' | 'permission' | 'not_found'
    details?: Record<string, any>
}

export const useGlobalErrorHandler = () => {
    const { error: nuxtError } = useError()
    const { $toast } = useNuxtApp()

    // Error state management
    const globalError = ref<string | null>(null)
    const errorHistory = ref<Array<{
        error: Error
        timestamp: Date
        context?: ErrorContext
        resolved: boolean
    }>>([])
    const isOnline = ref(true)
    const retryQueue = ref<Array<{
        fn: Function
        context: ErrorContext
        attempts: number
        maxAttempts: number
    }>>([])

    // Network status monitoring
    if (import.meta.client) {
        isOnline.value = navigator.onLine

        window.addEventListener('online', () => {
            isOnline.value = true
            processRetryQueue()
        })

        window.addEventListener('offline', () => {
            isOnline.value = false
        })
    }

    /**
     * Main error handler function
     */
    const handleError = (
        error: Error | ApiError | NetworkError | ValidationError | BusinessError,
        options: ErrorHandlerOptions = {}
    ) => {
        const {
            showToast = true,
            logError = true,
            reportError = false,
            fallbackMessage = 'An unexpected error occurred',
            context = {}
        } = options

        // Log error for debugging
        if (logError) {
            console.error('🚨 Global Error Handler:', {
                error,
                context,
                timestamp: new Date().toISOString(),
                userAgent: import.meta.client ? navigator.userAgent : 'SSR',
                url: import.meta.client ? window.location.href : 'SSR'
            })
        }

        // Add to error history
        errorHistory.value.unshift({
            error,
            timestamp: new Date(),
            context,
            resolved: false
        })

        // Keep only last 50 errors
        if (errorHistory.value.length > 50) {
            errorHistory.value = errorHistory.value.slice(0, 50)
        }

        // Determine error type and handle accordingly
        const errorInfo = categorizeError(error)
        const userMessage = getUserFriendlyMessage(errorInfo, fallbackMessage)

        // Update global error state
        globalError.value = userMessage

        // Show toast notification
        if (showToast && $toast) {
            showErrorToast(errorInfo, userMessage)
        }

        // Report error to external service (if configured)
        if (reportError) {
            reportErrorToService(error, context)
        }

        // Handle specific error types
        handleSpecificErrorTypes(errorInfo, context)

        return errorInfo
    }

    /**
     * Categorize error type for better handling
     */
    const categorizeError = (error: any) => {
        // Network errors
        if (!isOnline.value) {
            return {
                type: 'network',
                subtype: 'offline',
                message: 'You are currently offline',
                severity: 'warning',
                recoverable: true,
                retryable: true
            }
        }

        if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
            return {
                type: 'network',
                subtype: 'connection',
                message: 'Network connection error',
                severity: 'error',
                recoverable: true,
                retryable: true
            }
        }

        // HTTP status errors
        if (error.status || error.response?.status) {
            const status = error.status || error.response?.status

            switch (status) {
                case 400:
                    return {
                        type: 'validation',
                        subtype: 'bad_request',
                        message: 'Invalid request data',
                        severity: 'warning',
                        recoverable: true,
                        retryable: false
                    }
                case 401:
                    return {
                        type: 'authentication',
                        subtype: 'unauthorized',
                        message: 'Authentication required',
                        severity: 'error',
                        recoverable: true,
                        retryable: false
                    }
                case 403:
                    return {
                        type: 'authorization',
                        subtype: 'forbidden',
                        message: 'Access denied',
                        severity: 'error',
                        recoverable: false,
                        retryable: false
                    }
                case 404:
                    return {
                        type: 'not_found',
                        subtype: 'resource',
                        message: 'Resource not found',
                        severity: 'warning',
                        recoverable: false,
                        retryable: false
                    }
                case 422:
                    return {
                        type: 'validation',
                        subtype: 'unprocessable',
                        message: 'Validation errors occurred',
                        severity: 'warning',
                        recoverable: true,
                        retryable: false
                    }
                case 429:
                    return {
                        type: 'rate_limit',
                        subtype: 'too_many_requests',
                        message: 'Too many requests. Please wait.',
                        severity: 'warning',
                        recoverable: true,
                        retryable: true
                    }
                case 500:
                    return {
                        type: 'server',
                        subtype: 'internal_error',
                        message: 'Server error occurred',
                        severity: 'error',
                        recoverable: true,
                        retryable: true
                    }
                case 502:
                case 503:
                case 504:
                    return {
                        type: 'server',
                        subtype: 'unavailable',
                        message: 'Service temporarily unavailable',
                        severity: 'error',
                        recoverable: true,
                        retryable: true
                    }
                default:
                    return {
                        type: 'http',
                        subtype: 'unknown_status',
                        message: `HTTP ${status} error`,
                        severity: 'error',
                        recoverable: true,
                        retryable: true
                    }
            }
        }

        // Validation errors
        if (error.errors || error.field) {
            return {
                type: 'validation',
                subtype: 'field_errors',
                message: 'Please check your input',
                severity: 'warning',
                recoverable: true,
                retryable: false,
                details: error.errors || { [error.field]: [error.message] }
            }
        }

        // Business logic errors
        if (error.code && error.type === 'business') {
            return {
                type: 'business',
                subtype: error.code,
                message: error.message || 'Business rule violation',
                severity: 'warning',
                recoverable: true,
                retryable: false,
                details: error.details
            }
        }

        // JavaScript errors
        if (error instanceof TypeError) {
            return {
                type: 'javascript',
                subtype: 'type_error',
                message: 'Application error occurred',
                severity: 'error',
                recoverable: false,
                retryable: false
            }
        }

        if (error instanceof ReferenceError) {
            return {
                type: 'javascript',
                subtype: 'reference_error',
                message: 'Application error occurred',
                severity: 'error',
                recoverable: false,
                retryable: false
            }
        }

        // Generic error
        return {
            type: 'unknown',
            subtype: 'generic',
            message: error.message || 'An unexpected error occurred',
            severity: 'error',
            recoverable: true,
            retryable: false
        }
    }

    /**
     * Get user-friendly error message
     */
    const getUserFriendlyMessage = (errorInfo: any, fallback: string) => {
        const messages = {
            network: {
                offline: 'You are currently offline. Please check your internet connection.',
                connection: 'Unable to connect to the server. Please try again.',
                timeout: 'The request timed out. Please try again.'
            },
            authentication: {
                unauthorized: 'Please log in to continue.',
                expired: 'Your session has expired. Please log in again.',
                invalid: 'Invalid credentials. Please try again.'
            },
            authorization: {
                forbidden: 'You do not have permission to perform this action.',
                insufficient: 'Insufficient permissions for this operation.'
            },
            validation: {
                bad_request: 'Please check your input and try again.',
                unprocessable: 'Please correct the highlighted errors.',
                field_errors: 'Please check the form for errors.'
            },
            not_found: {
                resource: 'The requested item could not be found.',
                page: 'The page you are looking for does not exist.'
            },
            rate_limit: {
                too_many_requests: 'Too many requests. Please wait a moment before trying again.'
            },
            server: {
                internal_error: 'A server error occurred. Our team has been notified.',
                unavailable: 'The service is temporarily unavailable. Please try again later.',
                maintenance: 'The system is under maintenance. Please try again later.'
            },
            business: {
                insufficient_funds: 'Insufficient funds for this operation.',
                duplicate_entry: 'This item already exists.',
                invalid_operation: 'This operation is not allowed at this time.'
            }
        }

        const typeMessages = messages[errorInfo.type as keyof typeof messages]
        if (typeMessages && typeMessages[errorInfo.subtype as keyof typeof typeMessages]) {
            return typeMessages[errorInfo.subtype as keyof typeof typeMessages]
        }

        return errorInfo.message || fallback
    }

    /**
     * Show appropriate toast notification
     */
    const showErrorToast = (errorInfo: any, message: string) => {
        const toastOptions = {
            duration: errorInfo.severity === 'error' ? 8000 : 5000,
            position: 'top-right' as const
        }

        switch (errorInfo.severity) {
            case 'error':
                $toast?.error(message, toastOptions)
                break
            case 'warning':
                $toast?.warning(message, toastOptions)
                break
            default:
                $toast?.error(message, toastOptions)
        }
    }

    /**
     * Handle specific error types with custom logic
     */
    const handleSpecificErrorTypes = (errorInfo: any, context: ErrorContext) => {
        switch (errorInfo.type) {
            case 'authentication':
                // Redirect to login or refresh token
                if (errorInfo.subtype === 'unauthorized') {
                    // Clear auth state and redirect
                    navigateTo('/login')
                }
                break

            case 'authorization':
                // Show permission denied page or redirect
                if (errorInfo.subtype === 'forbidden') {
                    // Could redirect to access denied page
                    console.warn('Access denied for:', context)
                }
                break

            case 'network':
                // Add to retry queue if retryable
                if (errorInfo.retryable && context.action) {
                    addToRetryQueue(context)
                }
                break

            case 'rate_limit':
                // Implement exponential backoff
                const retryAfter = errorInfo.retryAfter || 60000 // 1 minute default
                setTimeout(() => {
                    if (context.action) {
                        addToRetryQueue(context)
                    }
                }, retryAfter)
                break
        }
    }

    /**
     * Add failed operation to retry queue
     */
    const addToRetryQueue = (context: ErrorContext) => {
        if (!context.action) return

        const existingItem = retryQueue.value.find(item =>
            item.context.action === context.action &&
            item.context.component === context.component
        )

        if (existingItem) {
            existingItem.attempts += 1
            if (existingItem.attempts >= existingItem.maxAttempts) {
                // Remove from queue if max attempts reached
                retryQueue.value = retryQueue.value.filter(item => item !== existingItem)
            }
        } else {
            retryQueue.value.push({
                fn: () => { }, // This would be the actual function to retry
                context,
                attempts: 1,
                maxAttempts: 3
            })
        }
    }

    /**
     * Process retry queue when back online
     */
    const processRetryQueue = async () => {
        if (!isOnline.value || retryQueue.value.length === 0) return

        console.log('🔄 Processing retry queue:', retryQueue.value.length, 'items')

        const itemsToRetry = [...retryQueue.value]
        retryQueue.value = []

        for (const item of itemsToRetry) {
            try {
                await item.fn()
                console.log('✅ Retry successful for:', item.context.action)
            } catch (error) {
                console.warn('❌ Retry failed for:', item.context.action)
                // Re-add to queue if under max attempts
                if (item.attempts < item.maxAttempts) {
                    addToRetryQueue(item.context)
                }
            }
        }
    }

    /**
     * Report error to external monitoring service
     */
    const reportErrorToService = (error: Error, context: ErrorContext) => {
        // This would integrate with services like Sentry, LogRocket, etc.
        if (import.meta.client && window.console) {
            console.group('🔍 Error Report')
            console.error('Error:', error)
            console.log('Context:', context)
            console.log('User Agent:', navigator.userAgent)
            console.log('URL:', window.location.href)
            console.log('Timestamp:', new Date().toISOString())
            console.groupEnd()
        }
    }

    /**
     * Handle validation errors specifically
     */
    const handleValidationErrors = (errors: ValidationErrors, options: ErrorHandlerOptions = {}) => {
        const errorMessages = []

        for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
                errorMessages.push(`${field}: ${fieldErrors.join(', ')}`)
            } else {
                errorMessages.push(`${field}: ${fieldErrors}`)
            }
        }

        const combinedMessage = errorMessages.join('\n')

        return handleError(new Error(combinedMessage), {
            ...options,
            context: { ...options.context, type: 'validation' }
        })
    }

    /**
     * Clear global error state
     */
    const clearError = () => {
        globalError.value = null
    }

    /**
     * Mark error as resolved in history
     */
    const markErrorResolved = (index: number) => {
        if (errorHistory.value[index]) {
            errorHistory.value[index].resolved = true
        }
    }

    /**
     * Clear error history
     */
    const clearErrorHistory = () => {
        errorHistory.value = []
    }

    /**
     * Get error statistics
     */
    const getErrorStats = () => {
        const total = errorHistory.value.length
        const resolved = errorHistory.value.filter(e => e.resolved).length
        const byType = errorHistory.value.reduce((acc, e) => {
            const errorInfo = categorizeError(e.error)
            acc[errorInfo.type] = (acc[errorInfo.type] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            total,
            resolved,
            unresolved: total - resolved,
            byType,
            recentErrors: errorHistory.value.slice(0, 5)
        }
    }

    /**
     * Create error boundary for components
     */
    const createErrorBoundary = (componentName: string) => {
        return {
            onError: (error: Error, additionalData?: any) => {
                handleError(error, {
                    context: {
                        component: componentName,
                        additionalData
                    }
                })
            }
        }
    }

    return {
        // State
        globalError: readonly(globalError),
        errorHistory: readonly(errorHistory),
        isOnline: readonly(isOnline),
        retryQueue: readonly(retryQueue),

        // Main functions
        handleError,
        handleValidationErrors,
        clearError,
        markErrorResolved,
        clearErrorHistory,

        // Utilities
        categorizeError,
        getUserFriendlyMessage,
        getErrorStats,
        createErrorBoundary,
        processRetryQueue,

        // Network status (already included above)
        // isOnline: readonly(isOnline)
    }
}
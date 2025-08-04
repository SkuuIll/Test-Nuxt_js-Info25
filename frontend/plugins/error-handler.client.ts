/**
 * Consolidated Error Handler Plugin
 * Handles all types of errors including Vue, JavaScript, Promise rejections, CORS, and network errors
 */
export default defineNuxtPlugin((nuxtApp) => {
    const { handleError } = useErrorHandler({
        enableReporting: true,
        maxRetries: 3,
        retryDelay: 1000
    })

    // Helper function to detect network errors
    const isNetworkError = (error: any): boolean => {
        if (!error) return false
        const message = error.message || error.toString()
        return (
            message.includes('fetch') ||
            message.includes('network') ||
            message.includes('NetworkError') ||
            message.includes('Failed to fetch') ||
            message.includes('ERR_NETWORK') ||
            message.includes('ERR_INTERNET_DISCONNECTED') ||
            error.code === 'NETWORK_ERROR' ||
            error.type === 'network'
        )
    }

    // Helper function to detect CORS errors
    const isCorsError = (error: any): boolean => {
        if (!error) return false
        const message = error.message || error.toString()
        return (
            message.includes('CORS') ||
            message.includes('Cross-Origin') ||
            message.includes('Access-Control-Allow-Origin') ||
            (error.status === 0 && message.includes('fetch'))
        )
    }

    // Vue error handler
    nuxtApp.vueApp.config.errorHandler = (error: any, instance: any, info: string) => {
        if (process.dev) {
            console.error('🚨 Vue Error:', error, info)
        }
        handleError(error, `Vue Error: ${info}`)
    }

    // Client-side error handlers
    if (process.client) {
        // Global media error handler
        const handleGlobalImageError = (event: Event) => {
            const img = event.target as HTMLImageElement
            if (!img || !img.src) return

            const { handleMediaError } = useMediaErrorHandler()
            handleMediaError(img.src, event)
        }

        // Set up global event listeners for media errors
        document.addEventListener('error', (event) => {
            if (event.target instanceof HTMLImageElement) {
                handleGlobalImageError(event)
            }
        }, true)

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            document.removeEventListener('error', handleGlobalImageError, true)
        })

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason

            if (process.dev) {
                console.error('🚨 Unhandled Promise Rejection:', error)
            }

            // Handle CORS errors with user-friendly message
            if (isCorsError(error)) {
                const { error: showError } = useToast()
                showError(
                    'Error de conexión',
                    'Problema de conectividad con el servidor. Por favor, recarga la página.'
                )
                event.preventDefault()
                return
            }

            // Handle network errors
            if (isNetworkError(error)) {
                handleError(error, 'Network Error')
            } else {
                handleError(error, 'Unhandled Promise Rejection')
            }

            event.preventDefault()
        })

        // JavaScript errors
        window.addEventListener('error', (event) => {
            const error = {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            }

            if (process.dev) {
                console.error('🚨 JavaScript Error:', error)
            }

            handleError(error, `JavaScript Error: ${event.filename}:${event.lineno}`)
        })

        // Network status changes
        window.addEventListener('offline', () => {
            handleError(new Error('Network connection lost'), 'Network Status')
        })

        window.addEventListener('online', () => {
            const { success } = useToast()
            success('Conexión restaurada')
        })

        // Development-only CORS console override
        if (process.dev) {
            const originalConsoleError = console.error
            console.error = function (...args) {
                const message = args.join(' ')

                if (isCorsError({ message })) {
                    console.warn('🔧 CORS Configuration Issue:', ...args)
                    console.warn('💡 Check Django CORS settings and ensure the frontend URL is allowed')
                    return
                }

                originalConsoleError.apply(console, args)
            }
        }
    }

    // Provide global error handler
    nuxtApp.provide('errorHandler', {
        handleError,
        reportError: (error: any, context?: string) => {
            handleError(error, context)
        }
    })
})
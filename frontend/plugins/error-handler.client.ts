/**
 * Global error handler plugin
 * Catches and handles all unhandled errors in the application
 */

export default defineNuxtPlugin((nuxtApp) => {
    const { handleError } = useErrorRecovery({
        enableAutoRecovery: true,
        maxRetryAttempts: 3,
        retryDelay: 1000,
        enableErrorReporting: true,
        enableUserFeedback: true
    })

    // Global error handler for Vue errors
    nuxtApp.vueApp.config.errorHandler = (error: any, instance: any, info: string) => {
        console.error('🚨 Vue Error:', error, info)

        // Handle the error with our recovery system
        handleError(error, `Vue Error: ${info}`)
    }

    // Global error handler for unhandled promise rejections
    if (process.client) {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled Promise Rejection:', event.reason)

            // Handle the error
            handleError(event.reason, 'Unhandled Promise Rejection')

            // Prevent the default browser error handling
            event.preventDefault()
        })

        // Global error handler for JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('🚨 JavaScript Error:', event.error)

            // Handle the error
            handleError(event.error, `JavaScript Error: ${event.filename}:${event.lineno}`)
        })

        // Handle network errors
        window.addEventListener('offline', () => {
            handleError(new Error('Network connection lost'), 'Network Status')
        })

        window.addEventListener('online', () => {
            const { success } = useToast()
            success('Conexión restaurada')
        })
    }

    // Provide global error handler
    nuxtApp.provide('errorHandler', {
        handleError,
        reportError: (error: any, context?: string) => {
            handleError(error, context)
        }
    })
})
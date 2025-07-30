export default defineNuxtPlugin(() => {
    const { handleError, handleNetworkError } = useErrorHandler()

    // Handle unhandled promise rejections
    if (process.client) {
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason

            console.error('🚨 Unhandled Promise Rejection:', error)

            // Check if it's a network error
            if (isNetworkError(error)) {
                handleNetworkError(error, 'Unhandled Network Error')
            } else {
                handleError(error, 'Unhandled Promise Rejection', {
                    showToast: true,
                    logToConsole: false, // Already logged above
                    reportToService: true
                })
            }

            // Prevent the error from being logged to console again
            event.preventDefault()
        })

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            const error = {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            }

            console.error('🚨 JavaScript Error:', error)

            handleError(error, 'JavaScript Error', {
                showToast: false, // Don't show toast for JS errors
                logToConsole: false, // Already logged above
                reportToService: true
            })
        })

        // Handle Vue errors (if using Vue error handler)
        const app = getCurrentInstance()?.appContext.app
        if (app) {
            app.config.errorHandler = (error, instance, info) => {
                console.error('🚨 Vue Error:', error, info)

                handleError(error, `Vue Error: ${info}`, {
                    showToast: false, // Don't show toast for Vue errors
                    logToConsole: false, // Already logged above
                    reportToService: true
                })
            }
        }
    }

    // Helper function to detect network errors
    function isNetworkError(error: any): boolean {
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
})
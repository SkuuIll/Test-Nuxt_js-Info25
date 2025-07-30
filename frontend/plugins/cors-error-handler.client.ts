export default defineNuxtPlugin(() => {
    // Handle CORS errors globally
    if (process.client) {
        // Listen for unhandled promise rejections that might be CORS-related
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason

            // Check if it's a CORS-related error
            if (error && typeof error === 'object') {
                const errorMessage = error.message || error.toString()

                if (
                    errorMessage.includes('CORS') ||
                    errorMessage.includes('Cross-Origin') ||
                    errorMessage.includes('Access-Control-Allow-Origin') ||
                    (error.status === 0 && errorMessage.includes('fetch'))
                ) {
                    console.error('🚨 CORS Error detected:', error)

                    // Show user-friendly error message
                    const { error: showError } = useToast()
                    showError(
                        'Error de conexión',
                        'Problema de conectividad con el servidor. Por favor, recarga la página.'
                    )

                    // Prevent the error from being logged to console again
                    event.preventDefault()
                }
            }
        })

        // Override console.error to catch CORS errors
        const originalConsoleError = console.error
        console.error = function (...args) {
            const message = args.join(' ')

            if (
                message.includes('CORS') ||
                message.includes('Cross-Origin') ||
                message.includes('Access-Control-Allow-Origin')
            ) {
                console.warn('🔧 CORS Configuration Issue:', ...args)
                console.warn('💡 Check Django CORS settings and ensure the frontend URL is allowed')
                return
            }

            originalConsoleError.apply(console, args)
        }
    }
})
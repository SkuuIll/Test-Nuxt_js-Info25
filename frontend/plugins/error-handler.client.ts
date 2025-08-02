/**
 * Global error handler plugin for client-side errors
 */

export default defineNuxtPlugin((nuxtApp) => {
    // Global error handler for Vue errors
    nuxtApp.vueApp.config.errorHandler = (error: any, instance: any, info: string) => {
        console.error('🔥 Vue Error:', {
            error: error.message || error,
            stack: error.stack,
            component: instance?.$options.name || 'Unknown',
            info,
            timestamp: new Date().toISOString()
        })

        // Show user-friendly error message
        const { error: showError } = useToast()

        // Don't show toast for hydration mismatches as they're usually recoverable
        if (!error.message?.includes('hydration') && !error.message?.includes('readonly')) {
            showError(
                'Error de aplicación',
                'Ha ocurrido un error inesperado. La página se recargará automáticamente.'
            )

            // Auto-reload after a delay for critical errors
            setTimeout(() => {
                window.location.reload()
            }, 3000)
        }
    }

    // Global error handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🔥 Unhandled Promise Rejection:', {
            reason: event.reason,
            promise: event.promise,
            timestamp: new Date().toISOString()
        })

        // Prevent the default browser error handling
        event.preventDefault()

        const { error: showError } = useToast()
        showError(
            'Error de conexión',
            'Ha ocurrido un error de red. Por favor, verifica tu conexión.'
        )
    })

    // Global error handler for JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('🔥 JavaScript Error:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error,
            timestamp: new Date().toISOString()
        })

        // Only show toast for non-script loading errors
        if (!event.filename?.includes('/_nuxt/') && !event.message?.includes('Loading')) {
            const { error: showError } = useToast()
            showError(
                'Error de JavaScript',
                'Ha ocurrido un error en la aplicación.'
            )
        }
    })

    // Handle network errors
    const handleNetworkError = (error: any) => {
        const { error: showError } = useToast()

        if (!navigator.onLine) {
            showError(
                'Sin conexión',
                'No hay conexión a internet. Verifica tu conexión y vuelve a intentar.'
            )
        } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
            showError(
                'Error de red',
                'No se pudo conectar al servidor. Inténtalo de nuevo más tarde.'
            )
        }
    }

    // Provide error handler utilities
    nuxtApp.provide('errorHandler', {
        handleNetworkError,
        logError: (error: any, context: string) => {
            console.error(`🔥 ${context}:`, error)
        }
    })

    console.log('✅ Global error handler initialized')
})
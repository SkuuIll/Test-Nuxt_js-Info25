/**
 * Global Error Handler Plugin
 * Sets up global error handling for the entire application
 */

export default defineNuxtPlugin(() => {
    const { setupGlobalErrorHandlers, handleClientError, handleCriticalError } = useErrorHandler()

    // Setup global error handlers
    setupGlobalErrorHandlers()

    // Handle Vue errors
    const vueApp = useNuxtApp().vueApp

    vueApp.config.errorHandler = (error: any, instance: any, info: string) => {
        console.error('Vue Error Handler:', error, info)

        handleClientError({
            message: error.message || 'Vue Error',
            stack: error.stack,
            componentInfo: info,
            instance: instance?.$options?.name || 'Unknown Component'
        }, 'Vue Error Handler')
    }

    // Handle Nuxt errors
    const nuxtApp = useNuxtApp()

    nuxtApp.hook('app:error', (error) => {
        console.error('Nuxt App Error:', error)

        handleCriticalError({
            message: error.message || 'Nuxt Application Error',
            stack: error.stack,
            statusCode: error.statusCode,
            statusMessage: error.statusMessage
        }, 'Nuxt App Error')
    })

    // Handle route errors
    nuxtApp.hook('vue:error', (error, instance, info) => {
        console.error('Vue Route Error:', error, info)

        handleClientError({
            message: error.message || 'Vue Route Error',
            stack: error.stack,
            info
        }, 'Vue Route Error')
    })

    // Log successful plugin initialization
    console.log('🛡️ Global Error Handler Plugin initialized')
})
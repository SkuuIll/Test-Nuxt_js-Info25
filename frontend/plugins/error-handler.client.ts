/**
 * Global Error Handler Plugin
 * Initializes global error handling for the application
 */

export default defineNuxtPlugin((nuxtApp) => {
    const { handleError } = useGlobalErrorHandler()

    // Handle unhandled promise rejections
    if (import.meta.client) {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Unhandled Promise Rejection:', event.reason)

            handleError(event.reason || new Error('Unhandled promise rejection'), {
                context: {
                    component: 'global',
                    action: 'unhandled_promise_rejection',
                    additionalData: {
                        type: 'unhandledrejection',
                        url: window.location.href
                    }
                },
                showToast: true,
                logError: true,
                reportError: true
            })

            // Prevent the default browser behavior
            event.preventDefault()
        })

        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('🚨 Uncaught JavaScript Error:', event.error)

            handleError(event.error || new Error(event.message), {
                context: {
                    component: 'global',
                    action: 'uncaught_javascript_error',
                    additionalData: {
                        type: 'javascript_error',
                        filename: event.filename,
                        lineno: event.lineno,
                        colno: event.colno,
                        url: window.location.href
                    }
                },
                showToast: true,
                logError: true,
                reportError: true
            })
        })

        // Handle Vue errors
        nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
            console.error('🚨 Vue Error:', error, info)

            handleError(error, {
                context: {
                    component: instance?.$options.name || 'unknown',
                    action: 'vue_error',
                    additionalData: {
                        type: 'vue_error',
                        info,
                        componentName: instance?.$options.name,
                        url: window.location.href
                    }
                },
                showToast: true,
                logError: true,
                reportError: true
            })
        }

        // Handle Nuxt errors
        nuxtApp.hook('app:error', (error) => {
            console.error('🚨 Nuxt App Error:', error)

            handleError(error, {
                context: {
                    component: 'nuxt',
                    action: 'app_error',
                    additionalData: {
                        type: 'nuxt_error',
                        url: window.location.href
                    }
                },
                showToast: true,
                logError: true,
                reportError: true
            })
        })

        // Handle fetch errors globally
        const originalFetch = window.fetch
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args)

                // Handle HTTP error responses
                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
                        ; (error as any).status = response.status
                        ; (error as any).response = response

                    // Don't show toast for every failed request, let individual handlers decide
                    handleError(error, {
                        context: {
                            component: 'fetch',
                            action: 'http_error',
                            additionalData: {
                                type: 'fetch_error',
                                url: args[0],
                                status: response.status,
                                statusText: response.statusText
                            }
                        },
                        showToast: false, // Let individual API calls handle toasts
                        logError: true,
                        reportError: false
                    })
                }

                return response
            } catch (error) {
                // Handle network errors
                handleError(error as Error, {
                    context: {
                        component: 'fetch',
                        action: 'network_error',
                        additionalData: {
                            type: 'network_error',
                            url: args[0]
                        }
                    },
                    showToast: false, // Let individual API calls handle toasts
                    logError: true,
                    reportError: false
                })

                throw error
            }
        }

        console.log('✅ Global error handler initialized')
    }
})
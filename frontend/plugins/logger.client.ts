import { consola } from 'consola'

export default defineNuxtPlugin(() => {
    // Configurar consola para desarrollo
    if (process.dev) {
        consola.level = 4 // Debug level
        consola.withTag('🚀 NUXT')
    }

    // Interceptar errores globales de Vue
    const vueApp = useNuxtApp().vueApp

    vueApp.config.errorHandler = (error: any, instance: any, info: string) => {
        consola.error('🔥 Vue Error:', {
            error: error.message || error,
            stack: error.stack,
            component: instance?.$options.name || 'Unknown',
            info,
            timestamp: new Date().toISOString()
        })

        // También mostrar en consola del navegador para debugging
        console.group('🔥 Vue Error Details')
        console.error('Error:', error)
        console.error('Component:', instance?.$options.name || 'Unknown')
        console.error('Info:', info)
        console.error('Stack:', error.stack)
        console.groupEnd()
    }

    // Interceptar errores no manejados
    if (process.client) {
        window.addEventListener('error', (event) => {
            consola.error('🚨 Global Error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                timestamp: new Date().toISOString()
            })
        })

        window.addEventListener('unhandledrejection', (event) => {
            consola.error('🚨 Unhandled Promise Rejection:', {
                reason: event.reason,
                promise: event.promise,
                timestamp: new Date().toISOString()
            })
        })

        // Interceptar errores de fetch/axios
        const originalFetch = window.fetch
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args)

                if (!response.ok) {
                    consola.warn('🌐 HTTP Error:', {
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText,
                        timestamp: new Date().toISOString()
                    })
                }

                return response
            } catch (error) {
                consola.error('🌐 Fetch Error:', {
                    url: args[0],
                    error: error.message,
                    timestamp: new Date().toISOString()
                })
                throw error
            }
        }
    }

    // Logger personalizado para la aplicación
    const logger = {
        info: (message: string, data?: any) => {
            consola.info(`ℹ️ ${message}`, data)
        },
        success: (message: string, data?: any) => {
            consola.success(`✅ ${message}`, data)
        },
        warn: (message: string, data?: any) => {
            consola.warn(`⚠️ ${message}`, data)
        },
        error: (message: string, data?: any) => {
            consola.error(`❌ ${message}`, data)
        },
        debug: (message: string, data?: any) => {
            if (process.dev) {
                consola.debug(`🐛 ${message}`, data)
            }
        },
        api: (method: string, url: string, data?: any) => {
            consola.info(`🔗 API ${method.toUpperCase()}`, { url, data })
        },
        route: (from: string, to: string) => {
            consola.info(`🧭 Route Change`, { from, to })
        },
        theme: (theme: string) => {
            consola.info(`🎨 Theme Changed`, { theme })
        },
        auth: (action: string, data?: any) => {
            consola.info(`🔐 Auth ${action}`, data)
        }
    }

    // Hacer el logger disponible globalmente
    return {
        provide: {
            logger
        }
    }
})
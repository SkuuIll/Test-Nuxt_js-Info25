/**
 * Global media error handler plugin
 * Provides centralized error handling for all media files
 */

interface GlobalMediaErrorConfig {
    enableGlobalHandler: boolean
    enableErrorReporting: boolean
    enablePerformanceMonitoring: boolean
    maxErrorHistory: number
    reportingEndpoint?: string
}

export default defineNuxtPlugin((nuxtApp) => {
    const config: GlobalMediaErrorConfig = {
        enableGlobalHandler: true,
        enableErrorReporting: false, // Disable by default for privacy
        enablePerformanceMonitoring: true,
        maxErrorHistory: 100,
        reportingEndpoint: '/api/v1/media-errors'
    }

    // Global error statistics
    const globalErrorStats = reactive({
        totalErrors: 0,
        errorsByType: {} as Record<string, number>,
        errorsByDomain: {} as Record<string, number>,
        recentErrors: [] as Array<{
            src: string
            type: string
            timestamp: number
            userAgent: string
        }>
    })

    // Performance monitoring
    const performanceMetrics = reactive({
        averageLoadTime: 0,
        slowestLoad: 0,
        fastestLoad: Infinity,
        totalLoads: 0,
        failureRate: 0
    })

    // Global error handler for images
    const handleGlobalImageError = (event: Event) => {
        if (!config.enableGlobalHandler) return

        const img = event.target as HTMLImageElement
        if (!img || !img.src) return

        const errorType = classifyGlobalError(img.src)
        const domain = extractDomain(img.src)

        // Update statistics
        globalErrorStats.totalErrors++
        globalErrorStats.errorsByType[errorType] = (globalErrorStats.errorsByType[errorType] || 0) + 1
        globalErrorStats.errorsByDomain[domain] = (globalErrorStats.errorsByDomain[domain] || 0) + 1

        // Add to recent errors (with limit)
        globalErrorStats.recentErrors.unshift({
            src: img.src,
            type: errorType,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        })

        if (globalErrorStats.recentErrors.length > config.maxErrorHistory) {
            globalErrorStats.recentErrors = globalErrorStats.recentErrors.slice(0, config.maxErrorHistory)
        }

        // Update failure rate
        performanceMetrics.failureRate = globalErrorStats.totalErrors / (performanceMetrics.totalLoads + globalErrorStats.totalErrors)

        console.warn(`🌐 Global image error detected:`, {
            src: img.src,
            type: errorType,
            domain,
            alt: img.alt
        })

        // Report error if enabled
        if (config.enableErrorReporting && config.reportingEndpoint) {
            reportError({
                src: img.src,
                type: errorType,
                domain,
                alt: img.alt,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }
    }

    // Global load handler for performance monitoring
    const handleGlobalImageLoad = (event: Event) => {
        if (!config.enablePerformanceMonitoring) return

        const img = event.target as HTMLImageElement
        if (!img || !img.src) return

        // Calculate load time if performance API is available
        if (performance && performance.getEntriesByName) {
            const entries = performance.getEntriesByName(img.src, 'resource')
            if (entries.length > 0) {
                const entry = entries[entries.length - 1] as PerformanceResourceTiming
                const loadTime = entry.responseEnd - entry.startTime

                // Update performance metrics
                performanceMetrics.totalLoads++
                performanceMetrics.averageLoadTime =
                    (performanceMetrics.averageLoadTime * (performanceMetrics.totalLoads - 1) + loadTime) / performanceMetrics.totalLoads

                if (loadTime > performanceMetrics.slowestLoad) {
                    performanceMetrics.slowestLoad = loadTime
                }

                if (loadTime < performanceMetrics.fastestLoad) {
                    performanceMetrics.fastestLoad = loadTime
                }

                // Update failure rate
                performanceMetrics.failureRate = globalErrorStats.totalErrors / (performanceMetrics.totalLoads + globalErrorStats.totalErrors)
            }
        }
    }

    // Classify error type
    const classifyGlobalError = (src: string): string => {
        if (src.includes('/_ipx/')) return 'IPX_ERROR'
        if (src.startsWith('data:')) return 'DATA_URL_ERROR'
        if (src.startsWith('blob:')) return 'BLOB_ERROR'
        if (!src.startsWith('http') && !src.startsWith('/')) return 'INVALID_URL'
        if (!navigator.onLine) return 'NETWORK_ERROR'
        return 'LOAD_ERROR'
    }

    // Extract domain from URL
    const extractDomain = (src: string): string => {
        try {
            const url = new URL(src, window.location.origin)
            return url.hostname
        } catch (e) {
            return 'invalid-domain'
        }
    }

    // Report error to backend
    const reportError = async (errorData: any) => {
        try {
            await $fetch(config.reportingEndpoint!, {
                method: 'POST',
                body: errorData
            })
        } catch (e) {
            console.warn('Failed to report media error:', e)
        }
    }

    // Set up global event listeners
    if (process.client) {
        // Use capture phase to catch all image errors
        document.addEventListener('error', (event) => {
            if (event.target instanceof HTMLImageElement) {
                handleGlobalImageError(event)
            }
        }, true)

        // Monitor successful loads for performance metrics
        document.addEventListener('load', (event) => {
            if (event.target instanceof HTMLImageElement) {
                handleGlobalImageLoad(event)
            }
        }, true)

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            document.removeEventListener('error', handleGlobalImageError, true)
            document.removeEventListener('load', handleGlobalImageLoad, true)
        })
    }

    // Provide global media error utilities
    const mediaErrorUtils = {
        // Get current error statistics
        getErrorStats: () => ({
            ...globalErrorStats,
            performance: { ...performanceMetrics }
        }),

        // Clear error history
        clearErrorHistory: () => {
            globalErrorStats.totalErrors = 0
            globalErrorStats.errorsByType = {}
            globalErrorStats.errorsByDomain = {}
            globalErrorStats.recentErrors = []
        },

        // Configure global handler
        configure: (newConfig: Partial<GlobalMediaErrorConfig>) => {
            Object.assign(config, newConfig)
        },

        // Test image loading
        testImageLoad: (src: string): Promise<boolean> => {
            return new Promise((resolve) => {
                const img = new Image()
                img.onload = () => resolve(true)
                img.onerror = () => resolve(false)
                img.src = src
                setTimeout(() => resolve(false), 5000) // 5 second timeout
            })
        },

        // Preload critical images
        preloadCriticalImages: async (srcs: string[]) => {
            const results = await Promise.allSettled(
                srcs.map(src => mediaErrorUtils.testImageLoad(src))
            )

            const successful = results.filter(result =>
                result.status === 'fulfilled' && result.value
            ).length

            console.log(`✅ Preloaded ${successful}/${srcs.length} critical images`)
            return successful
        },

        // Get performance insights
        getPerformanceInsights: () => {
            const insights = []

            if (performanceMetrics.failureRate > 0.1) {
                insights.push({
                    type: 'warning',
                    message: `High failure rate: ${(performanceMetrics.failureRate * 100).toFixed(1)}%`
                })
            }

            if (performanceMetrics.averageLoadTime > 2000) {
                insights.push({
                    type: 'warning',
                    message: `Slow average load time: ${performanceMetrics.averageLoadTime.toFixed(0)}ms`
                })
            }

            const ipxErrors = globalErrorStats.errorsByType['IPX_ERROR'] || 0
            if (ipxErrors > 5) {
                insights.push({
                    type: 'error',
                    message: `Multiple IPX optimization failures: ${ipxErrors} errors`
                })
            }

            return insights
        }
    }

    // Provide utilities globally
    nuxtApp.provide('mediaError', mediaErrorUtils)

    // Development mode helpers
    if (process.env.NODE_ENV === 'development') {
        // Add global debug methods
        if (typeof window !== 'undefined') {
            (window as any).__mediaErrorDebug = {
                stats: () => mediaErrorUtils.getErrorStats(),
                insights: () => mediaErrorUtils.getPerformanceInsights(),
                clear: () => mediaErrorUtils.clearErrorHistory(),
                test: (src: string) => mediaErrorUtils.testImageLoad(src)
            }

            console.log('🔧 Media error debug tools available at window.__mediaErrorDebug')
        }
    }
})
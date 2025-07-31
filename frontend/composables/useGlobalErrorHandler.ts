/**
 * Global Error Handler Composable
 * Provides application-wide error handling functionality
 */

interface GlobalErrorState {
    isInitialized: boolean
    errorBoundaryActive: boolean
    criticalErrorCount: number
    lastCriticalError: Date | null
    errorReportingEnabled: boolean
    debugMode: boolean
}

export const useGlobalErrorHandler = () => {
    const {
        handleError,
        handleApiError,
        handleAuthError,
        handleValidationError,
        handleNetworkError,
        handleClientError,
        handleCriticalError,
        errors,
        errorStats,
        hasCriticalErrors,
        hasNetworkErrors,
        getErrorSummary,
        exportErrors,
        clearErrors
    } = useErrorHandler()

    // Global error state
    const globalErrorState = ref<GlobalErrorState>({
        isInitialized: false,
        errorBoundaryActive: false,
        criticalErrorCount: 0,
        lastCriticalError: null,
        errorReportingEnabled: true,
        debugMode: process.env.NODE_ENV === 'development'
    })

    // Error boundary component reference
    const errorBoundaryComponent = ref<any>(null)

    // Initialize global error handling
    const initializeGlobalErrorHandler = () => {
        if (globalErrorState.value.isInitialized) return

        console.log('🛡️ Initializing Global Error Handler...')

        // Set up error reporting configuration
        setupErrorReporting()

        // Set up error recovery mechanisms
        setupErrorRecovery()

        // Set up error monitoring
        setupErrorMonitoring()

        globalErrorState.value.isInitialized = true
        console.log('✅ Global Error Handler initialized')
    }

    // Setup error reporting configuration
    const setupErrorReporting = () => {
        // Configure error reporting based on environment
        if (import.meta.client) {
            const config = useRuntimeConfig()
            globalErrorState.value.errorReportingEnabled = config.public.errorReportingEnabled !== false
            globalErrorState.value.debugMode = config.public.debugMode === true
        }
    }

    // Setup error recovery mechanisms
    const setupErrorRecovery = () => {
        // Watch for critical errors and implement recovery strategies
        watch(hasCriticalErrors, (hasCritical) => {
            if (hasCritical) {
                handleCriticalErrorRecovery()
            }
        })

        // Watch for network errors and implement retry strategies
        watch(hasNetworkErrors, (hasNetwork) => {
            if (hasNetwork) {
                handleNetworkErrorRecovery()
            }
        })
    }

    // Setup error monitoring
    const setupErrorMonitoring = () => {
        // Monitor error frequency and patterns
        watch(errors, (newErrors) => {
            const criticalErrors = newErrors.filter(e => e.severity === 'critical')
            globalErrorState.value.criticalErrorCount = criticalErrors.length

            if (criticalErrors.length > 0) {
                globalErrorState.value.lastCriticalError = criticalErrors[0].timestamp
            }

            // Check for error patterns that might indicate systemic issues
            checkErrorPatterns(newErrors)
        }, { deep: true })
    }

    // Handle critical error recovery
    const handleCriticalErrorRecovery = () => {
        console.warn('🚨 Critical error detected, initiating recovery procedures...')

        // Activate error boundary
        globalErrorState.value.errorBoundaryActive = true

        // Clear non-essential data to free up memory
        clearNonEssentialData()

        // Attempt to restore application state
        attemptStateRecovery()

        // Show recovery UI
        showRecoveryInterface()
    }

    // Handle network error recovery
    const handleNetworkErrorRecovery = () => {
        console.warn('📡 Network errors detected, implementing recovery strategies...')

        // Implement offline mode if available
        enableOfflineMode()

        // Queue failed requests for retry
        queueFailedRequests()

        // Show network status indicator
        showNetworkStatusIndicator()
    }

    // Check for error patterns
    const checkErrorPatterns = (errorList: any[]) => {
        const recentErrors = errorList.filter(e =>
            Date.now() - new Date(e.timestamp).getTime() < 60000 // Last minute
        )

        // Check for error spikes
        if (recentErrors.length > 10) {
            console.warn('⚠️ Error spike detected:', recentErrors.length, 'errors in the last minute')
            handleErrorSpike(recentErrors)
        }

        // Check for repeated errors
        const errorGroups = groupErrorsByMessage(recentErrors)
        Object.entries(errorGroups).forEach(([message, errors]) => {
            if (errors.length > 3) {
                console.warn('⚠️ Repeated error detected:', message, errors.length, 'times')
                handleRepeatedError(message, errors)
            }
        })
    }

    // Group errors by message
    const groupErrorsByMessage = (errorList: any[]) => {
        return errorList.reduce((groups, error) => {
            const message = error.message
            if (!groups[message]) {
                groups[message] = []
            }
            groups[message].push(error)
            return groups
        }, {} as Record<string, any[]>)
    }

    // Handle error spike
    const handleErrorSpike = (recentErrors: any[]) => {
        // Temporarily disable non-critical error reporting
        globalErrorState.value.errorReportingEnabled = false

        // Clear old errors to prevent memory issues
        clearErrors()

        // Re-enable error reporting after a delay
        setTimeout(() => {
            globalErrorState.value.errorReportingEnabled = true
        }, 30000) // 30 seconds
    }

    // Handle repeated error
    const handleRepeatedError = (message: string, errorInstances: any[]) => {
        // Suppress further instances of this error for a period
        const suppressionKey = `error_suppressed_${btoa(message)}`

        if (import.meta.client) {
            sessionStorage.setItem(suppressionKey, Date.now().toString())
        }

        // Log the suppression
        console.warn(`🔇 Suppressing repeated error: "${message}" (${errorInstances.length} instances)`)
    }

    // Clear non-essential data
    const clearNonEssentialData = () => {
        try {
            if (import.meta.client) {
                // Clear caches
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => {
                            if (name.includes('non-essential')) {
                                caches.delete(name)
                            }
                        })
                    })
                }

                // Clear non-essential localStorage items
                const keysToRemove = []
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && (key.includes('cache') || key.includes('temp'))) {
                        keysToRemove.push(key)
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key))
            }
        } catch (error) {
            console.warn('Failed to clear non-essential data:', error)
        }
    }

    // Attempt state recovery
    const attemptStateRecovery = () => {
        try {
            // Try to restore from saved state
            if (import.meta.client) {
                const savedState = localStorage.getItem('app_recovery_state')
                if (savedState) {
                    const state = JSON.parse(savedState)
                    console.log('🔄 Attempting to restore application state...')

                    // This would depend on your state management solution
                    // For example, with Pinia:
                    // const store = useMainStore()
                    // store.$patch(state)
                }
            }
        } catch (error) {
            console.warn('Failed to restore application state:', error)
        }
    }

    // Show recovery interface
    const showRecoveryInterface = () => {
        const { error } = useToast()
        error(
            'Error crítico detectado',
            'La aplicación está intentando recuperarse. Si el problema persiste, recarga la página.',
            {
                duration: 0, // Persistent
                actions: [
                    {
                        label: 'Recargar página',
                        action: () => {
                            if (import.meta.client) {
                                window.location.reload()
                            }
                        }
                    },
                    {
                        label: 'Exportar errores',
                        action: () => exportErrors()
                    }
                ]
            }
        )
    }

    // Enable offline mode
    const enableOfflineMode = () => {
        // This would depend on your offline strategy
        console.log('📴 Enabling offline mode...')

        // Show offline indicator
        const { warning } = useToast()
        warning(
            'Modo sin conexión',
            'La aplicación está funcionando en modo sin conexión. Algunas funciones pueden estar limitadas.',
            { duration: 0 }
        )
    }

    // Queue failed requests for retry
    const queueFailedRequests = () => {
        // This would integrate with your API layer
        console.log('📥 Queueing failed requests for retry...')
    }

    // Show network status indicator
    const showNetworkStatusIndicator = () => {
        // This would show a persistent network status indicator
        console.log('📶 Showing network status indicator...')
    }

    // Create error report
    const createErrorReport = () => {
        const summary = getErrorSummary()
        const report = {
            timestamp: new Date().toISOString(),
            userAgent: import.meta.client ? navigator.userAgent : 'Server',
            url: import.meta.client ? window.location.href : 'Server',
            globalState: globalErrorState.value,
            errorSummary: summary,
            recentErrors: errors.value.slice(0, 10), // Last 10 errors
            systemInfo: {
                memory: import.meta.client && 'memory' in performance ? (performance as any).memory : null,
                connection: import.meta.client ? (navigator as any).connection : null,
                platform: import.meta.client ? navigator.platform : 'Server'
            }
        }

        return report
    }

    // Send error report to service
    const sendErrorReport = async (report: any) => {
        if (!globalErrorState.value.errorReportingEnabled) return

        try {
            // This would send to your error reporting service
            console.log('📤 Sending error report...', report)

            // Example: Send to your API
            // await $fetch('/api/error-reports', {
            //   method: 'POST',
            //   body: report
            // })

        } catch (error) {
            console.warn('Failed to send error report:', error)
        }
    }

    // Emergency reset
    const emergencyReset = () => {
        console.warn('🚨 Performing emergency reset...')

        try {
            // Clear all stored data
            if (import.meta.client) {
                localStorage.clear()
                sessionStorage.clear()
            }

            // Clear all errors
            clearErrors()

            // Reset global state
            globalErrorState.value = {
                isInitialized: true,
                errorBoundaryActive: false,
                criticalErrorCount: 0,
                lastCriticalError: null,
                errorReportingEnabled: true,
                debugMode: process.env.NODE_ENV === 'development'
            }

            // Reload the page
            if (import.meta.client) {
                window.location.reload()
            }
        } catch (error) {
            console.error('Emergency reset failed:', error)
        }
    }

    // Auto-initialize on client
    if (import.meta.client) {
        onMounted(() => {
            initializeGlobalErrorHandler()
        })
    }

    return {
        // State
        globalErrorState: readonly(globalErrorState),
        errorBoundaryComponent,

        // Core functionality
        initializeGlobalErrorHandler,

        // Error handling (re-exported from useErrorHandler)
        handleError,
        handleApiError,
        handleAuthError,
        handleValidationError,
        handleNetworkError,
        handleClientError,
        handleCriticalError,

        // Recovery and monitoring
        handleCriticalErrorRecovery,
        handleNetworkErrorRecovery,
        checkErrorPatterns,

        // Reporting
        createErrorReport,
        sendErrorReport,
        exportErrors,

        // Emergency functions
        emergencyReset,

        // State access
        errors,
        errorStats,
        hasCriticalErrors,
        hasNetworkErrors,
        getErrorSummary
    }
}
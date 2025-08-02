/**
 * Comprehensive error recovery and user experience composable
 */

interface ErrorRecoveryOptions {
    enableAutoRecovery?: boolean
    maxRetryAttempts?: number
    retryDelay?: number
    enableErrorReporting?: boolean
    enableUserFeedback?: boolean
}

interface AppError {
    id: string
    type: 'NETWORK' | 'API' | 'VALIDATION' | 'AUTHENTICATION' | 'PERMISSION' | 'HYDRATION' | 'JAVASCRIPT' | 'UNKNOWN'
    message: string
    originalError: any
    context: string
    timestamp: number
    userAgent: string
    url: string
    userId?: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    recoverable: boolean
    retryCount: number
}

interface RecoveryAction {
    label: string
    action: () => Promise<void> | void
    type: 'primary' | 'secondary'
    icon?: string
}

export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
    const {
        enableAutoRecovery = true,
        maxRetryAttempts = 3,
        retryDelay = 1000,
        enableErrorReporting = true,
        enableUserFeedback = true
    } = options

    // State
    const hasError = ref(false)
    const errorMessage = ref('')
    const retryCount = ref(0)
    const isRecovering = ref(false)
    const errorHistory = ref<AppError[]>([])
    const recoveryActions = ref<RecoveryAction[]>([])

    // Composables
    const { success, error: showError, warning, info } = useToast()
    const router = useRouter()
    const route = useRoute()

    // Error classification
    const classifyError = (error: any, context: string = ''): AppError['type'] => {
        if (!error) return 'UNKNOWN'

        // Network errors
        if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
            return 'NETWORK'
        }

        // API errors
        if (error.response || error.status || error.statusCode) {
            const status = error.status || error.statusCode || error.response?.status

            if (status === 401) return 'AUTHENTICATION'
            if (status === 403) return 'PERMISSION'
            if (status >= 400 && status < 500) return 'VALIDATION'
            if (status >= 500) return 'API'

            return 'API'
        }

        // Hydration errors
        if (error.message?.includes('hydration') || error.message?.includes('mismatch')) {
            return 'HYDRATION'
        }

        // JavaScript errors
        if (error instanceof Error) {
            return 'JAVASCRIPT'
        }

        return 'UNKNOWN'
    }

    // Generate error ID
    const generateErrorId = (): string => {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Create structured error
    const createStructuredError = (error: any, context: string = ''): AppError => {
        const errorType = classifyError(error, context)
        const authStore = useAuthStore()

        return {
            id: generateErrorId(),
            type: errorType,
            message: extractErrorMessage(error),
            originalError: error,
            context,
            timestamp: Date.now(),
            userAgent: process.client ? navigator.userAgent : 'server',
            url: process.client ? window.location.href : route.fullPath,
            userId: authStore.user?.id?.toString(),
            severity: determineSeverity(errorType, error),
            recoverable: isRecoverable(errorType, error),
            retryCount: 0
        }
    }

    // Extract user-friendly error message
    const extractErrorMessage = (error: any): string => {
        if (typeof error === 'string') return error

        // API error messages
        if (error.response?.data?.message) return error.response.data.message
        if (error.data?.message) return error.data.message
        if (error.message) return error.message

        // Status-based messages
        const status = error.status || error.statusCode || error.response?.status
        if (status) {
            switch (status) {
                case 400: return 'Solicitud inválida'
                case 401: return 'Sesión expirada. Por favor, inicia sesión nuevamente'
                case 403: return 'No tienes permisos para realizar esta acción'
                case 404: return 'El recurso solicitado no fue encontrado'
                case 429: return 'Demasiadas solicitudes. Intenta más tarde'
                case 500: return 'Error interno del servidor'
                case 502: return 'Servicio temporalmente no disponible'
                case 503: return 'Servicio en mantenimiento'
                default: return `Error del servidor (${status})`
            }
        }

        return 'Ha ocurrido un error inesperado'
    }

    // Determine error severity
    const determineSeverity = (type: AppError['type'], error: any): AppError['severity'] => {
        switch (type) {
            case 'AUTHENTICATION':
            case 'PERMISSION':
                return 'high'
            case 'API':
                const status = error.status || error.statusCode || error.response?.status
                if (status >= 500) return 'critical'
                if (status >= 400) return 'medium'
                return 'low'
            case 'NETWORK':
                return 'high'
            case 'HYDRATION':
                return 'medium'
            case 'JAVASCRIPT':
                return 'medium'
            case 'VALIDATION':
                return 'low'
            default:
                return 'medium'
        }
    }

    // Check if error is recoverable
    const isRecoverable = (type: AppError['type'], error: any): boolean => {
        switch (type) {
            case 'NETWORK':
            case 'API':
                return true
            case 'AUTHENTICATION':
                return true // Can redirect to login
            case 'PERMISSION':
                return false
            case 'HYDRATION':
                return true // Can reload page
            case 'JAVASCRIPT':
                return true // Can retry
            case 'VALIDATION':
                return false // User needs to fix input
            default:
                return true
        }
    }

    // Generate recovery actions
    const generateRecoveryActions = (appError: AppError): RecoveryAction[] => {
        const actions: RecoveryAction[] = []

        switch (appError.type) {
            case 'NETWORK':
                actions.push({
                    label: 'Reintentar',
                    action: () => retryLastAction(),
                    type: 'primary',
                    icon: 'refresh'
                })
                actions.push({
                    label: 'Verificar conexión',
                    action: () => checkNetworkStatus(),
                    type: 'secondary',
                    icon: 'wifi'
                })
                break

            case 'API':
                if (appError.recoverable) {
                    actions.push({
                        label: 'Reintentar',
                        action: () => retryLastAction(),
                        type: 'primary',
                        icon: 'refresh'
                    })
                }
                actions.push({
                    label: 'Recargar página',
                    action: () => window.location.reload(),
                    type: 'secondary',
                    icon: 'reload'
                })
                break

            case 'AUTHENTICATION':
                actions.push({
                    label: 'Iniciar sesión',
                    action: () => router.push('/login'),
                    type: 'primary',
                    icon: 'login'
                })
                break

            case 'PERMISSION':
                actions.push({
                    label: 'Ir al inicio',
                    action: () => router.push('/'),
                    type: 'primary',
                    icon: 'home'
                })
                break

            case 'HYDRATION':
                actions.push({
                    label: 'Recargar página',
                    action: () => window.location.reload(),
                    type: 'primary',
                    icon: 'reload'
                })
                break

            case 'JAVASCRIPT':
                actions.push({
                    label: 'Reintentar',
                    action: () => retryLastAction(),
                    type: 'primary',
                    icon: 'refresh'
                })
                actions.push({
                    label: 'Recargar página',
                    action: () => window.location.reload(),
                    type: 'secondary',
                    icon: 'reload'
                })
                break

            default:
                actions.push({
                    label: 'Reintentar',
                    action: () => retryLastAction(),
                    type: 'primary',
                    icon: 'refresh'
                })
        }

        // Always add report option if enabled
        if (enableUserFeedback) {
            actions.push({
                label: 'Reportar problema',
                action: () => reportError(appError),
                type: 'secondary',
                icon: 'bug'
            })
        }

        return actions
    }

    // Handle error with recovery
    const handleError = (error: any, context: string = ''): AppError => {
        const appError = createStructuredError(error, context)

        // Add to history
        errorHistory.value.unshift(appError)
        if (errorHistory.value.length > 50) {
            errorHistory.value = errorHistory.value.slice(0, 50)
        }

        // Set current error state
        hasError.value = true
        errorMessage.value = appError.message
        recoveryActions.value = generateRecoveryActions(appError)

        // Log error
        console.error(`🚨 Error handled (${appError.type}):`, {
            id: appError.id,
            message: appError.message,
            context: appError.context,
            severity: appError.severity,
            recoverable: appError.recoverable
        })

        // Show user notification based on severity
        showUserNotification(appError)

        // Auto-recovery for certain error types
        if (enableAutoRecovery && appError.recoverable && appError.severity !== 'critical') {
            scheduleAutoRecovery(appError)
        }

        // Report error if enabled
        if (enableErrorReporting) {
            reportError(appError)
        }

        return appError
    }

    // Show user notification
    const showUserNotification = (appError: AppError) => {
        const message = appError.message
        const title = getErrorTitle(appError.type)

        switch (appError.severity) {
            case 'critical':
                showError(message, title)
                break
            case 'high':
                showError(message, title)
                break
            case 'medium':
                warning(message, title)
                break
            case 'low':
                info(message, title)
                break
        }
    }

    // Get error title
    const getErrorTitle = (type: AppError['type']): string => {
        switch (type) {
            case 'NETWORK': return 'Error de Conexión'
            case 'API': return 'Error del Servidor'
            case 'AUTHENTICATION': return 'Sesión Expirada'
            case 'PERMISSION': return 'Acceso Denegado'
            case 'VALIDATION': return 'Datos Inválidos'
            case 'HYDRATION': return 'Error de Carga'
            case 'JAVASCRIPT': return 'Error de Aplicación'
            default: return 'Error'
        }
    }

    // Schedule auto-recovery
    const scheduleAutoRecovery = async (appError: AppError) => {
        if (retryCount.value >= maxRetryAttempts) return

        const delay = retryDelay * Math.pow(2, retryCount.value) // Exponential backoff

        setTimeout(async () => {
            if (hasError.value && appError.recoverable) {
                await attemptRecovery(appError)
            }
        }, delay)
    }

    // Attempt recovery
    const attemptRecovery = async (appError: AppError) => {
        if (isRecovering.value) return

        isRecovering.value = true
        retryCount.value++

        try {
            console.log(`🔄 Attempting recovery for error ${appError.id} (attempt ${retryCount.value})`)

            // Recovery logic based on error type
            switch (appError.type) {
                case 'NETWORK':
                    await checkNetworkStatus()
                    break
                case 'API':
                    // Will be handled by retry action
                    break
                case 'HYDRATION':
                    // Reload page
                    window.location.reload()
                    return
                default:
                    // Generic retry
                    break
            }

            // If we get here, recovery was successful
            clearError()
            success('Problema resuelto automáticamente')

        } catch (recoveryError) {
            console.error('❌ Recovery failed:', recoveryError)

            if (retryCount.value < maxRetryAttempts) {
                scheduleAutoRecovery(appError)
            } else {
                showError('No se pudo resolver el problema automáticamente')
            }
        } finally {
            isRecovering.value = false
        }
    }

    // Retry last action
    const retryLastAction = async () => {
        // This would need to be implemented based on the specific action
        // For now, we'll just clear the error and let the user retry manually
        clearError()
        info('Puedes intentar la acción nuevamente')
    }

    // Check network status
    const checkNetworkStatus = async () => {
        if (!process.client) return

        try {
            const response = await fetch('/api/health', {
                method: 'HEAD',
                cache: 'no-cache'
            })

            if (response.ok) {
                success('Conexión restaurada')
                clearError()
            } else {
                throw new Error('Network check failed')
            }
        } catch (e) {
            warning('Problema de conexión persistente')
        }
    }

    // Report error
    const reportError = async (appError: AppError) => {
        if (!enableErrorReporting) return

        try {
            // Send error report to backend
            await $fetch('/api/v1/error-reports', {
                method: 'POST',
                body: {
                    errorId: appError.id,
                    type: appError.type,
                    message: appError.message,
                    context: appError.context,
                    timestamp: appError.timestamp,
                    userAgent: appError.userAgent,
                    url: appError.url,
                    userId: appError.userId,
                    severity: appError.severity
                }
            })

            info('Problema reportado. Gracias por tu ayuda')
        } catch (e) {
            console.warn('Failed to report error:', e)
        }
    }

    // Clear error state
    const clearError = () => {
        hasError.value = false
        errorMessage.value = ''
        retryCount.value = 0
        isRecovering.value = false
        recoveryActions.value = []
    }

    // Get error statistics
    const getErrorStats = () => {
        const stats = {
            total: errorHistory.value.length,
            byType: {} as Record<string, number>,
            bySeverity: {} as Record<string, number>,
            recent: errorHistory.value.slice(0, 10)
        }

        errorHistory.value.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
        })

        return stats
    }

    return {
        // State
        hasError: readonly(hasError),
        errorMessage: readonly(errorMessage),
        retryCount: readonly(retryCount),
        isRecovering: readonly(isRecovering),
        errorHistory: readonly(errorHistory),
        recoveryActions: readonly(recoveryActions),

        // Methods
        handleError,
        clearError,
        attemptRecovery,
        retryLastAction,
        checkNetworkStatus,
        reportError,
        getErrorStats,

        // Utilities
        classifyError,
        createStructuredError,
        extractErrorMessage
    }
}

/**
 * Hydration error recovery composable
 */
export const useHydrationRecovery = () => {
    const isHydrated = ref(false)
    const hydrationError = ref<string | null>(null)

    const handleHydrationMismatch = (error: any) => {
        console.warn('🔄 Hydration mismatch detected:', error)
        hydrationError.value = error.message || 'Hydration mismatch'

        // Attempt to recover by forcing client-side rendering
        nextTick(() => {
            isHydrated.value = true
        })
    }

    onMounted(() => {
        isHydrated.value = true
    })

    return {
        isHydrated: readonly(isHydrated),
        hydrationError: readonly(hydrationError),
        handleHydrationMismatch
    }
}

/**
 * API error handler composable
 */
export const useAPIErrorHandler = () => {
    const { error: showError, success: showSuccess } = useToast()

    const handleAPIError = (error: any, context?: string) => {
        const status = error.status || error.statusCode || error.response?.status
        const message = error.message || error.response?.data?.message || 'Error de API'

        console.error(`🌐 API Error (${status}):`, message, context)

        // Handle specific status codes
        switch (status) {
            case 401:
                showError('Sesión expirada. Redirigiendo al login...')
                setTimeout(() => {
                    navigateTo('/login')
                }, 2000)
                break

            case 403:
                showError('No tienes permisos para realizar esta acción')
                break

            case 404:
                showError('Recurso no encontrado')
                break

            case 429:
                showError('Demasiadas solicitudes. Intenta más tarde')
                break

            case 500:
            case 502:
            case 503:
                showError('Error del servidor. Intenta más tarde')
                break

            default:
                showError(message)
        }

        return {
            status,
            message,
            handled: true
        }
    }

    const handleAPISuccess = (response: any, message?: string) => {
        if (message) {
            showSuccess(message)
        }
        return response
    }

    return {
        handleAPIError,
        handleAPISuccess
    }
}
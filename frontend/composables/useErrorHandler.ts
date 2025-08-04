/**
 * Consolidated Error Handler Composable
 * Combines functionality from useErrorHandler, useGlobalErrorHandler, useFormErrorHandler, and useErrorRecovery
 */

import type { ApiError, ValidationErrors } from '~/types'

// ===== INTERFACES =====

interface ErrorContext {
    component?: string
    action?: string
    userId?: string | number
    url?: string
    timestamp?: number
    severity?: 'low' | 'medium' | 'high' | 'critical'
    additionalData?: Record<string, any>
}

interface ErrorReport {
    id: string
    message: string
    stack?: string
    context: ErrorContext
    userAgent: string
    resolved: boolean
    reportedAt: number
    type: ErrorType
    retryCount: number
}

interface ErrorHandlerOptions {
    enableReporting?: boolean
    enableToasts?: boolean
    enableLogging?: boolean
    reportingEndpoint?: string
    maxRetries?: number
    retryDelay?: number
    showOnTouch?: boolean
    showOnSubmit?: boolean
    clearOnInput?: boolean
    scrollToError?: boolean
    focusOnError?: boolean
    fieldLabels?: Record<string, string>
}

interface FormError {
    field: string
    message: string
    code?: string
    value?: any
}

interface FormErrorState {
    errors: Record<string, FormError[]>
    hasErrors: boolean
    errorCount: number
    touchedFields: Set<string>
    showErrors: boolean
}

interface RecoveryAction {
    label: string
    action: () => Promise<void> | void
    type: 'primary' | 'secondary'
    icon?: string
}

type ErrorType = 'NETWORK' | 'API' | 'VALIDATION' | 'AUTHENTICATION' | 'PERMISSION' | 'HYDRATION' | 'JAVASCRIPT' | 'UNKNOWN'

// ===== MAIN COMPOSABLE =====

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
    const {
        enableReporting = true,
        enableToasts = true,
        enableLogging = true,
        reportingEndpoint = '/api/v1/errors',
        maxRetries = 3,
        retryDelay = 1000,
        showOnTouch = true,
        showOnSubmit = true,
        clearOnInput = true,
        scrollToError = true,
        focusOnError = true,
        fieldLabels = {}
    } = options

    // ===== STATE =====

    // General error state
    const errorHistory = ref<ErrorReport[]>([])
    const isReporting = ref(false)
    const retryCount = ref(0)
    const globalError = ref<string | null>(null)
    const isOnline = ref(true)
    const retryQueue = ref<Array<{
        fn: Function
        context: ErrorContext
        attempts: number
        maxAttempts: number
    }>>([])

    // Form error state
    const formErrorState = ref<FormErrorState>({
        errors: {},
        hasErrors: false,
        errorCount: 0,
        touchedFields: new Set(),
        showErrors: false
    })

    // Recovery state
    const hasError = ref(false)
    const errorMessage = ref('')
    const isRecovering = ref(false)
    const recoveryActions = ref<RecoveryAction[]>([])

    // ===== COMPOSABLES =====

    const { error: showError, warning, info, success } = useToast()
    const authStore = useAuthStore()
    const router = useRouter()
    const route = useRoute()

    // ===== NETWORK MONITORING =====

    if (import.meta.client) {
        isOnline.value = navigator.onLine

        window.addEventListener('online', () => {
            isOnline.value = true
            processRetryQueue()
        })

        window.addEventListener('offline', () => {
            isOnline.value = false
        })
    }

    // ===== UTILITY FUNCTIONS =====

    const generateErrorId = (): string => {
        return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const classifyError = (error: any, context?: ErrorContext): ErrorType => {
        if (!error) return 'UNKNOWN'

        // Network errors
        if (!isOnline.value) return 'NETWORK'
        if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') return 'NETWORK'
        if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) return 'NETWORK'

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

    const classifyErrorSeverity = (error: Error, context?: ErrorContext): ErrorContext['severity'] => {
        const message = error.message.toLowerCase()
        const errorType = classifyError(error, context)

        switch (errorType) {
            case 'AUTHENTICATION':
            case 'PERMISSION':
                return 'high'
            case 'API':
                const status = (error as any).status || (error as any).statusCode || (error as any).response?.status
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
                if (message.includes('critical') || message.includes('fatal')) return 'critical'
                if (message.includes('network') || message.includes('fetch')) return 'medium'
                if (message.includes('auth') || message.includes('permission')) return 'high'
                if (context?.component?.includes('auth') || context?.component?.includes('payment')) return 'high'
                return 'low'
        }
    }

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
                case 422: return 'Los datos ingresados no son válidos'
                case 429: return 'Demasiadas solicitudes. Intenta más tarde'
                case 500: return 'Error interno del servidor'
                case 502: return 'Servicio temporalmente no disponible'
                case 503: return 'Servicio en mantenimiento'
                default: return `Error del servidor (${status})`
            }
        }

        return 'Ha ocurrido un error inesperado'
    }

    const isRecoverable = (type: ErrorType, error: any): boolean => {
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

    // ===== MAIN ERROR HANDLING =====

    const handleError = (error: Error | string | any, context: ErrorContext = {}): ErrorReport => {
        const errorObj = typeof error === 'string' ? new Error(error) : error
        const errorType = classifyError(errorObj, context)
        const severity = classifyErrorSeverity(errorObj, context)

        const errorReport: ErrorReport = {
            id: generateErrorId(),
            message: extractErrorMessage(errorObj),
            stack: errorObj.stack,
            context: {
                ...context,
                severity,
                userId: authStore.user?.id?.toString(),
                url: process.client ? window.location.href : route.fullPath,
                timestamp: Date.now()
            },
            userAgent: process.client ? navigator.userAgent : 'server',
            resolved: false,
            reportedAt: Date.now(),
            type: errorType,
            retryCount: 0
        }

        // Add to history
        errorHistory.value.unshift(errorReport)
        if (errorHistory.value.length > 50) {
            errorHistory.value = errorHistory.value.slice(0, 50)
        }

        // Set global error state
        globalError.value = errorReport.message
        hasError.value = true
        errorMessage.value = errorReport.message

        // Log error
        if (enableLogging) {
            console.error(`🚨 [${severity?.toUpperCase()}] Error in ${context.component || 'Unknown'}:`, errorObj)
            console.error('📋 Context:', context)
        }

        // Show toast notification
        if (enableToasts) {
            showUserFriendlyError(errorObj, severity, errorType)
        }

        // Generate recovery actions
        recoveryActions.value = generateRecoveryActions(errorReport)

        // Handle specific error types
        handleSpecificErrorTypes(errorType, context, errorReport)

        // Report error
        if (enableReporting && severity !== 'low') {
            reportError(errorReport)
        }

        return errorReport
    }

    const showUserFriendlyError = (error: Error, severity: ErrorContext['severity'], type: ErrorType) => {
        const message = extractErrorMessage(error)
        const title = getErrorTitle(type)

        switch (severity) {
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
            default:
                showError(message, title)
        }
    }

    const getErrorTitle = (type: ErrorType): string => {
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

    // ===== API ERROR HANDLING =====

    const handleApiError = (error: any, context: ErrorContext = {}): ErrorReport => {
        return handleError(error, {
            ...context,
            action: 'api_call'
        })
    }

    // ===== VALIDATION ERROR HANDLING =====

    const handleValidationErrors = (errors: ValidationErrors | Record<string, string[]>, context: ErrorContext = {}): ErrorReport => {
        const errorMessages = []

        for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
                errorMessages.push(`${field}: ${fieldErrors.join(', ')}`)
            } else {
                errorMessages.push(`${field}: ${fieldErrors}`)
            }
        }

        const combinedMessage = errorMessages.join('; ')

        return handleError(new Error(`Errores de validación: ${combinedMessage}`), {
            ...context,
            action: 'validation',
            severity: 'low'
        })
    }

    // ===== FORM ERROR HANDLING =====

    // Form error computed properties
    const formErrors = computed(() => formErrorState.value.errors)
    const hasFormErrors = computed(() => formErrorState.value.hasErrors)
    const formErrorCount = computed(() => formErrorState.value.errorCount)
    const showFormErrors = computed(() => formErrorState.value.showErrors)

    const getFieldErrors = (field: string): FormError[] => {
        return formErrorState.value.errors[field] || []
    }

    const hasFieldError = (field: string): boolean => {
        return getFieldErrors(field).length > 0
    }

    const getFieldError = (field: string): string | null => {
        const fieldErrors = getFieldErrors(field)
        return fieldErrors.length > 0 ? fieldErrors[0].message : null
    }

    const setFieldError = (field: string, message: string, code?: string, value?: any) => {
        const error: FormError = { field, message, code, value }

        if (!formErrorState.value.errors[field]) {
            formErrorState.value.errors[field] = []
        }

        formErrorState.value.errors[field] = [error]
        updateFormErrorState()
    }

    const clearFieldError = (field: string) => {
        delete formErrorState.value.errors[field]
        updateFormErrorState()
    }

    const clearAllFormErrors = () => {
        formErrorState.value.errors = {}
        updateFormErrorState()
    }

    const updateFormErrorState = () => {
        const errorEntries = Object.entries(formErrorState.value.errors)
        formErrorState.value.hasErrors = errorEntries.length > 0
        formErrorState.value.errorCount = errorEntries.reduce(
            (count, [, fieldErrors]) => count + fieldErrors.length,
            0
        )
    }

    const handleApiValidationErrors = (error: any) => {
        const errorReport = handleValidationErrors(error.data?.errors || error.errors || {})

        if (error.data?.errors || error.errors) {
            clearAllFormErrors()

            const errors = error.data?.errors || error.errors
            Object.entries(errors).forEach(([field, messages]) => {
                const messageArray = Array.isArray(messages) ? messages : [messages]
                messageArray.forEach((message: string) => {
                    setFieldError(field, message)
                })
            })

            showFormErrorsState()

            if (scrollToError) {
                scrollToFirstError()
            }

            if (focusOnError) {
                focusFirstErrorField()
            }
        }

        return errorReport
    }

    const touchField = (field: string) => {
        formErrorState.value.touchedFields.add(field)

        if (showOnTouch && hasFieldError(field)) {
            formErrorState.value.showErrors = true
        }
    }

    const handleFieldInput = (field: string, value: any) => {
        if (clearOnInput && hasFieldError(field)) {
            clearFieldError(field)
        }

        touchField(field)
    }

    const showFormErrorsState = () => {
        formErrorState.value.showErrors = true
    }

    const hideFormErrorsState = () => {
        formErrorState.value.showErrors = false
    }

    const shouldShowFieldError = (field: string): boolean => {
        if (!hasFieldError(field)) return false
        if (!formErrorState.value.showErrors) return false

        if (showOnTouch && formErrorState.value.touchedFields.has(field)) {
            return true
        }

        if (showOnSubmit && formErrorState.value.showErrors) {
            return true
        }

        return false
    }

    const scrollToFirstError = () => {
        if (!import.meta.client) return

        const firstErrorField = Object.keys(formErrorState.value.errors)[0]
        if (!firstErrorField) return

        const fieldElement = document.querySelector(`[name="${firstErrorField}"]`) ||
            document.querySelector(`#${firstErrorField}`) ||
            document.querySelector(`[data-field="${firstErrorField}"]`)

        if (fieldElement) {
            fieldElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }

    const focusFirstErrorField = () => {
        if (!import.meta.client) return

        const firstErrorField = Object.keys(formErrorState.value.errors)[0]
        if (!firstErrorField) return

        const fieldElement = document.querySelector(`[name="${firstErrorField}"]`) ||
            document.querySelector(`#${firstErrorField}`) as HTMLElement

        if (fieldElement && 'focus' in fieldElement) {
            setTimeout(() => {
                fieldElement.focus()
            }, 100)
        }
    }

    const getFieldLabel = (field: string): string => {
        if (fieldLabels[field]) {
            return fieldLabels[field]
        }

        return field
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
    }

    // ===== RECOVERY FUNCTIONS =====

    const generateRecoveryActions = (errorReport: ErrorReport): RecoveryAction[] => {
        const actions: RecoveryAction[] = []

        switch (errorReport.type) {
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
                if (errorReport.context.severity !== 'critical') {
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

            default:
                actions.push({
                    label: 'Reintentar',
                    action: () => retryLastAction(),
                    type: 'primary',
                    icon: 'refresh'
                })
        }

        if (enableReporting) {
            actions.push({
                label: 'Reportar problema',
                action: () => reportError(errorReport),
                type: 'secondary',
                icon: 'bug'
            })
        }

        return actions
    }

    const handleSpecificErrorTypes = (type: ErrorType, context: ErrorContext, errorReport: ErrorReport) => {
        switch (type) {
            case 'AUTHENTICATION':
                if (authStore.isAuthenticated) {
                    authStore.logout()
                }
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
                break

            case 'PERMISSION':
                console.warn('Access denied for:', context)
                break

            case 'NETWORK':
                if (isRecoverable(type, errorReport)) {
                    addToRetryQueue(context)
                }
                break
        }
    }

    const addToRetryQueue = (context: ErrorContext) => {
        if (!context.action) return

        const existingItem = retryQueue.value.find(item =>
            item.context.action === context.action &&
            item.context.component === context.component
        )

        if (existingItem) {
            existingItem.attempts += 1
            if (existingItem.attempts >= existingItem.maxAttempts) {
                retryQueue.value = retryQueue.value.filter(item => item !== existingItem)
            }
        } else {
            retryQueue.value.push({
                fn: () => { },
                context,
                attempts: 1,
                maxAttempts: maxRetries
            })
        }
    }

    const processRetryQueue = async () => {
        if (!isOnline.value || retryQueue.value.length === 0) return

        console.log('🔄 Processing retry queue:', retryQueue.value.length, 'items')

        const itemsToRetry = [...retryQueue.value]
        retryQueue.value = []

        for (const item of itemsToRetry) {
            try {
                await item.fn()
                console.log('✅ Retry successful for:', item.context.action)
            } catch (error) {
                console.warn('❌ Retry failed for:', item.context.action)
                if (item.attempts < item.maxAttempts) {
                    addToRetryQueue(item.context)
                }
            }
        }
    }

    const retryLastAction = async () => {
        clearError()
        info('Puedes intentar la acción nuevamente')
    }

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

    // ===== REPORTING =====

    const reportError = async (errorReport: ErrorReport) => {
        if (isReporting.value || !enableReporting) return

        isReporting.value = true

        try {
            const { $fetch } = useNuxtApp()

            await $fetch(reportingEndpoint, {
                method: 'POST',
                body: {
                    id: errorReport.id,
                    message: errorReport.message,
                    stack: errorReport.stack,
                    context: errorReport.context,
                    userAgent: errorReport.userAgent,
                    reportedAt: errorReport.reportedAt,
                    type: errorReport.type
                }
            })

            const index = errorHistory.value.findIndex(e => e.id === errorReport.id)
            if (index !== -1) {
                errorHistory.value[index].resolved = true
            }

            if (enableLogging) {
                console.log('✅ Error reported successfully:', errorReport.id)
            }

        } catch (reportingError) {
            if (enableLogging) {
                console.warn('❌ Failed to report error:', reportingError)
            }
        } finally {
            isReporting.value = false
        }
    }

    // ===== RETRY MECHANISM =====

    const withRetry = async <T>(
        operation: () => Promise<T>,
        context: ErrorContext = {}
    ): Promise<T> => {
        let lastError: Error

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation()

                if (attempt > 0) {
                    retryCount.value = 0
                    info(`Operación exitosa después de ${attempt} reintentos`)
                }

                return result
            } catch (error) {
                lastError = error as Error

                if (attempt === maxRetries) {
                    handleError(lastError, {
                        ...context,
                        action: 'retry_failed'
                    })
                    throw lastError
                }

                const delay = retryDelay * Math.pow(2, attempt)
                await new Promise(resolve => setTimeout(resolve, delay))

                retryCount.value = attempt + 1

                if (enableLogging) {
                    console.log(`🔄 Retrying operation (${attempt + 1}/${maxRetries}) in ${delay}ms`)
                }
            }
        }

        throw lastError!
    }

    // ===== CLEANUP AND UTILITIES =====

    const clearError = () => {
        globalError.value = null
        hasError.value = false
        errorMessage.value = ''
        retryCount.value = 0
        isRecovering.value = false
        recoveryActions.value = []
    }

    const clearErrorHistory = () => {
        errorHistory.value = []
        retryCount.value = 0
    }

    const getErrorStats = () => {
        const stats = {
            total: errorHistory.value.length,
            resolved: errorHistory.value.filter(e => e.resolved).length,
            bySeverity: {} as Record<string, number>,
            byComponent: {} as Record<string, number>,
            byType: {} as Record<string, number>,
            recent: errorHistory.value.slice(0, 10)
        }

        errorHistory.value.forEach(error => {
            const severity = error.context.severity || 'unknown'
            const component = error.context.component || 'unknown'
            const type = error.type

            stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1
            stats.byComponent[component] = (stats.byComponent[component] || 0) + 1
            stats.byType[type] = (stats.byType[type] || 0) + 1
        })

        return stats
    }

    const resetFormErrors = () => {
        formErrorState.value = {
            errors: {},
            hasErrors: false,
            errorCount: 0,
            touchedFields: new Set(),
            showErrors: false
        }
    }

    // ===== VALIDATION RULES =====

    const validationRules = {
        required: (message = 'Este campo es requerido') => (value: any) => {
            if (value === null || value === undefined || value === '') {
                return message
            }
            return true
        },

        minLength: (min: number, message?: string) => (value: string) => {
            if (value && value.length < min) {
                return message || `Debe tener al menos ${min} caracteres`
            }
            return true
        },

        maxLength: (max: number, message?: string) => (value: string) => {
            if (value && value.length > max) {
                return message || `No debe exceder ${max} caracteres`
            }
            return true
        },

        email: (message = 'Debe ser un email válido') => (value: string) => {
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return message
            }
            return true
        },

        pattern: (regex: RegExp, message = 'Formato inválido') => (value: string) => {
            if (value && !regex.test(value)) {
                return message
            }
            return true
        },

        numeric: (message = 'Debe ser un número') => (value: any) => {
            if (value && isNaN(Number(value))) {
                return message
            }
            return true
        },

        min: (min: number, message?: string) => (value: number) => {
            if (value !== null && value !== undefined && Number(value) < min) {
                return message || `Debe ser mayor o igual a ${min}`
            }
            return true
        },

        max: (max: number, message?: string) => (value: number) => {
            if (value !== null && value !== undefined && Number(value) > max) {
                return message || `Debe ser menor o igual a ${max}`
            }
            return true
        }
    }

    const validateField = (field: string, value: any, rules: any[] = []): boolean => {
        clearFieldError(field)

        for (const rule of rules) {
            const result = rule(value)
            if (result !== true) {
                setFieldError(field, result)
                return false
            }
        }

        return true
    }

    const validateFields = (fieldsData: Record<string, { value: any; rules?: any[] }>): boolean => {
        let isValid = true

        Object.entries(fieldsData).forEach(([field, { value, rules = [] }]) => {
            const fieldValid = validateField(field, value, rules)
            if (!fieldValid) {
                isValid = false
            }
        })

        if (!isValid) {
            showFormErrorsState()
            if (scrollToError) scrollToFirstError()
            if (focusOnError) focusFirstErrorField()
        }

        return isValid
    }

    return {
        // ===== STATE =====
        errorHistory: readonly(errorHistory),
        isReporting: readonly(isReporting),
        retryCount: readonly(retryCount),
        globalError: readonly(globalError),
        isOnline: readonly(isOnline),
        hasError: readonly(hasError),
        errorMessage: readonly(errorMessage),
        isRecovering: readonly(isRecovering),
        recoveryActions: readonly(recoveryActions),

        // Form error state
        formErrors,
        hasFormErrors,
        formErrorCount,

        // ===== MAIN ERROR HANDLING =====
        handleError,
        handleApiError,
        handleValidationErrors,
        withRetry,
        clearError,
        clearErrorHistory,

        // ===== FORM ERROR HANDLING =====
        getFieldErrors,
        hasFieldError,
        getFieldError,
        setFieldError,
        clearFieldError,
        clearAllFormErrors,
        handleApiValidationErrors,
        touchField,
        handleFieldInput,
        shouldShowFieldError,
        showFormErrors: showFormErrorsState,
        hideFormErrors: hideFormErrorsState,
        scrollToFirstError,
        focusFirstErrorField,
        getFieldLabel,
        resetFormErrors,

        // ===== VALIDATION =====
        validateField,
        validateFields,
        validationRules,

        // ===== RECOVERY =====
        retryLastAction,
        checkNetworkStatus,

        // ===== UTILITIES =====
        generateErrorId,
        classifyError,
        getErrorStats,
        reportError
    }
}

// ===== SPECIALIZED COMPOSABLES =====

export const useHydrationRecovery = () => {
    const isHydrated = ref(false)
    const hydrationError = ref<string | null>(null)

    const handleHydrationMismatch = (error: any) => {
        console.warn('🔄 Hydration mismatch detected:', error)
        hydrationError.value = error.message || 'Hydration mismatch'

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

export const useAPIErrorHandler = () => {
    const { handleApiError } = useErrorHandler()

    const handleAPIError = (error: any, context?: string) => {
        return handleApiError(error, { component: context })
    }

    const handleAPISuccess = (response: any, message?: string) => {
        if (message) {
            const { success } = useToast()
            success(message)
        }
        return response
    }

    return {
        handleAPIError,
        handleAPISuccess
    }
}
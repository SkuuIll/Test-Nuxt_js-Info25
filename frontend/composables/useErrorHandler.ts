interface ErrorInfo {
  id: string
  message: string
  code?: string | number
  details?: any
  timestamp: Date
  context?: string
  type: 'api' | 'auth' | 'validation' | 'network' | 'client' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  retryable: boolean
  retryCount?: number
  userAgent?: string
  url?: string
  userId?: string
  sessionId?: string
  stack?: string
}

interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  reportToService?: boolean
  fallbackMessage?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  retryable?: boolean
  context?: string
  silent?: boolean
  persistent?: boolean
}

interface ValidationError {
  field: string
  message: string
  code?: string
  value?: any
}

interface NetworkErrorInfo {
  isOnline: boolean
  connectionType?: string
  effectiveType?: string
  downlink?: number
  rtt?: number
}

export const useErrorHandler = () => {
  const errors = ref<ErrorInfo[]>([])
  const lastError = ref<ErrorInfo | null>(null)
  const networkInfo = ref<NetworkErrorInfo>({ isOnline: true })
  const errorStats = ref({
    total: 0,
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    retryableCount: 0
  })

  // Default options
  const defaultOptions: ErrorHandlerOptions = {
    showToast: true,
    logToConsole: true,
    reportToService: false,
    fallbackMessage: 'Ha ocurrido un error inesperado',
    severity: 'medium',
    retryable: false,
    silent: false,
    persistent: false
  }

  // Update network information
  const updateNetworkInfo = () => {
    if (!import.meta.client) return

    networkInfo.value = {
      isOnline: navigator.onLine,
      connectionType: (navigator as any).connection?.type,
      effectiveType: (navigator as any).connection?.effectiveType,
      downlink: (navigator as any).connection?.downlink,
      rtt: (navigator as any).connection?.rtt
    }
  }

  // Initialize network monitoring
  if (import.meta.client) {
    updateNetworkInfo()
    window.addEventListener('online', updateNetworkInfo)
    window.addEventListener('offline', updateNetworkInfo)
  }

  // Generate unique error ID
  const generateErrorId = (): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Determine error type
  const determineErrorType = (error: any): ErrorInfo['type'] => {
    // Handle our custom fetch errors
    if (error?.name === 'CustomFetchError') {
      if (!error.status) {
        return 'network'
      }
      const code = error.status
      if (code === 401 || code === 403) {
        return 'auth'
      }
      if (code === 422) {
        return 'validation'
      }
      if (code >= 400 && code < 500) {
        return 'client'
      }
      if (code >= 500) {
        return 'api'
      }
    }

    if (error?.name === 'NetworkError' || !networkInfo.value.isOnline) {
      return 'network'
    }

    const code = extractErrorCode(error)
    if (code === 401 || code === 403) {
      return 'auth'
    }

    if (code === 422 || error?.data?.errors) {
      return 'validation'
    }

    if (code && code >= 400 && code < 500) {
      return 'client'
    }

    if (code && code >= 500) {
      return 'api'
    }

    return 'unknown'
  }

  // Determine error severity
  const determineErrorSeverity = (error: any, type: ErrorInfo['type']): ErrorInfo['severity'] => {
    const code = extractErrorCode(error)

    if (type === 'network' && !networkInfo.value.isOnline) {
      return 'high'
    }

    if (code === 401 || code === 403) {
      return 'medium'
    }

    if (code && code >= 500) {
      return 'high'
    }

    if (type === 'validation') {
      return 'low'
    }

    return 'medium'
  }

  // Update error statistics
  const updateErrorStats = (errorInfo: ErrorInfo) => {
    errorStats.value.total++
    errorStats.value.byType[errorInfo.type] = (errorStats.value.byType[errorInfo.type] || 0) + 1
    errorStats.value.bySeverity[errorInfo.severity] = (errorStats.value.bySeverity[errorInfo.severity] || 0) + 1

    if (errorInfo.retryable) {
      errorStats.value.retryableCount++
    }
  }

  // Enhanced error handler
  const handleError = (error: any, context?: string, options: ErrorHandlerOptions = {}) => {
    const opts = { ...defaultOptions, ...options, context: options.context || context }

    // Skip if silent mode
    if (opts.silent) {
      return null
    }

    const errorType = determineErrorType(error)
    const errorSeverity = opts.severity || determineErrorSeverity(error, errorType)

    const errorInfo: ErrorInfo = {
      id: generateErrorId(),
      message: extractErrorMessage(error),
      code: extractErrorCode(error),
      details: error,
      timestamp: new Date(),
      context: opts.context,
      type: errorType,
      severity: errorSeverity,
      retryable: opts.retryable || isRetryableError(error),
      retryCount: 0,
      userAgent: import.meta.client ? navigator.userAgent : undefined,
      url: import.meta.client ? window.location.href : undefined,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      stack: error?.stack
    }

    // Store error
    errors.value.unshift(errorInfo)
    lastError.value = errorInfo

    // Update statistics
    updateErrorStats(errorInfo)

    // Keep only last 100 errors
    if (errors.value.length > 100) {
      errors.value = errors.value.slice(0, 100)
    }

    // Log to console if enabled
    if (opts.logToConsole) {
      logErrorToConsole(errorInfo)
    }

    // Show toast notification if enabled
    if (opts.showToast && !opts.silent) {
      showErrorToast(errorInfo, opts.fallbackMessage, opts.persistent)
    }

    // Report to error service if enabled
    if (opts.reportToService) {
      reportError(errorInfo)
    }

    // Store in localStorage for persistence if critical
    if (errorInfo.severity === 'critical' || opts.persistent) {
      storeErrorLocally(errorInfo)
    }

    return errorInfo
  }

  // Enhanced console logging
  const logErrorToConsole = (errorInfo: ErrorInfo) => {
    const style = getConsoleStyle(errorInfo.severity)
    const prefix = `[${errorInfo.type.toUpperCase()}:${errorInfo.severity.toUpperCase()}]`

    console.group(`%c${prefix} ${errorInfo.context || 'Error'}`, style)
    console.error('Message:', errorInfo.message)
    console.error('Code:', errorInfo.code)
    console.error('Type:', errorInfo.type)
    console.error('Severity:', errorInfo.severity)
    console.error('Timestamp:', errorInfo.timestamp.toISOString())
    console.error('Retryable:', errorInfo.retryable)

    if (errorInfo.details) {
      console.error('Details:', errorInfo.details)
    }

    if (errorInfo.stack) {
      console.error('Stack:', errorInfo.stack)
    }

    console.error('Network Info:', networkInfo.value)
    console.groupEnd()
  }

  // Get console style based on severity
  const getConsoleStyle = (severity: ErrorInfo['severity']): string => {
    const styles = {
      low: 'color: #f59e0b; font-weight: bold;',
      medium: 'color: #f97316; font-weight: bold;',
      high: 'color: #ef4444; font-weight: bold;',
      critical: 'color: #dc2626; font-weight: bold; background: #fef2f2; padding: 2px 4px;'
    }
    return styles[severity]
  }

  // Get current user ID (from auth store or similar)
  const getCurrentUserId = (): string | undefined => {
    try {
      // This would typically come from your auth store
      const { user } = useAuthStore()
      return user?.id?.toString()
    } catch {
      return undefined
    }
  }

  // Get session ID
  const getSessionId = (): string | undefined => {
    try {
      if (import.meta.client) {
        let sessionId = sessionStorage.getItem('session_id')
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          sessionStorage.setItem('session_id', sessionId)
        }
        return sessionId
      }
    } catch {
      return undefined
    }
  }

  // Store error locally for persistence
  const storeErrorLocally = (errorInfo: ErrorInfo) => {
    try {
      if (import.meta.client) {
        const storedErrors = JSON.parse(localStorage.getItem('error_log') || '[]')
        storedErrors.unshift({
          ...errorInfo,
          details: undefined // Don't store full details to save space
        })

        // Keep only last 50 stored errors
        if (storedErrors.length > 50) {
          storedErrors.splice(50)
        }

        localStorage.setItem('error_log', JSON.stringify(storedErrors))
      }
    } catch (e) {
      console.warn('Failed to store error locally:', e)
    }
  }

  // Extract user-friendly error message
  const extractErrorMessage = (error: any): string => {
    // Handle our custom fetch errors first
    if (error?.name === 'CustomFetchError') {
      if (error.status) {
        return getHttpErrorMessage(error.status)
      } else {
        // Network error
        if (error.message.includes('timeout')) {
          return 'La solicitud ha tardado demasiado tiempo'
        } else if (error.message.includes('Network error')) {
          return 'No se puede conectar con el servidor'
        }
        return 'Error de conexión con el servidor'
      }
    }

    // Handle different error formats
    if (typeof error === 'string') {
      return error
    }

    if (error?.data?.error) {
      return error.data.error
    }

    if (error?.data?.message) {
      return error.data.message
    }

    if (error?.message) {
      return error.message
    }

    if (error?.statusMessage) {
      return error.statusMessage
    }

    // Handle validation errors
    if (error?.data?.errors) {
      const errors = error.data.errors
      if (typeof errors === 'object') {
        const errorMessages = Object.values(errors).flat()
        return errorMessages.join(', ')
      }
    }

    // Handle HTTP status codes
    if (error?.status || error?.statusCode) {
      const status = error.status || error.statusCode
      return getHttpErrorMessage(status)
    }

    return 'Error desconocido'
  }

  // Extract error code
  const extractErrorCode = (error: any): string | number | undefined => {
    // Handle our custom fetch errors first
    if (error?.name === 'CustomFetchError') {
      return error.status
    }
    return error?.status || error?.statusCode || error?.code
  }

  // Get user-friendly HTTP error messages
  const getHttpErrorMessage = (status: number): string => {
    const messages: Record<number, string> = {
      400: 'Solicitud inválida',
      401: 'No autorizado - Por favor inicia sesión',
      403: 'Sin permisos para realizar esta acción',
      404: 'Recurso no encontrado',
      408: 'Tiempo de espera agotado',
      409: 'Conflicto en la solicitud',
      422: 'Datos de entrada inválidos',
      429: 'Demasiadas solicitudes - Intenta más tarde',
      500: 'Error interno del servidor',
      502: 'Error de conexión con el servidor',
      503: 'Servicio no disponible temporalmente',
      504: 'Tiempo de espera del servidor agotado'
    }

    return messages[status] || `Error del servidor (${status})`
  }

  // Enhanced error toast notification
  const showErrorToast = (errorInfo: ErrorInfo, fallbackMessage?: string, persistent = false) => {
    try {
      const { error: showToast, warning, info } = useToast()
      const message = errorInfo.message || fallbackMessage || 'Error desconocido'

      // Customize title and type based on error info
      let title = 'Error'
      let toastType = 'error'

      if (errorInfo.type === 'auth') {
        title = 'Autenticación requerida'
        toastType = 'warning'
      } else if (errorInfo.type === 'validation') {
        title = 'Datos inválidos'
        toastType = 'warning'
      } else if (errorInfo.type === 'network') {
        title = 'Error de conexión'
        toastType = 'error'
      } else if (errorInfo.code === 404) {
        title = 'No encontrado'
        toastType = 'info'
      } else if (errorInfo.code && errorInfo.code >= 500) {
        title = 'Error del servidor'
        toastType = 'error'
      } else if (errorInfo.severity === 'critical') {
        title = 'Error crítico'
        toastType = 'error'
      }

      // Show appropriate toast type
      const toastOptions = {
        duration: persistent ? 0 : getSeverityDuration(errorInfo.severity),
        actions: getErrorActions(errorInfo)
      }

      switch (toastType) {
        case 'warning':
          warning(title, message, toastOptions)
          break
        case 'info':
          info(title, message, toastOptions)
          break
        default:
          showToast(title, message, toastOptions)
      }
    } catch (e) {
      console.error('Error showing toast:', e)
    }
  }

  // Get toast duration based on severity
  const getSeverityDuration = (severity: ErrorInfo['severity']): number => {
    const durations = {
      low: 3000,
      medium: 5000,
      high: 8000,
      critical: 0 // Persistent
    }
    return durations[severity]
  }

  // Get error actions for toast
  const getErrorActions = (errorInfo: ErrorInfo) => {
    const actions = []

    if (errorInfo.retryable) {
      actions.push({
        label: 'Reintentar',
        action: () => retryLastOperation(errorInfo)
      })
    }

    if (errorInfo.type === 'network' && !networkInfo.value.isOnline) {
      actions.push({
        label: 'Verificar conexión',
        action: () => checkNetworkStatus()
      })
    }

    if (errorInfo.severity === 'critical') {
      actions.push({
        label: 'Reportar',
        action: () => reportError(errorInfo)
      })
    }

    return actions
  }

  // Retry last operation (placeholder - would need to be implemented per use case)
  const retryLastOperation = (errorInfo: ErrorInfo) => {
    console.log('Retrying operation for error:', errorInfo.id)
    // This would need to be implemented based on the specific operation
  }

  // Check network status
  const checkNetworkStatus = () => {
    updateNetworkInfo()
    if (networkInfo.value.isOnline) {
      const { success } = useToast()
      success('Conexión restaurada', 'La conexión a internet se ha restablecido')
    } else {
      const { error } = useToast()
      error('Sin conexión', 'No hay conexión a internet disponible')
    }
  }

  // Report error to external service (placeholder)
  const reportError = async (errorInfo: ErrorInfo) => {
    try {
      // Here you would send the error to your error reporting service
      // like Sentry, LogRocket, etc.
      console.log('Reporting error to service:', errorInfo)
    } catch (e) {
      console.error('Failed to report error:', e)
    }
  }

  // Handle API errors specifically
  const handleApiError = (error: any, context?: string) => {
    return handleError(error, context || 'API Error', {
      showToast: true,
      logToConsole: true,
      reportToService: true,
      severity: 'medium',
      retryable: isRetryableError(error)
    })
  }

  // Handle authentication errors
  const handleAuthError = (error: any, context?: string) => {
    const errorInfo = handleError(error, context || 'Auth Error', {
      showToast: true,
      logToConsole: true,
      reportToService: false, // Don't report auth errors
      severity: 'medium',
      retryable: false
    })

    // Handle different auth error scenarios
    if (errorInfo?.code === 401) {
      // Clear any stored auth tokens
      try {
        if (import.meta.client) {
          localStorage.removeItem('auth_tokens')
          sessionStorage.removeItem('auth_tokens')
        }
      } catch (e) {
        console.warn('Failed to clear auth tokens:', e)
      }

      // Redirect to login after a delay
      setTimeout(() => {
        const currentPath = import.meta.client ? window.location.pathname : ''
        const redirectPath = currentPath !== '/login' ? `?redirect=${encodeURIComponent(currentPath)}` : ''
        navigateTo(`/login${redirectPath}`)
      }, 2000)
    } else if (errorInfo?.code === 403) {
      // Handle permission denied
      setTimeout(() => {
        navigateTo('/unauthorized')
      }, 2000)
    }

    return errorInfo
  }

  // Handle validation errors with detailed field information
  const handleValidationError = (error: any, context?: string) => {
    const validationErrors = extractValidationErrors(error)

    const errorInfo = handleError(error, context || 'Validation Error', {
      showToast: validationErrors.length <= 3, // Only show toast for few errors
      logToConsole: false, // Don't log validation errors
      reportToService: false,
      severity: 'low',
      retryable: false
    })

    return {
      ...errorInfo,
      validationErrors
    }
  }

  // Extract validation errors from error response
  const extractValidationErrors = (error: any): ValidationError[] => {
    const validationErrors: ValidationError[] = []

    if (error?.data?.errors) {
      const errors = error.data.errors

      if (typeof errors === 'object') {
        Object.entries(errors).forEach(([field, messages]) => {
          const messageArray = Array.isArray(messages) ? messages : [messages]
          messageArray.forEach((message: any) => {
            validationErrors.push({
              field,
              message: typeof message === 'string' ? message : String(message),
              code: error.code,
              value: error.data?.values?.[field]
            })
          })
        })
      }
    }

    return validationErrors
  }

  // Handle network errors with connection diagnostics
  const handleNetworkError = (error: any, context?: string) => {
    updateNetworkInfo()

    let severity: ErrorInfo['severity'] = 'medium'
    let fallbackMessage = 'Error de conexión'

    if (!networkInfo.value.isOnline) {
      severity = 'high'
      fallbackMessage = 'Sin conexión a internet - Verifica tu conexión'
    } else if (networkInfo.value.effectiveType === 'slow-2g') {
      severity = 'medium'
      fallbackMessage = 'Conexión lenta - La operación puede tardar más de lo normal'
    }

    return handleError(error, context || 'Network Error', {
      showToast: true,
      logToConsole: true,
      reportToService: !networkInfo.value.isOnline, // Only report if we have connection
      fallbackMessage,
      severity,
      retryable: true
    })
  }

  // Handle client-side errors (JavaScript errors, etc.)
  const handleClientError = (error: any, context?: string) => {
    return handleError(error, context || 'Client Error', {
      showToast: false, // Don't show toast for client errors
      logToConsole: true,
      reportToService: true,
      severity: 'high',
      retryable: false
    })
  }

  // Handle critical errors that require immediate attention
  const handleCriticalError = (error: any, context?: string) => {
    return handleError(error, context || 'Critical Error', {
      showToast: true,
      logToConsole: true,
      reportToService: true,
      severity: 'critical',
      retryable: false,
      persistent: true
    })
  }

  // Clear errors
  const clearErrors = () => {
    errors.value = []
    lastError.value = null
  }

  // Clear specific error
  const clearError = (index: number) => {
    if (index >= 0 && index < errors.value.length) {
      errors.value.splice(index, 1)
    }
  }

  // Check if error is retryable
  const isRetryableError = (error: any): boolean => {
    const code = extractErrorCode(error)
    return [408, 429, 500, 502, 503, 504].includes(Number(code))
  }

  // Retry function with exponential backoff
  const retryWithBackoff = async (
    fn: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any> => {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error

        if (attempt === maxRetries || !isRetryableError(error)) {
          throw error
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  // Get errors by type
  const getErrorsByType = (type: ErrorInfo['type']) => {
    return errors.value.filter(error => error.type === type)
  }

  // Get errors by severity
  const getErrorsBySeverity = (severity: ErrorInfo['severity']) => {
    return errors.value.filter(error => error.severity === severity)
  }

  // Get retryable errors
  const getRetryableErrors = () => {
    return errors.value.filter(error => error.retryable)
  }

  // Check if there are critical errors
  const hasCriticalErrors = computed(() => {
    return errors.value.some(error => error.severity === 'critical')
  })

  // Check if there are network errors
  const hasNetworkErrors = computed(() => {
    return errors.value.some(error => error.type === 'network')
  })

  // Get error summary
  const getErrorSummary = () => {
    return {
      total: errors.value.length,
      byType: errorStats.value.byType,
      bySeverity: errorStats.value.bySeverity,
      retryableCount: errorStats.value.retryableCount,
      criticalCount: errors.value.filter(e => e.severity === 'critical').length,
      networkCount: errors.value.filter(e => e.type === 'network').length,
      lastError: lastError.value,
      networkInfo: networkInfo.value
    }
  }

  // Export errors for debugging or reporting
  const exportErrors = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      userAgent: import.meta.client ? navigator.userAgent : 'Server',
      url: import.meta.client ? window.location.href : 'Server',
      networkInfo: networkInfo.value,
      errors: errors.value.map(error => ({
        ...error,
        details: undefined // Remove details to reduce size
      })),
      summary: getErrorSummary()
    }

    if (import.meta.client) {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `error-log-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    return exportData
  }

  // Load stored errors from localStorage
  const loadStoredErrors = () => {
    try {
      if (import.meta.client) {
        const storedErrors = JSON.parse(localStorage.getItem('error_log') || '[]')
        return storedErrors
      }
    } catch (e) {
      console.warn('Failed to load stored errors:', e)
    }
    return []
  }

  // Clear stored errors
  const clearStoredErrors = () => {
    try {
      if (import.meta.client) {
        localStorage.removeItem('error_log')
      }
    } catch (e) {
      console.warn('Failed to clear stored errors:', e)
    }
  }

  // Setup global error handlers
  const setupGlobalErrorHandlers = () => {
    if (!import.meta.client) return

    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      handleClientError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
      }, 'Global JavaScript Error')
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      handleClientError({
        message: 'Unhandled Promise Rejection',
        reason: event.reason,
        stack: event.reason?.stack
      }, 'Unhandled Promise Rejection')
    })

    // Handle network status changes
    window.addEventListener('online', () => {
      updateNetworkInfo()
      const { success } = useToast()
      success('Conexión restaurada', 'La conexión a internet se ha restablecido')
    })

    window.addEventListener('offline', () => {
      updateNetworkInfo()
      const { warning } = useToast()
      warning('Sin conexión', 'Se ha perdido la conexión a internet')
    })
  }

  // Initialize global error handlers on client
  if (import.meta.client) {
    onMounted(() => {
      setupGlobalErrorHandlers()
    })

    onUnmounted(() => {
      // Cleanup event listeners
      window.removeEventListener('online', updateNetworkInfo)
      window.removeEventListener('offline', updateNetworkInfo)
    })
  }

  return {
    // State
    errors: readonly(errors),
    lastError: readonly(lastError),
    networkInfo: readonly(networkInfo),
    errorStats: readonly(errorStats),

    // Computed
    hasCriticalErrors,
    hasNetworkErrors,

    // Core error handling
    handleError,
    handleApiError,
    handleAuthError,
    handleValidationError,
    handleNetworkError,
    handleClientError,
    handleCriticalError,

    // Error management
    clearErrors,
    clearError,
    getErrorsByType,
    getErrorsBySeverity,
    getRetryableErrors,
    getErrorSummary,

    // Utilities
    isRetryableError,
    retryWithBackoff,
    extractErrorMessage,
    extractValidationErrors,
    getHttpErrorMessage,

    // Network utilities
    updateNetworkInfo,
    checkNetworkStatus,

    // Export/Import
    exportErrors,
    loadStoredErrors,
    clearStoredErrors,

    // Global setup
    setupGlobalErrorHandlers,

    // Success handling (for compatibility)
    handleSuccess: (message: string) => {
      console.log('✅ Success:', message)
      // You can add toast notification here if needed
      const { success } = useToast()
      success('Success', message)
    }
  }
}
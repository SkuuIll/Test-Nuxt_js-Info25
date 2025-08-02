/**
 * Composable for comprehensive error handling
 */

interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  url?: string
  timestamp?: number
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

interface ErrorReport {
  id: string
  message: string
  stack?: string
  context: ErrorContext
  userAgent: string
  resolved: boolean
  reportedAt: number
}

interface ErrorHandlerOptions {
  enableReporting?: boolean
  enableToasts?: boolean
  enableLogging?: boolean
  reportingEndpoint?: string
  maxRetries?: number
  retryDelay?: number
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    enableReporting = true,
    enableToasts = true,
    enableLogging = true,
    reportingEndpoint = '/api/v1/errors',
    maxRetries = 3,
    retryDelay = 1000
  } = options

  // State
  const errorHistory = ref<ErrorReport[]>([])
  const isReporting = ref(false)
  const retryCount = ref(0)

  // Composables
  const { error: showError, warning, info } = useToast()
  const authStore = useAuthStore()

  // Generate unique error ID
  const generateErrorId = (): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Classify error severity
  const classifyErrorSeverity = (error: Error, context?: ErrorContext): ErrorContext['severity'] => {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return 'medium'
    }

    if (message.includes('auth') || message.includes('permission')) {
      return 'high'
    }

    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical'
    }

    if (context?.component?.includes('auth') || context?.component?.includes('payment')) {
      return 'high'
    }

    return 'low'
  }

  // Handle different types of errors
  const handleError = (error: Error | string, context: ErrorContext = {}) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    const severity = classifyErrorSeverity(errorObj, context)

    const errorReport: ErrorReport = {
      id: generateErrorId(),
      message: errorObj.message,
      stack: errorObj.stack,
      context: {
        ...context,
        severity,
        userId: authStore.user?.id?.toString(),
        url: process.client ? window.location.href : '',
        timestamp: Date.now()
      },
      userAgent: process.client ? navigator.userAgent : '',
      resolved: false,
      reportedAt: Date.now()
    }

    // Add to history
    errorHistory.value.unshift(errorReport)

    // Keep only last 50 errors
    if (errorHistory.value.length > 50) {
      errorHistory.value = errorHistory.value.slice(0, 50)
    }

    // Log error
    if (enableLogging) {
      console.error(`🚨 [${severity.toUpperCase()}] Error in ${context.component || 'Unknown'}:`, errorObj)
      console.error('📋 Context:', context)
    }

    // Show toast notification
    if (enableToasts) {
      showUserFriendlyError(errorObj, severity)
    }

    // Report error
    if (enableReporting && severity !== 'low') {
      reportError(errorReport)
    }

    return errorReport
  }

  // Show user-friendly error messages
  const showUserFriendlyError = (error: Error, severity: ErrorContext['severity']) => {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      showError('Error de conexión', 'Verifica tu conexión a internet')
    } else if (message.includes('auth') || message.includes('unauthorized')) {
      showError('Error de autenticación', 'Por favor, inicia sesión nuevamente')
    } else if (message.includes('permission') || message.includes('forbidden')) {
      showError('Sin permisos', 'No tienes permisos para realizar esta acción')
    } else if (message.includes('not found') || message.includes('404')) {
      showError('Recurso no encontrado', 'El contenido solicitado no existe')
    } else if (message.includes('timeout')) {
      showError('Tiempo agotado', 'La operación tardó demasiado tiempo')
    } else if (severity === 'critical') {
      showError('Error crítico', 'Ha ocurrido un error grave. Contacta al soporte.')
    } else {
      showError('Error inesperado', 'Ha ocurrido un error. Inténtalo de nuevo.')
    }
  }

  // Handle API errors specifically
  const handleApiError = (error: any, context: ErrorContext = {}) => {
    let errorMessage = 'Error de API'
    let severity: ErrorContext['severity'] = 'medium'

    if (error.response) {
      // HTTP error response
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          errorMessage = data?.message || 'Solicitud inválida'
          severity = 'low'
          break
        case 401:
          errorMessage = 'No autorizado'
          severity = 'high'
          // Trigger logout if needed
          if (authStore.isAuthenticated) {
            authStore.logout()
          }
          break
        case 403:
          errorMessage = 'Acceso denegado'
          severity = 'medium'
          break
        case 404:
          errorMessage = 'Recurso no encontrado'
          severity = 'low'
          break
        case 422:
          errorMessage = data?.message || 'Datos de validación incorrectos'
          severity = 'low'
          break
        case 429:
          errorMessage = 'Demasiadas solicitudes'
          severity = 'medium'
          break
        case 500:
          errorMessage = 'Error interno del servidor'
          severity = 'high'
          break
        case 502:
        case 503:
        case 504:
          errorMessage = 'Servicio no disponible'
          severity = 'high'
          break
        default:
          errorMessage = `Error HTTP ${status}`
          severity = 'medium'
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Error de conexión'
      severity = 'medium'
    } else {
      // Other error
      errorMessage = error.message || 'Error desconocido'
      severity = 'low'
    }

    return handleError(new Error(errorMessage), {
      ...context,
      action: 'api_call',
      severity
    })
  }

  // Handle validation errors
  const handleValidationError = (errors: Record<string, string[]>, context: ErrorContext = {}) => {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ')

    return handleError(new Error(`Errores de validación: ${errorMessages}`), {
      ...context,
      action: 'validation',
      severity: 'low'
    })
  }

  // Report error to backend
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
          reportedAt: errorReport.reportedAt
        }
      })

      // Mark as reported
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

  // Retry mechanism with exponential backoff
  const withRetry = async <T>(
    operation: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T> => {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation()

        // Reset retry count on success
        if (attempt > 0) {
          retryCount.value = 0
          info(`Operación exitosa después de ${attempt} reintentos`)
        }

        return result
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          // Final attempt failed
          handleError(lastError, {
            ...context,
            action: 'retry_failed'
          })
          throw lastError
        }

        // Wait before retry with exponential backoff
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

  // Recovery strategies
  const recoverFromError = async (errorId: string, strategy: 'retry' | 'fallback' | 'ignore') => {
    const errorIndex = errorHistory.value.findIndex(e => e.id === errorId)
    if (errorIndex === -1) return

    const errorReport = errorHistory.value[errorIndex]

    switch (strategy) {
      case 'retry':
        // Mark for retry
        info('Reintentando operación...')
        break
      case 'fallback':
        // Use fallback mechanism
        info('Usando mecanismo de respaldo...')
        break
      case 'ignore':
        // Mark as resolved
        errorHistory.value[errorIndex].resolved = true
        info('Error marcado como resuelto')
        break
    }
  }

  // Get error statistics
  const getErrorStats = () => {
    const stats = {
      total: errorHistory.value.length,
      resolved: errorHistory.value.filter(e => e.resolved).length,
      bySeverity: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      recent: errorHistory.value.slice(0, 10)
    }

    errorHistory.value.forEach(error => {
      const severity = error.context.severity || 'unknown'
      const component = error.context.component || 'unknown'

      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1
    })

    return stats
  }

  // Clear error history
  const clearErrorHistory = () => {
    errorHistory.value = []
    retryCount.value = 0
  }

  return {
    // State
    errorHistory: readonly(errorHistory),
    isReporting: readonly(isReporting),
    retryCount: readonly(retryCount),

    // Methods
    handleError,
    handleApiError,
    handleValidationError,
    reportError,
    withRetry,
    recoverFromError,
    getErrorStats,
    clearErrorHistory,

    // Utilities
    generateErrorId,
    classifyErrorSeverity
  }
}
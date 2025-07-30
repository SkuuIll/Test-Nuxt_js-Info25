interface ErrorInfo {
  message: string
  code?: string | number
  details?: any
  timestamp: Date
  context?: string
}

interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  reportToService?: boolean
  fallbackMessage?: string
}

export const useErrorHandler = () => {
  const errors = ref<ErrorInfo[]>([])
  const lastError = ref<ErrorInfo | null>(null)

  // Default options
  const defaultOptions: ErrorHandlerOptions = {
    showToast: true,
    logToConsole: true,
    reportToService: false,
    fallbackMessage: 'Ha ocurrido un error inesperado'
  }

  // Handle different types of errors
  const handleError = (error: any, context?: string, options: ErrorHandlerOptions = {}) => {
    const opts = { ...defaultOptions, ...options }

    const errorInfo: ErrorInfo = {
      message: extractErrorMessage(error),
      code: extractErrorCode(error),
      details: error,
      timestamp: new Date(),
      context
    }

    // Store error
    errors.value.unshift(errorInfo)
    lastError.value = errorInfo

    // Keep only last 50 errors
    if (errors.value.length > 50) {
      errors.value = errors.value.slice(0, 50)
    }

    // Log to console if enabled
    if (opts.logToConsole) {
      console.error(`[${context || 'Error'}]`, errorInfo)
    }

    // Show toast notification if enabled
    if (opts.showToast) {
      showErrorToast(errorInfo, opts.fallbackMessage)
    }

    // Report to error service if enabled
    if (opts.reportToService) {
      reportError(errorInfo)
    }

    return errorInfo
  }

  // Extract user-friendly error message
  const extractErrorMessage = (error: any): string => {
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

  // Show error toast notification
  const showErrorToast = (errorInfo: ErrorInfo, fallbackMessage?: string) => {
    try {
      const { error: showToast } = useToast()
      const message = errorInfo.message || fallbackMessage || 'Error desconocido'

      // Customize title based on error code
      let title = 'Error'
      if (errorInfo.code === 401) {
        title = 'Autenticación requerida'
      } else if (errorInfo.code === 403) {
        title = 'Sin permisos'
      } else if (errorInfo.code === 404) {
        title = 'No encontrado'
      } else if (errorInfo.code && errorInfo.code >= 500) {
        title = 'Error del servidor'
      }

      showToast(title, message)
    } catch (e) {
      console.error('Error showing toast:', e)
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
      reportToService: true
    })
  }

  // Handle authentication errors
  const handleAuthError = (error: any, context?: string) => {
    const errorInfo = handleError(error, context || 'Auth Error', {
      showToast: true,
      logToConsole: true,
      reportToService: false // Don't report auth errors
    })

    // Redirect to login if unauthorized
    if (errorInfo.code === 401) {
      setTimeout(() => {
        navigateTo('/login')
      }, 2000)
    }

    return errorInfo
  }

  // Handle validation errors
  const handleValidationError = (error: any, context?: string) => {
    return handleError(error, context || 'Validation Error', {
      showToast: true,
      logToConsole: false, // Don't log validation errors
      reportToService: false
    })
  }

  // Handle network errors
  const handleNetworkError = (error: any, context?: string) => {
    return handleError(error, context || 'Network Error', {
      showToast: true,
      logToConsole: true,
      reportToService: true,
      fallbackMessage: 'Error de conexión - Verifica tu conexión a internet'
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

  return {
    errors: readonly(errors),
    lastError: readonly(lastError),
    handleError,
    handleApiError,
    handleAuthError,
    handleValidationError,
    handleNetworkError,
    clearErrors,
    clearError,
    isRetryableError,
    retryWithBackoff,
    extractErrorMessage,
    getHttpErrorMessage
  }
}
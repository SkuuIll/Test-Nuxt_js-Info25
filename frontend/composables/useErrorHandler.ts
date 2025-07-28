interface ApiError {
  message: string
  status?: number
  data?: any
}

export const useErrorHandler = () => {
  const { $toast } = useNuxtApp()

  const handleError = (error: any, context?: string) => {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)

    let message = 'Ha ocurrido un error inesperado'
    let title = 'Error'

    // Handle different error types
    if (error?.data?.detail) {
      message = error.data.detail
    } else if (error?.data?.message) {
      message = error.data.message
    } else if (error?.message) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }

    // Handle specific HTTP status codes
    if (error?.status || error?.response?.status) {
      const status = error.status || error.response.status
      
      switch (status) {
        case 400:
          title = 'Solicitud inválida'
          break
        case 401:
          title = 'No autorizado'
          message = 'Debes iniciar sesión para continuar'
          break
        case 403:
          title = 'Acceso denegado'
          message = 'No tienes permisos para realizar esta acción'
          break
        case 404:
          title = 'No encontrado'
          message = 'El recurso solicitado no existe'
          break
        case 422:
          title = 'Datos inválidos'
          // Handle validation errors
          if (error?.data?.errors) {
            const errors = Object.values(error.data.errors).flat()
            message = errors.join(', ')
          }
          break
        case 429:
          title = 'Demasiadas solicitudes'
          message = 'Has excedido el límite de solicitudes. Intenta más tarde'
          break
        case 500:
          title = 'Error del servidor'
          message = 'Error interno del servidor. Intenta más tarde'
          break
        case 503:
          title = 'Servicio no disponible'
          message = 'El servicio está temporalmente no disponible'
          break
      }
    }

    // Show toast notification
    if ($toast) {
      $toast.error(message)
    }

    return {
      title,
      message,
      status: error?.status || error?.response?.status,
      originalError: error
    }
  }

  const handleSuccess = (message: string, title = 'Éxito') => {
    if ($toast) {
      $toast.success(message)
    }
  }

  const handleWarning = (message: string, title = 'Advertencia') => {
    if ($toast) {
      $toast.warning(message)
    }
  }

  const handleInfo = (message: string, title = 'Información') => {
    if ($toast) {
      $toast.info(message)
    }
  }

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo
  }
}
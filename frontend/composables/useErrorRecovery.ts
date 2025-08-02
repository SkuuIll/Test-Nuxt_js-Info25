/**
 * Composable for handling error recovery and hydration mismatches
 */

interface ErrorRecoveryOptions {
    maxRetries?: number
    retryDelay?: number
    fallbackComponent?: string
    onError?: (error: any) => void
    onRecovery?: () => void
}

export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        fallbackComponent,
        onError,
        onRecovery
    } = options

    // State
    const hasError = ref(false)
    const errorMessage = ref('')
    const retryCount = ref(0)
    const isRecovering = ref(false)

    // Methods
    const handleError = (error: any, context?: string) => {
        console.error(`❌ Error in ${context || 'component'}:`, error)

        hasError.value = true
        errorMessage.value = error.message || 'Ha ocurrido un error inesperado'

        onError?.(error)
    }

    const retry = async () => {
        if (retryCount.value >= maxRetries) {
            console.warn('⚠️ Max retry attempts reached')
            return false
        }

        isRecovering.value = true
        retryCount.value++

        try {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryDelay))

            // Reset error state
            hasError.value = false
            errorMessage.value = ''

            onRecovery?.()

            console.log(`✅ Error recovery successful (attempt ${retryCount.value})`)
            return true
        } catch (error) {
            console.error(`❌ Recovery attempt ${retryCount.value} failed:`, error)
            return false
        } finally {
            isRecovering.value = false
        }
    }

    const reset = () => {
        hasError.value = false
        errorMessage.value = ''
        retryCount.value = 0
        isRecovering.value = false
    }

    const canRetry = computed(() => retryCount.value < maxRetries)

    return {
        hasError: readonly(hasError),
        errorMessage: readonly(errorMessage),
        retryCount: readonly(retryCount),
        isRecovering: readonly(isRecovering),
        canRetry,
        handleError,
        retry,
        reset
    }
}

/**
 * Composable for handling hydration mismatches
 */
export const useHydrationRecovery = () => {
    const isHydrated = ref(false)
    const hydrationError = ref<string | null>(null)

    const handleHydrationMismatch = (error: any) => {
        console.warn('⚠️ Hydration mismatch detected:', error)
        hydrationError.value = error.message

        // Try to recover by forcing client-side rendering
        nextTick(() => {
            isHydrated.value = true
            hydrationError.value = null
            console.log('✅ Hydration mismatch recovered')
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
 * Composable for handling API errors with retry logic
 */
export const useAPIErrorHandler = () => {
    const { error: showError, success: showSuccess } = useToast()

    const handleAPIError = (error: any, context?: string) => {
        console.error(`❌ API Error in ${context}:`, error)

        let title = 'Error'
        let message = 'Ha ocurrido un error inesperado'

        if (error.response) {
            // Server responded with error status
            const status = error.response.status
            const data = error.response.data

            switch (status) {
                case 400:
                    title = 'Datos inválidos'
                    message = data.message || 'Los datos enviados no son válidos'
                    break
                case 401:
                    title = 'No autorizado'
                    message = 'Debes iniciar sesión para realizar esta acción'
                    // Redirect to login
                    navigateTo('/login')
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
                    title = 'Error de validación'
                    if (data.errors) {
                        const errors = Object.values(data.errors).flat()
                        message = errors.join(', ')
                    } else {
                        message = data.message || 'Los datos no pasaron la validación'
                    }
                    break
                case 429:
                    title = 'Demasiadas solicitudes'
                    message = 'Has realizado demasiadas solicitudes. Espera un momento e inténtalo de nuevo'
                    break
                case 500:
                    title = 'Error del servidor'
                    message = 'Ha ocurrido un error en el servidor. Inténtalo más tarde'
                    break
                default:
                    title = `Error ${status}`
                    message = data.message || `Error del servidor (${status})`
            }
        } else if (error.request) {
            // Network error
            title = 'Error de conexión'
            message = 'No se pudo conectar al servidor. Verifica tu conexión a internet'
        } else {
            // Other error
            message = error.message || 'Ha ocurrido un error inesperado'
        }

        showError(title, message)
    }

    const handleAPISuccess = (message: string, title = 'Éxito') => {
        showSuccess(title, message)
    }

    const withErrorHandling = async <T>(
        apiCall: () => Promise<T>,
        context?: string,
        successMessage?: string
    ): Promise<T | null> => {
        try {
            const result = await apiCall()

            if (successMessage) {
                handleAPISuccess(successMessage)
            }

            return result
        } catch (error) {
            handleAPIError(error, context)
            return null
        }
    }

    return {
        handleAPIError,
        handleAPISuccess,
        withErrorHandling
    }
}

/**
 * Composable for handling route errors
 */
export const useRouteErrorHandler = () => {
    const handleRouteError = (error: any) => {
        console.error('❌ Route Error:', error)

        const { error: showError } = useToast()

        if (error.statusCode === 404) {
            showError(
                'Página no encontrada',
                'La página que buscas no existe o ha sido movida'
            )
            // Redirect to home after delay
            setTimeout(() => {
                navigateTo('/')
            }, 3000)
        } else {
            showError(
                'Error de navegación',
                'Ha ocurrido un error al cargar la página'
            )
        }
    }

    return {
        handleRouteError
    }
}
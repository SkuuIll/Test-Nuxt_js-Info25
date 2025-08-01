/**
 * Specialized error handler for authentication operations
 * Provides user-friendly error messages and proper error categorization
 */

interface AuthErrorInfo {
    message: string
    type: 'auth' | 'validation' | 'network' | 'server'
    code?: string | number
    details?: any
    userFriendly: boolean
}

export const useAuthErrorHandler = () => {

    const categorizeError = (error: any): AuthErrorInfo['type'] => {
        const status = error?.status || error?.statusCode

        if (!status || status === 0) {
            return 'network'
        }

        if (status === 401 || status === 403) {
            return 'auth'
        }

        if (status === 422 || status === 400) {
            return 'validation'
        }

        if (status >= 500) {
            return 'server'
        }

        return 'auth'
    }

    const getErrorMessage = (error: any, type: AuthErrorInfo['type']): string => {
        // Handle Django API error format
        if (error?.data?.success === false) {
            if (error.data.message) {
                return error.data.message
            }
            if (error.data.error) {
                return error.data.error
            }
        }

        // Handle validation errors
        if (type === 'validation' && error?.data?.errors) {
            const errors = error.data.errors
            if (typeof errors === 'object') {
                const errorMessages = Object.entries(errors).map(([field, messages]) => {
                    const messageArray = Array.isArray(messages) ? messages : [messages]
                    return `${field}: ${messageArray.join(', ')}`
                })
                return errorMessages.join('; ')
            }
        }

        // Handle standard error formats
        if (error?.message) {
            return error.message
        }

        if (error?.data?.detail) {
            return error.data.detail
        }

        // Default messages by type
        const defaultMessages = {
            auth: 'Error de autenticación. Verifica tus credenciales.',
            validation: 'Los datos ingresados no son válidos.',
            network: 'Error de conexión. Verifica tu conexión a internet.',
            server: 'Error del servidor. Intenta nuevamente más tarde.'
        }

        return defaultMessages[type]
    }

    const handleAuthError = (error: any, context?: string): AuthErrorInfo => {
        const type = categorizeError(error)
        const message = getErrorMessage(error, type)

        const errorInfo: AuthErrorInfo = {
            message,
            type,
            code: error?.status || error?.statusCode,
            details: error,
            userFriendly: true
        }

        // Log technical details for debugging
        console.error(`🔐 Auth Error [${type.toUpperCase()}]:`, {
            context: context || 'Unknown',
            message: errorInfo.message,
            code: errorInfo.code,
            originalError: error
        })

        return errorInfo
    }

    const handleLoginError = (error: any): AuthErrorInfo => {
        const errorInfo = handleAuthError(error, 'Login')

        // Customize login-specific messages
        if (errorInfo.type === 'auth') {
            if (errorInfo.code === 401) {
                errorInfo.message = 'Usuario o contraseña incorrectos'
            } else if (errorInfo.code === 403) {
                errorInfo.message = 'Tu cuenta está desactivada. Contacta al administrador.'
            }
        }

        return errorInfo
    }

    const handleRegistrationError = (error: any): AuthErrorInfo => {
        const errorInfo = handleAuthError(error, 'Registration')

        // Customize registration-specific messages
        if (errorInfo.type === 'validation') {
            // Keep the detailed validation message for registration
            return errorInfo
        }

        if (errorInfo.type === 'auth' && errorInfo.code === 409) {
            errorInfo.message = 'Ya existe un usuario con este email o nombre de usuario'
        }

        return errorInfo
    }

    const handleTokenError = (error: any): AuthErrorInfo => {
        const errorInfo = handleAuthError(error, 'Token')

        if (errorInfo.type === 'auth') {
            errorInfo.message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        }

        return errorInfo
    }

    const isRetryableError = (errorInfo: AuthErrorInfo): boolean => {
        return errorInfo.type === 'network' || errorInfo.type === 'server'
    }

    const shouldClearAuth = (errorInfo: AuthErrorInfo): boolean => {
        return errorInfo.type === 'auth' && (errorInfo.code === 401 || errorInfo.code === 403)
    }

    const getErrorActions = (errorInfo: AuthErrorInfo) => {
        const actions = []

        if (isRetryableError(errorInfo)) {
            actions.push({
                label: 'Reintentar',
                action: 'retry'
            })
        }

        if (shouldClearAuth(errorInfo)) {
            actions.push({
                label: 'Iniciar Sesión',
                action: 'login'
            })
        }

        if (errorInfo.type === 'network') {
            actions.push({
                label: 'Verificar Conexión',
                action: 'check_network'
            })
        }

        return actions
    }

    return {
        handleAuthError,
        handleLoginError,
        handleRegistrationError,
        handleTokenError,
        isRetryableError,
        shouldClearAuth,
        getErrorActions,
        categorizeError
    }
}
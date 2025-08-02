/**
 * Authentication redirect utilities
 * Handles redirects for authentication scenarios
 */

interface AuthRedirectOptions {
    message?: string
    storeRoute?: boolean
    loginUrl?: string
}

interface PermissionRedirectOptions {
    message?: string
    requiredPermissions?: string[]
    redirectUrl?: string
}

export const useAuthRedirect = () => {
    const router = useRouter()
    const route = useRoute()
    const { authError } = useToast()

    const handleAuthRequired = async (options: AuthRedirectOptions = {}) => {
        const {
            message = 'Debes iniciar sesión para acceder a esta página',
            storeRoute = true,
            loginUrl = '/login'
        } = options

        // Show error message
        authError(message)

        // Store current route for redirect after login
        let redirectUrl = loginUrl
        if (storeRoute && route.fullPath !== loginUrl) {
            redirectUrl = `${loginUrl}?redirect=${encodeURIComponent(route.fullPath)}`
        }

        // Navigate to login
        await navigateTo(redirectUrl)
    }

    const handleInsufficientPermissions = async (options: PermissionRedirectOptions = {}) => {
        const {
            message = 'No tienes permisos para acceder a esta página',
            requiredPermissions = [],
            redirectUrl = '/unauthorized'
        } = options

        // Show error message with permission details
        const permissionText = requiredPermissions.length > 0
            ? ` Permisos requeridos: ${requiredPermissions.join(', ')}`
            : ''

        authError(message + permissionText)

        // Navigate to unauthorized page or specified redirect
        await navigateTo(redirectUrl)
    }

    const handleSessionExpired = async () => {
        const { warning } = useToast()

        warning(
            'Sesión Expirada',
            'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        )

        // Store current route for redirect after login
        const redirectUrl = route.fullPath !== '/login'
            ? `/login?redirect=${encodeURIComponent(route.fullPath)}`
            : '/login'

        await navigateTo(redirectUrl)
    }

    const handleSuccessfulAuth = async (redirectTo?: string) => {
        const { authSuccess } = useToast()

        authSuccess('¡Bienvenido! Has iniciado sesión correctamente')

        // Get redirect from query params or use provided redirect
        const targetUrl = redirectTo ||
            (route.query.redirect as string) ||
            '/'

        // Ensure we navigate to the home page by default
        console.log('🔄 Redirecting after successful auth to:', targetUrl)

        await navigateTo(targetUrl, { replace: true })
    }

    const handleSuccessfulRegistration = async (redirectTo?: string) => {
        const { authSuccess } = useToast()

        authSuccess('¡Cuenta creada exitosamente! Bienvenido al blog')

        // Get redirect from query params or use provided redirect
        const targetUrl = redirectTo ||
            (route.query.redirect as string) ||
            '/'

        await navigateTo(targetUrl)
    }

    const handleLogout = async (redirectTo: string = '/') => {
        const { success } = useToast()

        success('Sesión Cerrada', 'Has cerrado sesión exitosamente')

        await navigateTo(redirectTo)
    }

    const getRedirectUrl = (): string => {
        return (route.query.redirect as string) || '/'
    }

    const storeCurrentRoute = (): string => {
        return route.fullPath
    }

    return {
        handleAuthRequired,
        handleInsufficientPermissions,
        handleSessionExpired,
        handleSuccessfulAuth,
        handleSuccessfulRegistration,
        handleLogout,
        getRedirectUrl,
        storeCurrentRoute
    }
}
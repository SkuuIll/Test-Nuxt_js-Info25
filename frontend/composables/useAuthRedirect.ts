/**
 * Authentication redirect utilities
 * Handles post-login redirections and route protection
 */
export const useAuthRedirect = () => {
    const router = useRouter()
    const route = useRoute()

    /**
     * Get the redirect URL from query parameters or default
     */
    const getRedirectUrl = (defaultUrl: string = '/'): string => {
        const redirectParam = route.query.redirect as string

        // Validate redirect URL to prevent open redirects
        if (redirectParam) {
            try {
                // Only allow relative URLs or same-origin URLs
                const url = new URL(redirectParam, window.location.origin)
                if (url.origin === window.location.origin) {
                    return redirectParam
                }
            } catch {
                // Invalid URL, use default
            }
        }

        return defaultUrl
    }

    /**
     * Store current route for post-login redirect
     */
    const storeCurrentRoute = () => {
        const currentPath = route.fullPath

        // Don't store certain routes
        const excludedRoutes = ['/login', '/register', '/logout', '/unauthorized']
        if (!excludedRoutes.includes(currentPath)) {
            // Store in sessionStorage for persistence across page reloads
            if (import.meta.client) {
                sessionStorage.setItem('auth-redirect', currentPath)
            }
        }
    }

    /**
     * Get stored redirect route
     */
    const getStoredRedirect = (): string | null => {
        if (import.meta.client) {
            return sessionStorage.getItem('auth-redirect')
        }
        return null
    }

    /**
     * Clear stored redirect
     */
    const clearStoredRedirect = () => {
        if (import.meta.client) {
            sessionStorage.removeItem('auth-redirect')
        }
    }

    /**
     * Perform post-login redirect
     */
    const performPostLoginRedirect = async (defaultUrl: string = '/dashboard') => {
        try {
            // Priority order: query param > stored redirect > default
            let redirectUrl = getRedirectUrl()

            if (redirectUrl === '/') {
                const storedRedirect = getStoredRedirect()
                if (storedRedirect) {
                    redirectUrl = storedRedirect
                    clearStoredRedirect()
                } else {
                    redirectUrl = defaultUrl
                }
            }

            console.log('🔄 Performing post-login redirect to:', redirectUrl)

            await navigateTo(redirectUrl)

        } catch (error) {
            console.error('❌ Post-login redirect failed:', error)

            // Fallback to default URL
            await navigateTo(defaultUrl)
        }
    }

    /**
     * Handle authentication required scenario
     */
    const handleAuthRequired = async (options: {
        message?: string
        storeRoute?: boolean
        loginUrl?: string
    } = {}) => {
        const {
            message = 'Authentication required',
            storeRoute = true,
            loginUrl = '/login'
        } = options

        console.log('🔒 Authentication required:', message)

        // Store current route if requested
        if (storeRoute) {
            storeCurrentRoute()
        }

        // Show toast notification
        const { info } = useToast()
        info('Authentication Required', message)

        // Redirect to login
        const currentPath = route.fullPath
        const redirectQuery = currentPath !== loginUrl ? { redirect: currentPath } : {}

        await navigateTo({
            path: loginUrl,
            query: redirectQuery
        })
    }

    /**
     * Handle insufficient permissions scenario
     */
    const handleInsufficientPermissions = async (options: {
        message?: string
        requiredPermissions?: string[]
        redirectUrl?: string
    } = {}) => {
        const {
            message = 'Insufficient permissions',
            requiredPermissions = [],
            redirectUrl = '/unauthorized'
        } = options

        console.log('🚫 Insufficient permissions:', {
            message,
            requiredPermissions,
            currentRoute: route.path
        })

        // Show toast notification
        const { warning } = useToast()
        warning('Access Denied', message)

        // Redirect to unauthorized page
        await navigateTo(redirectUrl)
    }

    /**
     * Check if current route requires authentication
     */
    const isProtectedRoute = (): boolean => {
        const protectedRoutes = [
            '/dashboard',
            '/admin',
            '/profile',
            '/settings'
        ]

        const currentPath = route.path
        return protectedRoutes.some(route => currentPath.startsWith(route))
    }

    /**
     * Check if current route requires admin privileges
     */
    const isAdminRoute = (): boolean => {
        const adminRoutes = [
            '/admin',
            '/dashboard/admin',
            '/dashboard/users',
            '/dashboard/settings'
        ]

        const currentPath = route.path
        return adminRoutes.some(route => currentPath.startsWith(route))
    }

    /**
     * Get appropriate redirect URL based on user role
     */
    const getRoleBasedRedirect = (user: any): string => {
        if (!user) return '/'

        // Admin users go to admin dashboard
        if (user.is_staff || user.is_superuser) {
            return '/dashboard'
        }

        // Regular users go to their profile or home
        return '/profile'
    }

    return {
        // Redirect utilities
        getRedirectUrl,
        performPostLoginRedirect,
        getRoleBasedRedirect,

        // Route storage
        storeCurrentRoute,
        getStoredRedirect,
        clearStoredRedirect,

        // Error handlers
        handleAuthRequired,
        handleInsufficientPermissions,

        // Route checkers
        isProtectedRoute,
        isAdminRoute
    }
}
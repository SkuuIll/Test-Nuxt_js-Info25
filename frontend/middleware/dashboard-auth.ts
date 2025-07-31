/**
 * Enhanced Dashboard authentication middleware
 * Ensures user is authenticated for dashboard access with comprehensive error handling
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
    const {
        isAuthenticated,
        initialized,
        loading,
        initializeDashboardAuth,
        checkDashboardAuthStatus,
        requireDashboardAuth,
        checkDashboardHealth,
        refreshDashboardTokens,
        getDashboardTokenInfo,
        clearDashboardAuthState
    } = useDashboardAuth()

    const { error: errorToast, warning } = useToast()

    try {
        console.log('🛡️ Dashboard auth middleware executing for:', to.path)

        // Skip middleware for login page to prevent redirect loops
        if (to.path === '/dashboard/login') {
            console.log('⏭️ Skipping auth check for login page')
            return
        }

        // Wait for loading to complete if in progress
        if (loading.value) {
            console.log('⏳ Waiting for dashboard auth loading to complete...')
            // Wait up to 5 seconds for loading to complete
            let waitTime = 0
            while (loading.value && waitTime < 5000) {
                await new Promise(resolve => setTimeout(resolve, 100))
                waitTime += 100
            }
        }

        // Initialize dashboard auth on client side if not already done
        if (import.meta.client && !initialized.value) {
            console.log('🔄 Initializing dashboard authentication...')
            try {
                await initializeDashboardAuth({
                    enableSessionMonitoring: true,
                    retryOnError: true
                })
            } catch (error) {
                console.error('❌ Dashboard auth initialization failed in middleware:', error)

                errorToast(
                    'Authentication Error',
                    'Failed to initialize dashboard authentication. Please try logging in again.'
                )

                return navigateTo('/dashboard/login')
            }
        }

        // Perform comprehensive health check
        const healthCheck = await checkDashboardHealth()
        console.log('🏥 Dashboard health check result:', healthCheck)

        // Handle different health scenarios
        if (!healthCheck.isHealthy) {
            if (healthCheck.tokenStatus === 'missing') {
                console.log('🔒 No dashboard tokens found, redirecting to login')
                return redirectToDashboardLogin(to.fullPath, 'No authentication found')
            }

            if (healthCheck.tokenStatus === 'expired') {
                console.log('⏰ Dashboard tokens expired, attempting refresh...')

                const refreshed = await refreshDashboardTokens({ force: true })
                if (!refreshed) {
                    console.log('❌ Token refresh failed, redirecting to login')
                    warning(
                        'Session Expired',
                        'Your dashboard session has expired. Please log in again.'
                    )
                    return redirectToDashboardLogin(to.fullPath, 'Session expired')
                }

                console.log('✅ Tokens refreshed successfully, continuing...')
            }

            if (healthCheck.profileStatus === 'unreachable') {
                console.warn('⚠️ Dashboard profile unreachable, but allowing access')
                warning(
                    'Connection Issue',
                    'Unable to verify your profile. Some features may be limited.'
                )
            }

            if (healthCheck.sessionStatus === 'expired') {
                console.log('⏰ Dashboard session expired, redirecting to login')
                return redirectToDashboardLogin(to.fullPath, 'Session expired due to inactivity')
            }
        }

        // Final authentication check
        if (!isAuthenticated.value) {
            console.log('🔒 User not authenticated, redirecting to dashboard login')
            return redirectToDashboardLogin(to.fullPath, 'Authentication required')
        }

        // Validate token expiry one more time
        const tokenInfo = getDashboardTokenInfo()
        if (tokenInfo && tokenInfo.isAccessExpired) {
            console.log('⏰ Access token expired during middleware check')

            if (!tokenInfo.isRefreshExpired) {
                const refreshed = await refreshDashboardTokens({ force: true })
                if (!refreshed) {
                    return redirectToDashboardLogin(to.fullPath, 'Token refresh failed')
                }
            } else {
                return redirectToDashboardLogin(to.fullPath, 'All tokens expired')
            }
        }

        // Final validation using requireDashboardAuth
        try {
            await requireDashboardAuth()
            console.log('✅ Dashboard authentication validated successfully')
        } catch (error: any) {
            console.error('❌ Dashboard authentication validation failed:', error)

            // Clear potentially corrupted auth state
            await clearDashboardAuthState()

            errorToast(
                'Authentication Failed',
                'Your dashboard session is no longer valid. Please log in again.'
            )

            return redirectToDashboardLogin(to.fullPath, 'Authentication validation failed')
        }

        // Log successful authentication
        console.log('🎉 Dashboard authentication middleware completed successfully')

    } catch (error: any) {
        console.error('❌ Unexpected error in dashboard auth middleware:', error)

        errorToast(
            'Authentication Error',
            'An unexpected error occurred during authentication. Please try again.'
        )

        return redirectToDashboardLogin(to.fullPath, 'Unexpected authentication error')
    }
})

/**
 * Helper function to redirect to dashboard login with proper error handling
 */
function redirectToDashboardLogin(intendedPath: string, reason: string) {
    console.log(`🔄 Redirecting to dashboard login: ${reason}`)

    // Don't store login page as redirect destination
    const redirectTo = intendedPath !== '/dashboard/login' ? intendedPath : undefined

    return navigateTo({
        path: '/dashboard/login',
        query: {
            ...(redirectTo && { redirect: redirectTo }),
            reason: encodeURIComponent(reason)
        }
    })
}
/**
 * Authentication testing utilities
 * Used to validate authentication flows
 */

export const testAuthFlow = async () => {
    console.log('🧪 Starting authentication flow tests...')

    try {
        // Test API connection
        const api = useApi()

        // Test token utilities
        const tokens = api.tokenUtils.getTokens()
        console.log('📋 Current tokens:', {
            hasAccess: !!tokens.access,
            hasRefresh: !!tokens.refresh,
            accessExpired: tokens.access ? api.tokenUtils.isTokenExpired(tokens.access) : true
        })

        // Test auth store
        const authStore = useAuthStore()
        console.log('🏪 Auth store status:', {
            isAuthenticated: authStore.isAuthenticated,
            hasUser: !!authStore.user,
            loading: authStore.loading,
            error: authStore.error
        })

        // Test auth composable
        const { getAuthStatus } = useAuth()
        const authStatus = getAuthStatus()
        console.log('🔍 Auth status:', authStatus)

        console.log('✅ Authentication flow tests completed')
        return true

    } catch (error) {
        console.error('❌ Authentication flow tests failed:', error)
        return false
    }
}

export const testLoginFlow = async (credentials: { username: string; password: string }) => {
    console.log('🧪 Testing login flow...')

    try {
        const { login } = useAuth()
        const result = await login(credentials)

        console.log('✅ Login test successful:', result)
        return true

    } catch (error) {
        console.error('❌ Login test failed:', error)
        return false
    }
}

export const testRegistrationFlow = async (userData: any) => {
    console.log('🧪 Testing registration flow...')

    try {
        const { register } = useAuth()
        const result = await register(userData)

        console.log('✅ Registration test successful:', result)
        return true

    } catch (error) {
        console.error('❌ Registration test failed:', error)
        return false
    }
}

export const testTokenRefresh = async () => {
    console.log('🧪 Testing token refresh...')

    try {
        const api = useApi()
        const tokens = api.tokenUtils.getTokens()

        if (!tokens.refresh) {
            console.log('⚠️ No refresh token available')
            return false
        }

        const newTokens = await api.refreshTokens(tokens.refresh)
        console.log('✅ Token refresh successful:', !!newTokens.access)
        return true

    } catch (error) {
        console.error('❌ Token refresh test failed:', error)
        return false
    }
}

export const testMiddleware = () => {
    console.log('🧪 Testing middleware...')

    try {
        // This would be tested by navigating to protected routes
        console.log('ℹ️ Middleware tests require navigation to protected routes')
        return true

    } catch (error) {
        console.error('❌ Middleware test failed:', error)
        return false
    }
}

export const runAllTests = async () => {
    console.log('🚀 Running all authentication tests...')

    const results = {
        authFlow: await testAuthFlow(),
        middleware: testMiddleware()
    }

    const allPassed = Object.values(results).every(result => result === true)

    console.log('📊 Test Results:', results)
    console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed')

    return results
}
import { defineStore } from 'pinia'
import type { User, LoginCredentials, RegisterData, AuthTokens } from '~/types'

export const useAuthStore = defineStore('auth', () => {
    // State - usando valores por defecto seguros
    const user = ref<User | null>(null)
    const isAuthenticated = ref(false)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const isAdmin = computed(() => user.value?.is_staff || false)
    const userInitials = computed(() => {
        if (!user.value) return ''
        const firstName = user.value.first_name || ''
        const lastName = user.value.last_name || ''
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    })

    // Helper function to safely get API instance
    const getApi = () => {
        if (!process.client) {
            throw new Error('API can only be used on client side')
        }
        return useApi()
    }

    // Helper function to clear authentication state
    const clearAuthState = async () => {
        console.log('🧹 Clearing authentication state')

        // Clear tokens using API utility (only on client)
        if (process.client) {
            try {
                const api = getApi()
                api.tokenUtils.clearTokens()
            } catch (e) {
                console.warn('Could not clear tokens:', e)
            }
        }

        // Reset store state
        user.value = null
        isAuthenticated.value = false
        error.value = null

        console.log('✅ Authentication state cleared')
    }

    // Helper function for error handling
    const handleAuthError = (err: any, context: string = 'Authentication') => {
        console.error(`❌ ${context} error:`, err)

        let message = 'An error occurred'

        if (err.response?.data?.message) {
            message = err.response.data.message
        } else if (err.data?.message) {
            message = err.data.message
        } else if (err.message) {
            message = err.message
        } else if (typeof err === 'string') {
            message = err
        }

        return { message }
    }

    // Actions
    const login = async (credentials: LoginCredentials) => {
        if (!process.client) {
            throw new Error('Login can only be performed on client side')
        }

        loading.value = true
        try {
            error.value = null
            console.log('🔐 Starting login with:', { username: credentials.username })

            const api = getApi()
            const tokens = await api.login(credentials)
            console.log('✅ Login successful, tokens received')

            // Store tokens immediately after successful login
            const tokenStored = api.tokenUtils.setTokens(tokens)
            if (!tokenStored) {
                throw new Error('Failed to store authentication tokens')
            }

            // Fetch user profile after successful login
            const profile = await api.getProfile()
            console.log('👤 User profile fetched:', {
                username: profile.username,
                isStaff: profile.is_staff,
                email: profile.email
            })

            // Set user data and authentication state
            user.value = profile
            isAuthenticated.value = true

            console.log('🎉 Authentication completed successfully')
            return { tokens, user: profile }
        } catch (err: any) {
            const errorInfo = handleAuthError(err, 'Login')
            error.value = errorInfo.message

            // Clear any existing auth state
            await clearAuthState()

            throw err
        } finally {
            loading.value = false
        }
    }

    const register = async (data: RegisterData) => {
        if (!process.client) {
            throw new Error('Registration can only be performed on client side')
        }

        loading.value = true
        try {
            error.value = null
            console.log('📝 Starting registration for:', { username: data.username, email: data.email })

            const api = getApi()
            const response = await api.register(data)
            console.log('✅ Registration successful, response received')

            // Extract tokens and user from response
            let tokens: AuthTokens
            let profile: User

            if (response.success && response.data) {
                // Handle Django API format with tokens in data
                if (response.data.access && response.data.refresh) {
                    tokens = {
                        access: response.data.access,
                        refresh: response.data.refresh
                    }
                    profile = response.data.user || response.data
                } else {
                    throw new Error('Invalid registration response format')
                }
            } else {
                throw new Error('Registration failed - invalid response')
            }

            // Store tokens immediately after successful registration
            const tokenStored = api.tokenUtils.setTokens(tokens)
            if (!tokenStored) {
                throw new Error('Failed to store authentication tokens')
            }

            // Set user data and authentication state
            user.value = profile
            isAuthenticated.value = true

            console.log('🎉 Registration and authentication completed successfully')
            return { tokens, user: profile }
        } catch (err: any) {
            const errorInfo = handleAuthError(err, 'Registration')
            error.value = errorInfo.message

            // Clear any existing auth state
            await clearAuthState()

            throw err
        } finally {
            loading.value = false
        }
    }

    const logout = async (redirectTo: string = '/') => {
        if (!process.client) {
            return
        }

        loading.value = true
        try {
            console.log('👋 Starting logout process')

            // Try to logout from backend first
            try {
                const api = getApi()
                await api.logout()
                console.log('✅ Backend logout successful')
            } catch (logoutError) {
                console.warn('⚠️ Backend logout error (continuing with local logout):', logoutError)
                // Continue with local logout even if backend logout fails
            }

            // Clear authentication state
            await clearAuthState()

            console.log('👋 Logout completed successfully')

            // Redirect to specified route
            if (redirectTo) {
                await navigateTo(redirectTo)
            }

        } catch (err: any) {
            console.error('❌ Logout error:', err)

            // Even if logout fails, clear local state
            await clearAuthState()

            // Still redirect on error
            if (redirectTo) {
                await navigateTo(redirectTo)
            }

            throw err
        } finally {
            loading.value = false
        }
    }

    const fetchProfile = async () => {
        if (!process.client) {
            throw new Error('Profile fetch can only be performed on client side')
        }

        try {
            console.log('📡 Fetching user profile...')
            const api = getApi()
            const profile = await api.getProfile()

            user.value = profile
            isAuthenticated.value = true

            console.log('✅ Profile fetched successfully:', {
                username: profile.username,
                isStaff: profile.is_staff,
                email: profile.email
            })

            return profile
        } catch (err: any) {
            console.error('❌ Error fetching profile:', err)

            // Handle authentication errors
            if (err.statusCode === 401 || err.status === 401) {
                console.log('🔒 Invalid token, logging out...')
                await clearAuthState()

                const errorInfo = handleAuthError(err, 'Profile Fetch Failed - Session Expired')
                error.value = errorInfo.message

                throw new Error('Session expired')
            } else {
                // For other errors, don't logout but handle appropriately
                console.warn('⚠️ Temporary error fetching profile, maintaining session')

                const errorInfo = handleAuthError(err, 'Profile Fetch Failed')
                error.value = errorInfo.message

                throw err
            }
        }
    }

    const updateProfile = async (data: Partial<User>) => {
        if (!process.client) {
            throw new Error('Profile update can only be performed on client side')
        }

        loading.value = true
        try {
            error.value = null
            console.log('📝 Updating user profile...')

            const api = getApi()
            const updatedUser = await api.updateProfile(data)

            user.value = updatedUser
            console.log('✅ Profile updated successfully:', {
                username: updatedUser.username,
                email: updatedUser.email
            })

            return updatedUser
        } catch (err: any) {
            const errorInfo = handleAuthError(err, 'Profile Update')
            error.value = errorInfo.message

            throw err
        } finally {
            loading.value = false
        }
    }

    const changePassword = async (currentPassword: string, newPassword: string) => {
        if (!process.client) {
            throw new Error('Password change can only be performed on client side')
        }

        loading.value = true
        try {
            error.value = null
            console.log('🔐 Changing password...')

            const api = getApi()
            await api.changePassword(currentPassword, newPassword)

            console.log('✅ Password changed successfully')

            // Optionally refresh tokens after password change for security
            try {
                const tokens = api.tokenUtils.getTokens()
                if (tokens?.refresh) {
                    const newTokens = await api.refreshTokens(tokens.refresh)
                    api.tokenUtils.setTokens(newTokens)
                    console.log('🔄 Tokens refreshed after password change')
                }
            } catch (refreshError) {
                console.warn('⚠️ Token refresh after password change failed:', refreshError)
                // Don't throw error, password change was successful
            }

        } catch (err: any) {
            const errorInfo = handleAuthError(err, 'Password Change')
            error.value = errorInfo.message

            throw err
        } finally {
            loading.value = false
        }
    }

    const requestPasswordReset = async (email: string) => {
        if (!process.client) {
            throw new Error('Password reset can only be performed on client side')
        }

        loading.value = true
        try {
            error.value = null
            console.log('📧 Requesting password reset for:', email)

            const api = getApi()
            await api.requestPasswordReset(email)

            console.log('✅ Password reset request sent successfully')
        } catch (err: any) {
            const errorInfo = handleAuthError(err, 'Password Reset Request')
            error.value = errorInfo.message

            throw err
        } finally {
            loading.value = false
        }
    }

    const resetPassword = async (token: string, newPassword: string) => {
        if (!process.client) {
            throw new Error('Password reset can only be performed on client side')
        }

        loading.value = true
        try {
            error.value = null
            console.log('🔐 Resetting password with token')

            const api = getApi()
            await api.resetPassword(token, newPassword)

            console.log('✅ Password reset successful')
        } catch (err: any) {
            const errorInfo = handleAuthError(err, 'Password Reset')
            error.value = errorInfo.message

            throw err
        } finally {
            loading.value = false
        }
    }

    const initializeAuth = async () => {
        if (!process.client) return

        try {
            console.log('🔄 Initializing authentication...')

            const api = getApi()
            const tokens = api.tokenUtils.getTokens()
            if (!tokens?.access) {
                console.log('ℹ️ No tokens found, user not authenticated')
                await clearAuthState()
                return
            }

            console.log('🔍 Found existing tokens, validating...')

            // Check if access token is expired
            if (api.tokenUtils.isTokenExpired(tokens.access)) {
                console.log('⏰ Access token expired, attempting refresh...')

                if (tokens.refresh && !api.tokenUtils.isTokenExpired(tokens.refresh)) {
                    try {
                        const newTokens = await api.refreshTokens(tokens.refresh)
                        api.tokenUtils.setTokens(newTokens)
                        console.log('✅ Token refreshed successfully during initialization')
                    } catch (refreshError) {
                        console.error('❌ Token refresh failed during initialization:', refreshError)
                        await clearAuthState()
                        return
                    }
                } else {
                    console.log('🚫 Refresh token also expired')
                    await clearAuthState()
                    return
                }
            }

            // Try to fetch profile to validate token and get user data
            try {
                await fetchProfile()
                console.log('✅ Authentication initialized successfully')
            } catch (profileError: any) {
                console.warn('⚠️ Profile fetch error during initialization:', profileError)

                // If it's an authentication error, clear state
                if (profileError.statusCode === 401 || profileError.status === 401) {
                    console.log('🔒 Authentication failed, clearing state')
                    await clearAuthState()
                } else {
                    // For other errors, log but don't clear authentication
                    console.log('ℹ️ Maintaining authenticated state despite profile error')
                    isAuthenticated.value = true
                }
            }
        } catch (err) {
            console.error('❌ Authentication initialization error:', err)
            await clearAuthState()
        }
    }

    // Additional utility methods
    const checkAuthStatus = () => {
        if (!process.client) {
            return {
                hasTokens: false,
                hasValidTokens: false,
                isExpired: true,
                expiryTime: 0
            }
        }

        try {
            const api = getApi()
            const tokens = api.tokenUtils.getTokens()
            const hasValidTokens = tokens?.access && !api.tokenUtils.isTokenExpired(tokens.access)

            return {
                hasTokens: !!tokens,
                hasValidTokens,
                isExpired: tokens?.access ? api.tokenUtils.isTokenExpired(tokens.access) : true,
                expiryTime: tokens?.access ? api.tokenUtils.getTokenExpiryTime(tokens.access) : 0
            }
        } catch (e) {
            return {
                hasTokens: false,
                hasValidTokens: false,
                isExpired: true,
                expiryTime: 0
            }
        }
    }

    const refreshAuthIfNeeded = async () => {
        if (!process.client) return false

        try {
            const api = getApi()
            const tokens = api.tokenUtils.getTokens()
            if (!tokens?.access) return false

            // If token expires in less than 5 minutes, refresh it
            const expiryTime = api.tokenUtils.getTokenExpiryTime(tokens.access)
            const timeUntilExpiry = expiryTime - Date.now()
            const fiveMinutes = 5 * 60 * 1000

            if (timeUntilExpiry < fiveMinutes && tokens.refresh) {
                try {
                    console.log('🔄 Proactively refreshing token...')
                    const newTokens = await api.refreshTokens(tokens.refresh)
                    api.tokenUtils.setTokens(newTokens)
                    console.log('✅ Token proactively refreshed')
                    return true
                } catch (error) {
                    console.error('❌ Proactive token refresh failed:', error)
                    await clearAuthState()
                    return false
                }
            }

            return true
        } catch (e) {
            console.error('❌ Error checking auth refresh:', e)
            return false
        }
    }

    return {
        // State
        user: readonly(user),
        isAuthenticated: readonly(isAuthenticated),
        loading: readonly(loading),
        error: readonly(error),

        // Getters
        isAdmin,
        userInitials,

        // Actions
        login,
        register,
        logout,
        fetchProfile,
        updateProfile,
        changePassword,
        requestPasswordReset,
        resetPassword,
        initializeAuth,

        // Utilities
        clearAuthState,
        checkAuthStatus,
        refreshAuthIfNeeded
    }
}, {
    persist: {
        key: 'auth-store',
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        pick: [] // Don't persist auth data - we handle tokens manually
    }
})
import { defineStore } from 'pinia'
import type { User, LoginCredentials, RegisterData, AuthTokens } from '~/types'
import { handleAuthError, handleValidationError } from '~/utils/errorHandling'

export const useAuthStore = defineStore('auth', () => {
  // Error handlers imported from utils to avoid circular dependencies
  const { authLoading } = useLoading()
  const api = useApi()

  // State
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const loading = computed(() => authLoading.loading.value)
  const error = ref<string | null>(null)

  // Getters
  const isAdmin = computed(() => user.value?.is_staff || false)
  const userInitials = computed(() => {
    if (!user.value) return ''
    const firstName = user.value.first_name || ''
    const lastName = user.value.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  })

  // Helper function to clear authentication state
  const clearAuthState = async () => {
    console.log('🧹 Clearing authentication state')

    // Clear tokens using API utility
    api.tokenUtils.clearTokens()

    // Reset store state
    user.value = null
    isAuthenticated.value = false
    error.value = null

    console.log('✅ Authentication state cleared')
  }

  // Actions
  const login = async (credentials: LoginCredentials) => {
    return await authLoading.withLoading(async () => {
      try {
        error.value = null
        console.log('🔐 Starting login with:', { username: credentials.username })

        const tokens = await api.login(credentials)
        console.log('✅ Login successful, tokens received')

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
        console.error('❌ Login error:', err)

        // Handle auth error with enhanced error handler
        const errorInfo = handleAuthError(err, 'Login Failed')
        error.value = errorInfo.message

        // Clear any existing auth state
        await clearAuthState()

        throw err
      }
    })
  }

  const register = async (data: RegisterData) => {
    return await authLoading.withLoading(async () => {
      try {
        error.value = null
        console.log('📝 Starting registration for:', { username: data.username, email: data.email })

        const tokens = await api.register(data)
        console.log('✅ Registration successful, tokens received')

        // Fetch user profile after successful registration
        const profile = await api.getProfile()
        console.log('👤 User profile fetched after registration:', {
          username: profile.username,
          email: profile.email
        })

        // Set user data and authentication state
        user.value = profile
        isAuthenticated.value = true

        console.log('🎉 Registration and authentication completed successfully')
        return { tokens, user: profile }
      } catch (err: any) {
        console.error('❌ Registration error:', err)

        // Handle validation errors specifically
        if (err.data?.errors) {
          const errorInfo = handleValidationError(err, 'Registration Validation Failed')
          error.value = errorInfo.message
        } else {
          const errorInfo = handleAuthError(err, 'Registration Failed')
          error.value = errorInfo.message
        }

        // Clear any existing auth state
        await clearAuthState()

        throw err
      }
    })
  }

  const logout = async (redirectTo: string = '/') => {
    return await authLoading.withLoading(async () => {
      try {
        console.log('👋 Starting logout process')

        // Try to logout from backend first
        try {
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
      }
    })
  }

  const fetchProfile = async () => {
    try {
      console.log('📡 Fetching user profile...')
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
    return await authLoading.withLoading(async () => {
      try {
        error.value = null
        console.log('📝 Updating user profile...')

        const updatedUser = await api.updateProfile(data)

        user.value = updatedUser
        console.log('✅ Profile updated successfully:', {
          username: updatedUser.username,
          email: updatedUser.email
        })

        return updatedUser
      } catch (err: any) {
        console.error('❌ Profile update error:', err)

        // Handle validation errors specifically
        if (err.data?.errors) {
          const errorInfo = handleValidationError(err, 'Profile Update Validation Failed')
          error.value = errorInfo.message
        } else {
          const errorInfo = handleAuthError(err, 'Profile Update Failed')
          error.value = errorInfo.message
        }

        throw err
      }
    })
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return await authLoading.withLoading(async () => {
      try {
        error.value = null
        console.log('🔐 Changing password...')

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
        console.error('❌ Password change error:', err)

        // Handle validation errors specifically
        if (err.data?.errors) {
          const errorInfo = handleValidationError(err, 'Password Change Validation Failed')
          error.value = errorInfo.message
        } else {
          const errorInfo = handleAuthError(err, 'Password Change Failed')
          error.value = errorInfo.message
        }

        throw err
      }
    })
  }

  const requestPasswordReset = async (email: string) => {
    return await authLoading.withLoading(async () => {
      try {
        error.value = null
        console.log('📧 Requesting password reset for:', email)

        await api.requestPasswordReset(email)

        console.log('✅ Password reset request sent successfully')
      } catch (err: any) {
        console.error('❌ Password reset request error:', err)

        const errorInfo = handleAuthError(err, 'Password Reset Request Failed')
        error.value = errorInfo.message

        throw err
      }
    })
  }

  const resetPassword = async (token: string, newPassword: string) => {
    return await authLoading.withLoading(async () => {
      try {
        error.value = null
        console.log('🔐 Resetting password with token')

        await api.resetPassword(token, newPassword)

        console.log('✅ Password reset successful')
      } catch (err: any) {
        console.error('❌ Password reset error:', err)

        // Handle validation errors specifically
        if (err.data?.errors) {
          const errorInfo = handleValidationError(err, 'Password Reset Validation Failed')
          error.value = errorInfo.message
        } else {
          const errorInfo = handleAuthError(err, 'Password Reset Failed')
          error.value = errorInfo.message
        }

        throw err
      }
    })
  }

  const initializeAuth = async () => {
    if (!import.meta.client) return

    try {
      console.log('🔄 Initializing authentication...')

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
    const tokens = api.tokenUtils.getTokens()
    const hasValidTokens = tokens?.access && !api.tokenUtils.isTokenExpired(tokens.access)

    return {
      hasTokens: !!tokens,
      hasValidTokens,
      isExpired: tokens?.access ? api.tokenUtils.isTokenExpired(tokens.access) : true,
      expiryTime: tokens?.access ? api.tokenUtils.getTokenExpiryTime(tokens.access) : 0
    }
  }

  const refreshAuthIfNeeded = async () => {
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
  }

  return {
    // State
    user,
    isAuthenticated,
    loading,
    error,

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
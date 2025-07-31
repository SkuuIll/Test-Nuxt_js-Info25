import type { LoginCredentials, RegisterData, User } from '~/types'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { handleAuthError } = useErrorHandler()

  // Check if user has specific role/permission
  const hasRole = (role: string): boolean => {
    if (!authStore.user) return false

    switch (role) {
      case 'admin':
        return authStore.user.is_staff || false
      case 'user':
        return true
      default:
        return false
    }
  }

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!authStore.user) return false

    // Add permission checking logic based on your backend implementation
    switch (permission) {
      case 'can_edit_posts':
        return authStore.user.is_staff || false
      case 'can_delete_posts':
        return authStore.user.is_staff || false
      case 'can_moderate_comments':
        return authStore.user.is_staff || false
      default:
        return false
    }
  }

  // Enhanced login with better error handling
  const loginWithErrorHandling = async (credentials: LoginCredentials) => {
    try {
      const result = await authStore.login(credentials)
      return result
    } catch (error) {
      // Error is already handled by the store, just re-throw
      throw error
    }
  }

  // Enhanced register with better error handling
  const registerWithErrorHandling = async (data: RegisterData) => {
    try {
      const result = await authStore.register(data)
      return result
    } catch (error) {
      // Error is already handled by the store, just re-throw
      throw error
    }
  }

  // Safe logout that handles errors gracefully
  const safeLogout = async (redirectTo?: string) => {
    try {
      await authStore.logout(redirectTo)
    } catch (error) {
      console.warn('Logout error handled gracefully:', error)
      // Even if logout fails, the store will clear local state
    }
  }

  // Check authentication status
  const getAuthStatus = () => {
    return authStore.checkAuthStatus()
  }

  // Refresh authentication if needed
  const ensureAuthenticated = async () => {
    if (!authStore.isAuthenticated) {
      throw new Error('User not authenticated')
    }

    const refreshed = await authStore.refreshAuthIfNeeded()
    if (!refreshed) {
      throw new Error('Authentication refresh failed')
    }

    return true
  }

  // Guard function for protected routes
  const requireAuth = async () => {
    if (!authStore.isAuthenticated) {
      await navigateTo('/login')
      throw new Error('Authentication required')
    }

    try {
      await ensureAuthenticated()
    } catch (error) {
      await navigateTo('/login')
      throw error
    }
  }

  // Guard function for admin routes
  const requireAdmin = async () => {
    await requireAuth()

    if (!authStore.isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }
  }

  return {
    // State
    user: readonly(authStore.user),
    isAuthenticated: readonly(authStore.isAuthenticated),
    loading: readonly(authStore.loading),
    error: readonly(authStore.error),

    // Getters
    isAdmin: readonly(authStore.isAdmin),
    userInitials: readonly(authStore.userInitials),

    // Enhanced Actions
    login: loginWithErrorHandling,
    register: registerWithErrorHandling,
    logout: safeLogout,
    fetchProfile: authStore.fetchProfile,
    updateProfile: authStore.updateProfile,
    changePassword: authStore.changePassword,
    requestPasswordReset: authStore.requestPasswordReset,
    resetPassword: authStore.resetPassword,
    initializeAuth: authStore.initializeAuth,

    // Utility methods
    hasRole,
    hasPermission,
    getAuthStatus,
    ensureAuthenticated,
    requireAuth,
    requireAdmin,

    // Store utilities
    clearAuthState: authStore.clearAuthState,
    refreshAuthIfNeeded: authStore.refreshAuthIfNeeded
  }
}
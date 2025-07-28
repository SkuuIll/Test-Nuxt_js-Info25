export const useAuth = () => {
  const authStore = useAuthStore()
  
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

  return {
    // State
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    loading: authStore.loading,
    error: authStore.error,
    
    // Getters
    isAdmin: authStore.isAdmin,
    userInitials: authStore.userInitials,
    
    // Actions
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    fetchProfile: authStore.fetchProfile,
    updateProfile: authStore.updateProfile,
    changePassword: authStore.changePassword,
    requestPasswordReset: authStore.requestPasswordReset,
    resetPassword: authStore.resetPassword,
    initializeAuth: authStore.initializeAuth,
    
    // Additional methods
    hasRole
  }
}
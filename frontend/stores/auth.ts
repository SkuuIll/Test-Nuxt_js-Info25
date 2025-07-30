import { defineStore } from 'pinia'
import type { User, LoginCredentials, RegisterData } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  // State
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

  // Actions
  const login = async (credentials: LoginCredentials) => {
    try {
      loading.value = true
      error.value = null

      console.log('🔐 Iniciando login con:', { username: credentials.username })

      const api = useApi()
      const response = await api.login(credentials)

      console.log('✅ Login exitoso, respuesta recibida:', response)

      // Store tokens
      const tokens = {
        access: response.access,
        refresh: response.refresh
      }

      // Save tokens to localStorage
      if (process.client) {
        localStorage.setItem('auth_tokens', JSON.stringify(tokens))
        console.log('💾 Tokens guardados en localStorage')
      }

      // Fetch user profile
      console.log('👤 Obteniendo perfil de usuario...')
      await fetchProfile()

      isAuthenticated.value = true
      console.log('🎉 Autenticación completada exitosamente')

      return response
    } catch (err: any) {
      console.error('❌ Error en login:', err)
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (data: RegisterData) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      const response = await api.register(data)

      return response
    } catch (err: any) {
      error.value = err.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true

      // Clear tokens from localStorage
      if (process.client) {
        localStorage.removeItem('auth_tokens')
      }

      // Reset state
      user.value = null
      isAuthenticated.value = false
      error.value = null

      // Redirect to home
      await navigateTo('/')

    } catch (err: any) {
      console.error('Logout error:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchProfile = async () => {
    try {
      console.log('📡 Obteniendo perfil de usuario...')
      const api = useApi()
      user.value = await api.getProfile()
      isAuthenticated.value = true
      console.log('✅ Perfil obtenido:', {
        username: user.value?.username,
        isStaff: user.value?.is_staff,
        email: user.value?.email
      })
    } catch (err: any) {
      console.error('❌ Error obteniendo perfil:', err)
      // If profile fetch fails, user might not be authenticated
      await logout()
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      user.value = await api.updateProfile(data)

      return user.value
    } catch (err: any) {
      error.value = err.message || 'Profile update failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      await api.changePassword(currentPassword, newPassword)

    } catch (err: any) {
      error.value = err.message || 'Password change failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const requestPasswordReset = async (email: string) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      await api.requestPasswordReset(email)

    } catch (err: any) {
      error.value = err.message || 'Password reset request failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      await api.resetPassword(token, newPassword)

    } catch (err: any) {
      error.value = err.message || 'Password reset failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const initializeAuth = async () => {
    if (!process.client) return

    try {
      const tokens = localStorage.getItem('auth_tokens')
      if (tokens) {
        const parsedTokens = JSON.parse(tokens)
        if (parsedTokens.access) {
          await fetchProfile()
        }
      }
    } catch (err) {
      console.error('Error initializing auth:', err)
      // Clear invalid tokens
      localStorage.removeItem('auth_tokens')
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
    initializeAuth
  }
}, {
  persist: {
    key: 'auth-store',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    pick: [] // Don't persist auth data - we handle tokens manually
  }
})
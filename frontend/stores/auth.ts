import { defineStore } from 'pinia'
import type { User, LoginCredentials, RegisterData } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const { handleAuthError, handleValidationError } = useErrorHandler()
  const { authLoading } = useLoading()

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

  // Actions
  const login = async (credentials: LoginCredentials) => {
    return await authLoading.withLoading(async () => {
      try {
        error.value = null
        console.log('🔐 Iniciando login con:', { username: credentials.username })

        const api = useApi()
        const response = await api.login(credentials)

        console.log('✅ Login exitoso, respuesta recibida:', response)

        // Store tokens
        const tokens = {
          access: response.access,
          refresh: response.refresh,
          expires_in: response.expires_in || 3600
        }

        // Save tokens to localStorage
        if (process.client) {
          localStorage.setItem('auth_tokens', JSON.stringify(tokens))
          console.log('💾 Tokens guardados en localStorage')
        }

        // Set user data directly from login response
        user.value = response.user
        isAuthenticated.value = true

        console.log('🎉 Autenticación completada exitosamente')
        console.log('👤 Usuario logueado:', {
          username: user.value?.username,
          isStaff: user.value?.is_staff,
          email: user.value?.email
        })

        return response
      } catch (err: any) {
        console.error('❌ Error en login:', err)

        // Handle auth error with new error handler
        const errorInfo = handleAuthError(err, 'Login Failed')
        error.value = errorInfo.message

        // Clear any existing auth state
        user.value = null
        isAuthenticated.value = false

        throw err
      }
    })
  }

  const register = async (data: RegisterData) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      const response = await api.register(data)

      // Auto-login after successful registration
      if (response.access && response.refresh) {
        const tokens = {
          access: response.access,
          refresh: response.refresh,
          expires_in: response.expires_in || 3600
        }

        // Save tokens to localStorage
        if (process.client) {
          localStorage.setItem('auth_tokens', JSON.stringify(tokens))
        }

        // Set user data
        user.value = response.user
        isAuthenticated.value = true
      }

      return response
    } catch (err: any) {
      console.error('❌ Error en registro:', err)

      // Handle different error formats
      let errorMessage = 'Registration failed'
      if (err.data && err.data.errors) {
        // Handle validation errors
        const errors = err.data.errors
        const errorMessages = Object.values(errors).flat()
        errorMessage = errorMessages.join(', ')
      } else if (err.data && err.data.error) {
        errorMessage = err.data.error
      } else if (err.data && err.data.message) {
        errorMessage = err.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true

      // Try to logout from backend
      try {
        const api = useApi()
        await api.logout()
        console.log('✅ Logout exitoso en backend')
      } catch (logoutError) {
        console.warn('⚠️ Error en logout del backend:', logoutError)
        // Continue with local logout even if backend logout fails
      }

      // Clear tokens from localStorage
      if (process.client) {
        localStorage.removeItem('auth_tokens')
        console.log('🗑️ Tokens eliminados del localStorage')
      }

      // Reset state
      user.value = null
      isAuthenticated.value = false
      error.value = null

      console.log('👋 Logout completado')

      // Redirect to home
      await navigateTo('/')

    } catch (err: any) {
      console.error('❌ Error en logout:', err)

      // Even if logout fails, clear local state
      if (process.client) {
        localStorage.removeItem('auth_tokens')
      }
      user.value = null
      isAuthenticated.value = false
      error.value = null
    } finally {
      loading.value = false
    }
  }

  const fetchProfile = async () => {
    try {
      console.log('📡 Obteniendo perfil de usuario...')
      const api = useApi()
      const profile = await api.getProfile()

      user.value = profile
      isAuthenticated.value = true

      console.log('✅ Perfil obtenido:', {
        username: user.value?.username,
        isStaff: user.value?.is_staff,
        email: user.value?.email
      })

      return profile
    } catch (err: any) {
      console.error('❌ Error obteniendo perfil:', err)

      // Only logout if it's an authentication error (401)
      if (err.statusCode === 401 || err.status === 401) {
        console.log('🔒 Token inválido, cerrando sesión...')
        await logout()
        throw new Error('Session expired')
      } else {
        // For other errors, just log but don't logout
        console.warn('⚠️ Error temporal obteniendo perfil, manteniendo sesión')

        let errorMessage = 'Failed to fetch profile'
        if (err.data && err.data.error) {
          errorMessage = err.data.error
        } else if (err.message) {
          errorMessage = err.message
        }

        throw new Error(errorMessage)
      }
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      loading.value = true
      error.value = null

      const api = useApi()
      const updatedUser = await api.updateProfile(data)

      user.value = updatedUser
      console.log('✅ Perfil actualizado:', updatedUser)

      return updatedUser
    } catch (err: any) {
      console.error('❌ Error actualizando perfil:', err)

      let errorMessage = 'Profile update failed'
      if (err.data && err.data.errors) {
        const errors = err.data.errors
        const errorMessages = Object.values(errors).flat()
        errorMessage = errorMessages.join(', ')
      } else if (err.data && err.data.error) {
        errorMessage = err.data.error
      } else if (err.message) {
        errorMessage = err.message
      }

      error.value = errorMessage
      throw new Error(errorMessage)
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

      console.log('✅ Contraseña cambiada exitosamente')

    } catch (err: any) {
      console.error('❌ Error cambiando contraseña:', err)

      let errorMessage = 'Password change failed'
      if (err.data && err.data.error) {
        errorMessage = err.data.error
      } else if (err.message) {
        errorMessage = err.message
      }

      error.value = errorMessage
      throw new Error(errorMessage)
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
          console.log('🔄 Inicializando autenticación con token existente...')

          // Check if token is expired
          const isTokenExpired = (token: string) => {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]))
              const currentTime = Date.now() / 1000
              return payload.exp < currentTime
            } catch {
              return true
            }
          }

          if (isTokenExpired(parsedTokens.access)) {
            console.log('⏰ Token expirado, intentando renovar...')

            if (parsedTokens.refresh && !isTokenExpired(parsedTokens.refresh)) {
              try {
                const api = useApi()
                const newTokens = await api.refreshTokens(parsedTokens.refresh)

                const updatedTokens = {
                  access: newTokens.access,
                  refresh: parsedTokens.refresh,
                  expires_in: newTokens.expires_in || 3600
                }

                localStorage.setItem('auth_tokens', JSON.stringify(updatedTokens))
                console.log('✅ Token renovado exitosamente')
              } catch (refreshError) {
                console.error('❌ Error renovando token:', refreshError)
                localStorage.removeItem('auth_tokens')
                isAuthenticated.value = false
                user.value = null
                return
              }
            } else {
              console.log('🚫 Refresh token también expirado')
              localStorage.removeItem('auth_tokens')
              isAuthenticated.value = false
              user.value = null
              return
            }
          }

          // Try to fetch profile to validate token and get user data
          try {
            await fetchProfile()
            console.log('✅ Autenticación inicializada correctamente')
          } catch (profileError: any) {
            console.warn('⚠️ Error obteniendo perfil durante inicialización:', profileError)

            // If it's a 401, clear tokens and logout
            if (profileError.statusCode === 401) {
              localStorage.removeItem('auth_tokens')
              isAuthenticated.value = false
              user.value = null
            } else {
              // For other errors, still consider authenticated but without user data
              isAuthenticated.value = true
              console.log('ℹ️ Manteniendo estado autenticado sin datos de usuario')
            }
          }
        }
      } else {
        console.log('ℹ️ No hay tokens guardados, usuario no autenticado')
        isAuthenticated.value = false
        user.value = null
      }
    } catch (err) {
      console.error('❌ Error inicializando autenticación:', err)
      // Clear invalid tokens
      if (process.client) {
        localStorage.removeItem('auth_tokens')
      }
      isAuthenticated.value = false
      user.value = null
    }
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
    initializeAuth
  }
}, {
  persist: {
    key: 'auth-store',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    pick: [] // Don't persist auth data - we handle tokens manually
  }
})
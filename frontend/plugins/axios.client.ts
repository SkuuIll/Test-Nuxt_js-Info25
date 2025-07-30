import axios from 'axios'

// DISABLED: This plugin conflicts with the main useApi composable
// Using $fetch instead of axios for consistency
export default defineNuxtPlugin(() => {
  return // Early return to disable this plugin

  // Legacy code below - keeping for reference
  const config = useRuntimeConfig()

  // Create axios instance
  const axiosInstance = axios.create({
    baseURL: config.public.apiBase + '/api/v1',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      // Add auth token if available
      if (process.client) {
        const tokens = localStorage.getItem('auth_tokens')
        if (tokens) {
          try {
            const parsedTokens = JSON.parse(tokens)
            if (parsedTokens.access) {
              config.headers.Authorization = `Bearer ${parsedTokens.access}`
            }
          } catch (error) {
            console.warn('Error parsing auth tokens:', error)
          }
        }
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      const originalRequest = error.config

      // Handle 401 errors (token expired)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        if (process.client) {
          const tokens = localStorage.getItem('auth_tokens')
          if (tokens) {
            try {
              const parsedTokens = JSON.parse(tokens)
              if (parsedTokens.refresh) {
                // Try to refresh token
                const refreshResponse = await axiosInstance.post('/users/auth/refresh/', {
                  refresh: parsedTokens.refresh
                })

                const newTokens = refreshResponse.data
                localStorage.setItem('auth_tokens', JSON.stringify(newTokens))

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newTokens.access}`
                return axiosInstance(originalRequest)
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect
              localStorage.removeItem('auth_tokens')
              await navigateTo('/login')
              return Promise.reject(refreshError)
            }
          }
        }

        // No refresh token available, redirect to login
        await navigateTo('/login')
      }

      return Promise.reject(error)
    }
  )

  // Make axios available globally
  return {
    provide: {
      axios: axiosInstance
    }
  }
})
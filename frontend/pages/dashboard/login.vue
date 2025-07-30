<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Acceso al Dashboard
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Inicia sesión para administrar tu blog
        </p>
      </div>

      <!-- Login form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">Usuario</label>
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Usuario"
              :disabled="loading"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Contraseña</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña"
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Remember me checkbox -->
        <div class="flex items-center">
          <input
            id="remember-me"
            v-model="form.rememberMe"
            name="remember-me"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-900">
            Recordar usuario
          </label>
        </div>

        <!-- Error message -->
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Error de autenticación
              </h3>
              <div class="mt-2 text-sm text-red-700">
                {{ error }}
              </div>
            </div>
          </div>
        </div>

        <!-- Submit button -->
        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </span>
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </div>

        <!-- Back to site link -->
        <div class="text-center">
          <NuxtLink
            to="/"
            class="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Volver al sitio web
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

// Layout
definePageMeta({
  layout: false
})

// Composables
const { login, isAuthenticated } = useDashboardAuth()
const route = useRoute()



// Form state
const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// Load remembered username on mount
onMounted(() => {
  if (isAuthenticated()) {
    navigateTo('/dashboard')
  } else {
    // Load remembered username
    const rememberedUsername = localStorage.getItem('dashboard_remembered_username')
    if (rememberedUsername) {
      form.username = rememberedUsername
      form.rememberMe = true
    }
  }
})

const loading = ref(false)
const error = ref<string | null>(null)

// Form validation
const validateForm = () => {
  if (!form.username.trim()) {
    error.value = 'El usuario es requerido'
    return false
  }
  if (!form.password.trim()) {
    error.value = 'La contraseña es requerida'
    return false
  }
  if (form.username.length < 3) {
    error.value = 'El usuario debe tener al menos 3 caracteres'
    return false
  }
  if (form.password.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }
  return true
}

// Handle login
const handleLogin = async () => {
  if (loading.value) return

  // Validate form
  if (!validateForm()) return

  loading.value = true
  error.value = null

  try {
    const response = await login(form)

    if (response.error) {
      error.value = response.message
      
      // Focus on password field for retry if username exists
      nextTick(() => {
        const passwordInput = document.getElementById('password')
        if (passwordInput) {
          passwordInput.focus()
          passwordInput.select()
        }
      })
    } else {
      // Handle remember me
      if (form.rememberMe) {
        localStorage.setItem('dashboard_remembered_username', form.username)
      } else {
        localStorage.removeItem('dashboard_remembered_username')
      }
      
      // Show success message briefly before redirect
      error.value = null
      
      // Small delay to show success state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to dashboard or intended page
      const redirectTo = route.query.redirect as string || '/dashboard'
      await navigateTo(redirectTo)
    }
  } catch (err: any) {
    console.error('Login error:', err)
    
    // Handle different types of errors
    if (err.status === 401 || err.statusCode === 401) {
      error.value = 'Credenciales incorrectas. Verifica tu usuario y contraseña.'
    } else if (err.status === 429 || err.statusCode === 429) {
      error.value = 'Demasiados intentos de login. Espera unos minutos antes de intentar de nuevo.'
    } else if (err.status >= 500) {
      error.value = 'Error del servidor. Inténtalo de nuevo más tarde.'
    } else {
      error.value = 'Error de conexión. Verifica tu conexión a internet.'
    }
  } finally {
    loading.value = false
  }
}

// SEO
useHead({
  title: 'Login - Dashboard'
})
</script>
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Iniciar Sesión
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          O
          <NuxtLink
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            crea una cuenta nueva
          </NuxtLink>
        </p>
      </div>
      
      <form
        class="mt-8 space-y-6"
        @submit.prevent="handleLogin"
      >
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label
              for="username"
              class="sr-only"
            >
              Email
            </label>
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Email"
            >
          </div>
          <div>
            <label
              for="password"
              class="sr-only"
            >
              Contraseña
            </label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña"
            >
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              name="remember-me"
              type="checkbox"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
            >
            <label
              for="remember-me"
              class="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              Recordarme
            </label>
          </div>

          <div class="text-sm">
            <NuxtLink
              to="/forgot-password"
              class="font-medium text-primary-600 hover:text-primary-500"
            >
              ¿Olvidaste tu contraseña?
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-2">
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="loading"
              class="absolute left-0 inset-y-0 flex items-center pl-3"
            >
              <Icon
                name="loading"
                class="h-5 w-5 text-primary-500 animate-spin"
              />
            </span>
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
          
          <!-- Development Admin Login -->
          <button
            type="button"
            @click="loginAsAdmin"
            :disabled="loading"
            class="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔧 Login como Admin (Dev)
          </button>
          

        </div>

        <div
          v-if="error"
          class="rounded-md bg-red-50 dark:bg-red-900/20 p-4"
        >
          <div class="text-sm text-red-700 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
  layout: false
})

const { login, loading, error } = useAuth()
const { handleSuccessfulLogin } = useLoginRedirect()
const { error: authError } = useToast()

const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const handleLogin = async () => {
  try {
    console.log('🔐 Starting login process...')
    
    const result = await login({
      username: form.username,
      password: form.password
    })
    
    console.log('✅ Login successful, proceeding with redirect...')
    
    // Use the specialized login redirect handler
    await handleSuccessfulLogin(result)
    
  } catch (err: any) {
    console.error('❌ Login error:', err)
    authError(err.message || 'Error al iniciar sesión')
  }
}

// Development function to login as admin
const loginAsAdmin = async () => {
  try {
    console.log('🔧 DEV: Logging in as admin...')
    
    // Simulate admin login by setting form values
    form.username = 'admin@test.com'
    form.password = 'admin123'
    
    // Call the regular login function
    await handleLogin()
    
  } catch (err: any) {
    console.error('❌ Admin login error:', err)
    authError('Error al iniciar sesión como admin')
  }
}

// SEO
useHead({
  title: 'Iniciar Sesión - Blog de Noticias',
  meta: [
    { name: 'description', content: 'Inicia sesión en tu cuenta para acceder a contenido exclusivo y personalizado.' }
  ]
})
</script>
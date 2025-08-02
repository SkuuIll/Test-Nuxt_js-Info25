<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="container mx-auto px-4">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Test de Login y Redirección</h1>
        
        <!-- Auth Status -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border">
          <h2 class="text-xl font-semibold mb-4">Estado de Autenticación</h2>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-medium">Autenticado:</span>
              <span :class="isAuthenticated ? 'text-green-600' : 'text-red-600'">
                {{ isAuthenticated ? 'Sí' : 'No' }}
              </span>
            </div>
            
            <div v-if="user" class="flex items-center justify-between">
              <span class="font-medium">Usuario:</span>
              <span class="text-gray-900 dark:text-white">{{ user.username }}</span>
            </div>
            
            <div v-if="user" class="flex items-center justify-between">
              <span class="font-medium">Email:</span>
              <span class="text-gray-600 dark:text-gray-400">{{ user.email }}</span>
            </div>
            
            <div v-if="user" class="flex items-center justify-between">
              <span class="font-medium">Es Admin:</span>
              <span :class="user.is_staff ? 'text-green-600' : 'text-gray-600'">
                {{ user.is_staff ? 'Sí' : 'No' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Login Form -->
        <div v-if="!isAuthenticated" class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border">
          <h2 class="text-xl font-semibold mb-4">Login Rápido</h2>
          
          <form @submit.prevent="quickLogin" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Email:</label>
              <input
                v-model="loginForm.username"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="admin@test.com"
              >
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">Contraseña:</label>
              <input
                v-model="loginForm.password"
                type="password"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="admin123"
              >
            </div>
            
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            </button>
          </form>
          
          <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Cuentas de prueba:</strong></p>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>admin@test.com / admin123 (Administrador)</li>
              <li>editor@test.com / editor123 (Editor)</li>
              <li>user@test.com / user123 (Usuario normal)</li>
            </ul>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border">
          <h2 class="text-xl font-semibold mb-4">Acciones</h2>
          
          <div class="space-y-3">
            <div class="flex space-x-3">
              <NuxtLink 
                to="/" 
                class="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir a Inicio
              </NuxtLink>
              
              <NuxtLink 
                v-if="isAuthenticated && user?.is_staff" 
                to="/dashboard" 
                class="flex-1 bg-green-600 text-white text-center py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Ir al Dashboard
              </NuxtLink>
            </div>
            
            <div class="flex space-x-3">
              <button
                @click="testRedirect"
                class="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Test Redirección Manual
              </button>
              
              <button
                v-if="isAuthenticated"
                @click="handleLogout"
                class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <!-- Debug Info -->
        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 border">
          <h2 class="text-xl font-semibold mb-4">Información de Debug</h2>
          
          <div class="space-y-2 text-sm">
            <div><strong>URL actual:</strong> {{ currentUrl }}</div>
            <div><strong>Ruta actual:</strong> {{ $route.path }}</div>
            <div><strong>Query params:</strong> {{ JSON.stringify($route.query) }}</div>
            <div><strong>API Base:</strong> {{ apiBase }}</div>
            <div><strong>Tokens disponibles:</strong> {{ hasTokens ? 'Sí' : 'No' }}</div>
          </div>
          
          <div class="mt-4">
            <button
              @click="clearAllData"
              class="bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              🧹 Limpiar Todos los Datos
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isAuthenticated, login, logout, loading, error } = useAuth()
const { success, authError } = useToast()
const route = useRoute()
const config = useRuntimeConfig()

// Reactive data
const loginForm = reactive({
  username: 'admin@test.com',
  password: 'admin123'
})

// Computed
const currentUrl = computed(() => {
  if (process.client) {
    return window.location.href
  }
  return 'N/A'
})

const apiBase = computed(() => config.public.apiBase)

const hasTokens = computed(() => {
  if (process.client) {
    return !!(localStorage.getItem('access_token') && localStorage.getItem('refresh_token'))
  }
  return false
})

// Methods
const quickLogin = async () => {
  try {
    console.log('🔐 Quick login attempt...')
    
    const result = await login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    console.log('✅ Quick login successful:', result)
    success(`¡Login exitoso! Usuario: ${result?.user?.username}`)
    
    // Test immediate redirect
    setTimeout(() => {
      console.log('🔄 Testing redirect to home...')
      navigateTo('/', { replace: true })
    }, 1000)
    
  } catch (err: any) {
    console.error('❌ Quick login error:', err)
    authError(err.message || 'Error en login rápido')
  }
}

const testRedirect = () => {
  console.log('🧪 Testing manual redirect...')
  success('Redirigiendo a la página principal...')
  
  setTimeout(() => {
    navigateTo('/', { replace: true })
  }, 500)
}

const handleLogout = async () => {
  try {
    await logout()
    success('Sesión cerrada exitosamente')
  } catch (err: any) {
    authError(err.message || 'Error al cerrar sesión')
  }
}

const clearAllData = () => {
  if (process.client) {
    localStorage.clear()
    sessionStorage.clear()
    success('Todos los datos limpiados')
    
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
}

// SEO
useHead({
  title: 'Test Login - Blog de Noticias',
  meta: [
    { name: 'description', content: 'Página de prueba para login y redirección' }
  ]
})
</script>
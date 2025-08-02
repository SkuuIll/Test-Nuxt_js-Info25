<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Test de Autenticación Dashboard</h1>
    
    <div class="space-y-6">
      <!-- Login Form -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-4">Login Dashboard</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Usuario</label>
            <input
              v-model="loginForm.username"
              type="text"
              class="input w-full"
              placeholder="admin@test.com"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Contraseña</label>
            <input
              v-model="loginForm.password"
              type="password"
              class="input w-full"
              placeholder="admin123"
            />
          </div>
          
          <button
            type="submit"
            :disabled="loading"
            class="btn btn-primary"
          >
            <Icon v-if="loading" name="loading" class="w-4 h-4 animate-spin mr-2" />
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
          </button>
        </form>
      </div>

      <!-- Auth Status -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-2">Estado de Autenticación</h2>
        <div class="space-y-2 text-sm">
          <p>Tokens disponibles: <span :class="hasTokens ? 'text-green-600' : 'text-red-600'">{{ hasTokens ? 'Sí' : 'No' }}</span></p>
          <p>Access Token: {{ tokens?.access ? 'Disponible' : 'No disponible' }}</p>
          <p>Refresh Token: {{ tokens?.refresh ? 'Disponible' : 'No disponible' }}</p>
        </div>
        
        <div v-if="tokens" class="mt-4">
          <h3 class="font-medium mb-2">Tokens:</h3>
          <pre class="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-40">{{ JSON.stringify(tokens, null, 2) }}</pre>
        </div>
      </div>

      <!-- Test API Call -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-4">Test API Call</h2>
        
        <button
          @click="testApiCall"
          :disabled="!hasTokens || loading"
          class="btn btn-secondary mb-4"
        >
          Probar llamada a API
        </button>
        
        <div v-if="apiResult" class="mt-4">
          <h3 class="font-medium mb-2">Resultado:</h3>
          <pre class="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-40">{{ JSON.stringify(apiResult, null, 2) }}</pre>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <h2 class="text-lg font-semibold mb-2 text-red-800 dark:text-red-200">Error</h2>
        <p class="text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: []  // Skip auth middleware for this test
})

const { getDashboardTokens, setDashboardTokens } = useDashboardAuthSimple()
const { handleSuccess, handleError } = useErrorHandler()

const loading = ref(false)
const error = ref('')
const apiResult = ref(null)

const loginForm = reactive({
  username: 'admin@test.com',
  password: 'admin123'
})

const tokens = ref(getDashboardTokens())

const hasTokens = computed(() => {
  return !!(tokens.value?.access && tokens.value?.refresh)
})

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    
    console.log('🔐 Attempting dashboard login...')
    
    const response = await $fetch('/api/v1/dashboard/auth/login/', {
      method: 'POST',
      body: {
        username: loginForm.username,
        password: loginForm.password
      }
    })
    
    console.log('✅ Login response:', response)
    
    if (response.access && response.refresh) {
      setDashboardTokens(response)
      tokens.value = response
      handleSuccess('¡Login exitoso!')
    } else {
      throw new Error('Invalid response format')
    }
    
  } catch (err) {
    console.error('❌ Login failed:', err)
    error.value = err.message || 'Error en el login'
    handleError(err.message || 'Error en el login', 'handleLogin')
  } finally {
    loading.value = false
  }
}

const testApiCall = async () => {
  try {
    loading.value = true
    error.value = ''
    apiResult.value = null
    
    console.log('🧪 Testing API call...')
    
    const response = await $fetch('/api/v1/dashboard/auth/profile/', {
      headers: {
        'Authorization': `Bearer ${tokens.value.access}`
      }
    })
    
    console.log('✅ API call successful:', response)
    apiResult.value = response
    
  } catch (err) {
    console.error('❌ API call failed:', err)
    error.value = err.message || 'Error en la llamada API'
    apiResult.value = err.data || err
  } finally {
    loading.value = false
  }
}

// Update tokens reactively
watch(() => getDashboardTokens(), (newTokens) => {
  tokens.value = newTokens
}, { immediate: true })

// SEO
useHead({
  title: 'Auth Test - Dashboard'
})
</script>
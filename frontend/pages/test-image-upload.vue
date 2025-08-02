<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Test Simple de Subida de Imágenes</h1>
    
    <div class="space-y-6">
      <!-- Login Status -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-2">Estado de Login</h2>
        <div class="space-y-2 text-sm">
          <p>Autenticado: <span :class="isAuthenticated ? 'text-green-600' : 'text-red-600'">{{ isAuthenticated ? 'Sí' : 'No' }}</span></p>
          <p>Usuario: {{ user?.username || 'N/A' }}</p>
          <p>Tokens: <span :class="hasTokens ? 'text-green-600' : 'text-red-600'">{{ hasTokens ? 'Disponibles' : 'No disponibles' }}</span></p>
        </div>
        
        <!-- Quick Login -->
        <div v-if="!isAuthenticated" class="mt-4">
          <button @click="quickLogin" :disabled="loginLoading" class="btn btn-primary btn-sm">
            {{ loginLoading ? 'Iniciando...' : 'Login Rápido (admin)' }}
          </button>
        </div>
      </div>

      <!-- Upload Test -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-4">Prueba de Subida</h2>
        
        <div class="space-y-4">
          <div>
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              @change="handleFileSelect"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          
          <button
            @click="uploadImage"
            :disabled="!selectedFile || !hasTokens || uploading"
            class="btn btn-primary"
          >
            <Icon v-if="uploading" name="loading" class="w-4 h-4 animate-spin mr-2" />
            {{ uploading ? 'Subiendo...' : 'Subir Imagen' }}
          </button>
        </div>
      </div>

      <!-- Results -->
      <div v-if="result" class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-4">Resultado</h2>
        <pre class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(result, null, 2) }}</pre>
      </div>

      <!-- Uploaded Image -->
      <div v-if="imageUrl" class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-4">Imagen Subida</h2>
        <img :src="imageUrl" alt="Imagen subida" class="max-w-full h-auto rounded" />
        <p class="text-sm text-gray-600 mt-2">URL: {{ imageUrl }}</p>
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
// No middleware to avoid auth issues
definePageMeta({
  middleware: []
})

const { login, isAuthenticated, user } = useAuth()

const loginLoading = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const result = ref(null)
const imageUrl = ref('')
const error = ref('')

// Check if we have tokens
const hasTokens = computed(() => {
  if (!import.meta.client) return false
  
  try {
    const stored = localStorage.getItem('auth_tokens')
    if (stored) {
      const tokens = JSON.parse(stored)
      return !!(tokens?.access && tokens?.refresh)
    }
  } catch (e) {
    console.error('Error checking tokens:', e)
  }
  return false
})

const handleFileSelect = (event) => {
  selectedFile.value = event.target.files[0]
  result.value = null
  imageUrl.value = ''
  error.value = ''
}

const quickLogin = async () => {
  try {
    loginLoading.value = true
    error.value = ''
    
    await login({
      username: 'admin@test.com',
      password: 'admin123'
    })
    
  } catch (err) {
    error.value = err.message || 'Error en login'
  } finally {
    loginLoading.value = false
  }
}

const uploadImage = async () => {
  if (!selectedFile.value) return
  
  try {
    uploading.value = true
    error.value = ''
    result.value = null
    imageUrl.value = ''

    console.log('🖼️ Starting simple upload test...')
    
    // Get tokens directly from localStorage
    const stored = localStorage.getItem('auth_tokens')
    if (!stored) {
      throw new Error('No auth tokens found')
    }
    
    const tokens = JSON.parse(stored)
    if (!tokens.access) {
      throw new Error('No access token found')
    }

    console.log('🔑 Using token:', tokens.access.substring(0, 20) + '...')

    // Prepare form data
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('alt_text', 'Test upload')
    formData.append('is_public', 'true')

    console.log('📤 Uploading to /api/v1/media/upload/')

    // Make request using fetch directly
    const response = await fetch('/api/v1/media/upload/', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${tokens.access}`
      }
    })

    console.log('📥 Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Response error:', errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('📥 Response data:', data)
    
    result.value = data

    if (data.error === false && data.data?.file_url) {
      imageUrl.value = data.data.file_url
      console.log('✅ Upload successful!')
    } else {
      throw new Error(data.message || 'Upload failed')
    }

  } catch (err) {
    console.error('❌ Upload failed:', err)
    error.value = err.message || 'Error desconocido'
    result.value = { error: err.message, details: err }
  } finally {
    uploading.value = false
  }
}

// SEO
useHead({
  title: 'Test Image Upload'
})
</script>
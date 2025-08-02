<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Test de Subida de Imágenes</h1>
    
    <div class="space-y-6">
      <!-- Auth Status -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-2">Estado de Autenticación</h2>
        <div class="space-y-2 text-sm">
          <p>Autenticado: <span :class="isAuthenticated ? 'text-green-600' : 'text-red-600'">{{ isAuthenticated ? 'Sí' : 'No' }}</span></p>
          <p>Usuario: {{ user?.username || 'N/A' }}</p>
          <p>Tokens: <span :class="hasTokens ? 'text-green-600' : 'text-red-600'">{{ hasTokens ? 'Disponibles' : 'No disponibles' }}</span></p>
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
              @change="handleFileUpload"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          
          <button
            @click="testUpload"
            :disabled="loading || !selectedFile"
            class="btn btn-primary"
          >
            <Icon v-if="loading" name="loading" class="w-4 h-4 animate-spin mr-2" />
            {{ loading ? 'Subiendo...' : 'Probar Subida' }}
          </button>
        </div>
      </div>

      <!-- Results -->
      <div v-if="uploadResult" class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-4">Resultado</h2>
        <pre class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto">{{ JSON.stringify(uploadResult, null, 2) }}</pre>
      </div>

      <!-- Uploaded Image -->
      <div v-if="uploadedImageUrl" class="bg-white dark:bg-gray-800 rounded-lg p-4 border">
        <h2 class="text-lg font-semibold mb-4">Imagen Subida</h2>
        <img :src="uploadedImageUrl" alt="Imagen subida" class="max-w-full h-auto rounded" />
        <p class="text-sm text-gray-600 mt-2">URL: {{ uploadedImageUrl }}</p>
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
  middleware: 'dashboard-auth'
})

const { getDashboardTokens } = useDashboardAuthSimple()
const user = ref(null)
const isAuthenticated = ref(false)
const { handleSuccess, handleError } = useErrorHandler()

const loading = ref(false)
const selectedFile = ref(null)
const uploadResult = ref(null)
const uploadedImageUrl = ref('')
const error = ref('')
const fileInput = ref(null)

const hasTokens = computed(() => {
  const tokens = getDashboardTokens()
  return !!(tokens?.access && tokens?.refresh)
})

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  selectedFile.value = file
  uploadResult.value = null
  uploadedImageUrl.value = ''
  error.value = ''
}

const testUpload = async () => {
  if (!selectedFile.value) return

  try {
    loading.value = true
    error.value = ''
    uploadResult.value = null
    uploadedImageUrl.value = ''

    console.log('🧪 Starting upload test...')
    
    // Get tokens
    const tokens = getDashboardTokens()
    console.log('🔑 Tokens:', {
      hasAccess: !!tokens?.access,
      hasRefresh: !!tokens?.refresh,
      accessLength: tokens?.access?.length || 0
    })

    if (!tokens?.access) {
      throw new Error('No access token available')
    }

    // Prepare form data
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('alt_text', 'Test upload image')
    formData.append('is_public', 'true')

    console.log('📤 Uploading file:', {
      name: selectedFile.value.name,
      size: selectedFile.value.size,
      type: selectedFile.value.type
    })

    // Make request
    const response = await $fetch('/api/v1/media/upload/', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${tokens.access}`
      }
    })

    console.log('📥 Response received:', response)
    uploadResult.value = response

    if (response.error === false && response.data?.file_url) {
      uploadedImageUrl.value = response.data.file_url
      handleSuccess('¡Imagen subida exitosamente!')
    } else {
      throw new Error(response.message || 'Upload failed')
    }

  } catch (err) {
    console.error('❌ Upload test failed:', err)
    error.value = err.message || 'Error desconocido'
    uploadResult.value = err.data || err
    handleError(err.message || 'Error al subir la imagen', 'testUpload')
  } finally {
    loading.value = false
  }
}

// SEO
useHead({
  title: 'Test Upload - Dashboard'
})
</script>
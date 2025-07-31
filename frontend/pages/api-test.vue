<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">🧪 API Test - Fixed Version</h1>
    
    <div class="space-y-4">
      <button 
        @click="testApi" 
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        :disabled="loading"
      >
        {{ loading ? 'Testing...' : 'Test useApi()' }}
      </button>
      
      <div v-if="result" class="p-4 rounded" :class="result.success ? 'bg-green-100' : 'bg-red-100'">
        <h3 class="font-bold">{{ result.success ? '✅ Success' : '❌ Error' }}</h3>
        <p class="text-sm mt-2">{{ result.message }}</p>
        <pre v-if="result.data" class="text-xs mt-2 bg-white p-2 rounded overflow-x-auto">{{ JSON.stringify(result.data, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
// Force client-side only
definePageMeta({
  ssr: false
})

const loading = ref(false)
const result = ref(null)

const testApi = async () => {
  loading.value = true
  result.value = null
  
  try {
    console.log('🔍 Testing direct fetch first...')
    
    // Test direct fetch first to confirm it works
    const directResponse = await fetch('http://localhost:8000/api/v1/posts/?page_size=12', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })
    
    if (!directResponse.ok) {
      throw new Error(`Direct fetch failed: ${directResponse.status}`)
    }
    
    const directData = await directResponse.json()
    console.log('✅ Direct fetch works:', directData)
    
    // Now test useApi
    console.log('🔍 Testing useApi() with fixed implementation...')
    const api = useApi()
    console.log('📊 useApi instance created successfully')
    
    // Test getPosts method
    const response = await api.getPosts({ page_size: 12 })
    console.log('✅ getPosts response received:', response)
    
    result.value = {
      success: true,
      message: `Both direct fetch and useApi() work! Fetched ${response.results ? response.results.length : 0} posts`,
      data: {
        direct_fetch_count: directData.data ? directData.data.length : 0,
        useapi_count: response.results ? response.results.length : 0,
        first_post: response.results && response.results[0] ? response.results[0].titulo : 'N/A'
      }
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error)
    
    result.value = {
      success: false,
      message: `Error: ${error.message || 'Unknown error'}`,
      data: {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack
      }
    }
  } finally {
    loading.value = false
  }
}

// Auto-test on mount
onMounted(() => {
  console.log('🚀 API test page mounted')
  setTimeout(testApi, 1000) // Auto-test after 1 second
})
</script>
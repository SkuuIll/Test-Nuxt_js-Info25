<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Test de Carga de Imágenes</h1>
        
        <!-- Image URL Testing -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border">
          <h2 class="text-xl font-semibold mb-4">URLs de Imágenes</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">URL de prueba:</label>
              <input
                v-model="testImageUrl"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="/media/uploads/test-image.jpg"
              >
            </div>
            
            <div>
              <strong>URL normalizada:</strong>
              <code class="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                {{ normalizeImageUrl(testImageUrl) || 'null' }}
              </code>
            </div>
          </div>
        </div>

        <!-- Image Components Testing -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border">
          <h2 class="text-xl font-semibold mb-4">Componentes de Imagen</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Test with placeholder -->
            <div class="space-y-2">
              <h3 class="font-medium">Placeholder</h3>
              <EnhancedImage
                :src="null"
                alt="Test placeholder"
                :fallback-src="getPlaceholderUrl('post')"
                aspect-ratio="16/9"
                container-class="w-full h-32"
                image-class="w-full h-full object-cover rounded"
              />
            </div>

            <!-- Test with custom URL -->
            <div class="space-y-2">
              <h3 class="font-medium">URL Personalizada</h3>
              <EnhancedImage
                :src="normalizeImageUrl(testImageUrl)"
                alt="Test custom URL"
                :fallback-src="getPlaceholderUrl('post')"
                aspect-ratio="16/9"
                container-class="w-full h-32"
                image-class="w-full h-full object-cover rounded"
              />
            </div>

            <!-- Test with broken URL -->
            <div class="space-y-2">
              <h3 class="font-medium">URL Rota</h3>
              <EnhancedImage
                src="/media/broken-image.jpg"
                alt="Test broken URL"
                :fallback-src="getPlaceholderUrl('post')"
                aspect-ratio="16/9"
                container-class="w-full h-32"
                image-class="w-full h-full object-cover rounded"
              />
            </div>
          </div>
        </div>

        <!-- Posts Testing -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border">
          <h2 class="text-xl font-semibold mb-4">Posts de Prueba</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="post in testPosts"
              :key="post.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div class="relative h-48">
                <EnhancedImage
                  :src="getImageUrl(post)"
                  :alt="post.title"
                  :fallback-src="getPlaceholderUrl('post')"
                  aspect-ratio="16/9"
                  container-class="w-full h-full"
                  image-class="w-full h-full object-cover"
                />
              </div>
              <div class="p-4">
                <h3 class="font-semibold">{{ post.title }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Imagen: {{ post.image || 'Sin imagen' }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  URL normalizada: {{ getImageUrl(post) || 'null' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug Info -->
        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 border">
          <h2 class="text-xl font-semibold mb-4">Información de Debug</h2>
          
          <div class="space-y-2 text-sm">
            <div><strong>API Base:</strong> {{ apiBase }}</div>
            <div><strong>Runtime Config:</strong> {{ JSON.stringify(runtimeConfig.public) }}</div>
            <div><strong>Process Client:</strong> {{ process.client }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { normalizeImageUrl, getImageUrl, getPlaceholderUrl } = useImageUrl()
const runtimeConfig = useRuntimeConfig()

// Reactive data
const testImageUrl = ref('/media/uploads/test-image.jpg')

// Computed
const apiBase = computed(() => runtimeConfig.public.apiBase)

// Test posts data
const testPosts = ref([
  {
    id: 1,
    title: 'Post con imagen relativa',
    image: '/media/uploads/post1.jpg'
  },
  {
    id: 2,
    title: 'Post con imagen absoluta',
    image: 'http://localhost:8000/media/uploads/post2.jpg'
  },
  {
    id: 3,
    title: 'Post sin imagen',
    image: null
  },
  {
    id: 4,
    title: 'Post con imagen rota',
    image: '/media/uploads/broken-image.jpg'
  }
])

// SEO
useHead({
  title: 'Test Imágenes - Blog de Noticias',
  meta: [
    { name: 'description', content: 'Página de prueba para verificar la carga de imágenes' }
  ]
})
</script>
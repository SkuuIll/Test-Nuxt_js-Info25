<template>
  <div class="space-y-8">
    <!-- Search Widget -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Icon
          name="search"
          class="w-5 h-5 mr-2"
        />
        Buscar
      </h3>
      <SearchBar />
    </div>

    <!-- Categories Widget -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Icon
          name="folder"
          class="w-5 h-5 mr-2"
        />
        Categorías
      </h3>
      <div class="space-y-2">
        <NuxtLink
          v-for="category in categories || []"
          :key="category?.id || category?.slug"
          :to="`/category/${category?.slug || ''}`"
          class="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 group"
        >
          <span class="text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {{ category?.name || 'Sin nombre' }}
          </span>
          <span class="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full">
            {{ category?.posts_count || 0 }}
          </span>
        </NuxtLink>
      </div>
    </div>

    <!-- Recent Posts Widget -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Icon
          name="clock"
          class="w-5 h-5 mr-2"
        />
        Posts Recientes
      </h3>
      <div class="space-y-4">
        <article
          v-for="post in recentPosts"
          :key="post.id"
          class="group"
        >
          <NuxtLink
            :to="`/posts/${post.slug}`"
            class="flex space-x-3"
          >
            <div class="flex-shrink-0">
              <NuxtImg
                v-if="post.image"
                :src="post.image"
                :alt="post.title"
                class="w-16 h-16 object-cover rounded-lg"
                loading="lazy"
              />
              <div
                v-else
                class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center"
              >
                <Icon
                  name="newspaper"
                  class="w-6 h-6 text-white opacity-70"
                />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 line-clamp-2 transition-colors duration-200">
                {{ post.title }}
              </h4>
              <div class="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                <Icon
                  name="calendar"
                  class="w-3 h-3 mr-1"
                />
                <time :datetime="post.published_at || post.created_at">
                  {{ formatDate(post.published_at || post.created_at) }}
                </time>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
    </div>

    <!-- Newsletter Widget -->
    <div class="card p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Icon
          name="mail"
          class="w-5 h-5 mr-2"
        />
        Newsletter
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Suscríbete para recibir las últimas noticias directamente en tu email.
      </p>
      <form
        class="space-y-3"
        @submit.prevent="subscribeNewsletter"
      >
        <input
          v-model="newsletterEmail"
          type="email"
          placeholder="Tu email"
          required
          class="input"
          :disabled="newsletterLoading"
        >
        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="newsletterLoading"
        >
          <span
            v-if="newsletterLoading"
            class="flex items-center justify-center"
          >
            <div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Suscribiendo...
          </span>
          <span v-else>Suscribirse</span>
        </button>
      </form>
    </div>

    <!-- Tags Cloud Widget -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Icon
          name="tag"
          class="w-5 h-5 mr-2"
        />
        Tags Populares
      </h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="tag in popularTags"
          :key="tag.id"
          :to="`/tag/${tag.slug}`"
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
        >
          {{ tag.name }}
        </NuxtLink>
      </div>
    </div>

    <!-- Social Links Widget -->
    <div class="card p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Icon
          name="share"
          class="w-5 h-5 mr-2"
        />
        Síguenos
      </h3>
      <div class="flex space-x-3">
        <a
          href="#"
          class="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
          title="Facebook"
        >
          <Icon
            name="facebook"
            class="w-5 h-5"
          />
        </a>
        <a
          href="#"
          class="flex items-center justify-center w-10 h-10 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors duration-200"
          title="Twitter"
        >
          <Icon
            name="twitter"
            class="w-5 h-5"
          />
        </a>
        <a
          href="#"
          class="flex items-center justify-center w-10 h-10 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors duration-200"
          title="Instagram"
        >
          <Icon
            name="instagram"
            class="w-5 h-5"
          />
        </a>
        <a
          href="#"
          class="flex items-center justify-center w-10 h-10 bg-blue-700 text-white rounded-full hover:bg-blue-800 transition-colors duration-200"
          title="LinkedIn"
        >
          <Icon
            name="linkedin"
            class="w-5 h-5"
          />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const blogStore = useBlogStore()
const { $toast } = useNuxtApp()

// Reactive state
const newsletterEmail = ref('')
const newsletterLoading = ref(false)

// Computed
const categories = computed(() => blogStore.categories)
const recentPosts = computed(() => blogStore.recentPosts)

// Mock popular tags (in real app, this would come from API)
const popularTags = ref([
  { id: 1, name: 'Tecnología', slug: 'tecnologia' },
  { id: 2, name: 'Política', slug: 'politica' },
  { id: 3, name: 'Deportes', slug: 'deportes' },
  { id: 4, name: 'Ciencia', slug: 'ciencia' },
  { id: 5, name: 'Salud', slug: 'salud' },
  { id: 6, name: 'Economía', slug: 'economia' }
])

// Methods
const subscribeNewsletter = async () => {
  if (!newsletterEmail.value.trim()) return

  try {
    newsletterLoading.value = true
    const api = useApi()
    await api.subscribeNewsletter(newsletterEmail.value)
    
    $toast.success('¡Suscripción exitosa! Revisa tu email.')
    newsletterEmail.value = ''
  } catch (error: any) {
    $toast.error(error.message || 'Error al suscribirse. Intenta de nuevo.')
  } finally {
    newsletterLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return 'Hace 1 día'
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`
  } else {
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    })
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
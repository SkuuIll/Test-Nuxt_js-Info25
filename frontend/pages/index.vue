<template>
  <div>
    <!-- Welcome Message for Authenticated Users -->
    <div v-if="isAuthenticated" class="bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
              {{ user?.username?.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-lg font-semibold text-primary-900 dark:text-primary-100">
                ¡Bienvenido, {{ user?.username }}!
              </h2>
              <p class="text-sm text-primary-700 dark:text-primary-300">
                {{ user?.is_staff ? 'Tienes acceso completo al sistema de administración' : 'Disfruta del contenido personalizado' }}
              </p>
            </div>
          </div>
          <div v-if="user?.is_staff" class="hidden md:block">
            <NuxtLink 
              to="/dashboard" 
              class="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <Icon name="settings" class="w-4 h-4" />
              <span>Ir al Dashboard</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Hero Section -->
    <HeroSection v-if="!isAuthenticated" />
    
    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <main class="lg:col-span-2">
          <!-- Featured Posts -->
          <section
            v-if="featuredPosts.length > 0"
            class="mb-12"
          >
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Artículos Destacados
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PostCard
                v-for="post in featuredPosts.slice(0, 4)"
                :key="post.id"
                :post="post"
                :show-excerpt="true"
                :show-category="true"
                :show-author="true"
                :show-date="true"
              />
            </div>
          </section>

          <!-- Recent Posts -->
          <section>
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                Últimas Noticias
              </h2>
              <NuxtLink
                to="/posts"
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todas →
              </NuxtLink>
            </div>

            <!-- Loading State -->
            <div
              v-if="loading"
              class="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <PostCardSkeleton
                v-for="i in 6"
                :key="i"
              />
            </div>

            <!-- Error State -->
            <div
              v-else-if="error"
              class="text-center py-12"
            >
              <Icon
                name="x"
                class="w-12 h-12 text-red-500 mx-auto mb-4"
              />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Error al cargar las noticias
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                {{ error }}
              </p>
              <button
                class="btn btn-primary"
                @click="refreshPosts"
              >
                Reintentar
              </button>
            </div>

            <!-- Posts Grid -->
            <PostGrid
              v-else
              :posts="posts"
              :loading="false"
              :has-more="pagination.hasNext"
              :infinite-scroll="false"
              empty-title="No hay artículos disponibles"
              empty-message="No se encontraron artículos en este momento."
              @load-more="loadMore"
            />
          </section>
        </main>

        <!-- Sidebar -->
        <aside class="lg:col-span-1">
          <BlogSidebar />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Force client-side rendering to avoid SSR issues
definePageMeta({
  ssr: false
})

// SEO
useHead({
  title: 'Inicio - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content: 'Tu fuente confiable de información actualizada y relevante. Descubre las últimas noticias, análisis y artículos de interés.'
    },
    {
      property: 'og:title',
      content: 'Blog de Noticias - Tu fuente confiable de información'
    },
    {
      property: 'og:description',
      content: 'Descubre las últimas noticias, análisis y artículos de interés en nuestro blog.'
    },
    {
      property: 'og:type',
      content: 'website'
    }
  ]
})

// Store and Auth
const blogStore = useBlogStore()
const { user, isAuthenticated } = useAuth()

// Computed
const posts = computed(() => blogStore.posts)
const featuredPosts = computed(() => blogStore.featuredPosts)
const loading = computed(() => blogStore.loading)
const error = computed(() => blogStore.error)
const pagination = computed(() => blogStore.pagination)

// Methods
const refreshPosts = async () => {
  await blogStore.fetchPosts()
}

const loadMore = async () => {
  await blogStore.loadMorePosts()
}

// Initialize data
onMounted(async () => {
  // Only fetch if we don't have posts already
  if (posts.value.length === 0) {
    await blogStore.fetchPosts()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  // Don't reset state to preserve data for navigation
})
</script>
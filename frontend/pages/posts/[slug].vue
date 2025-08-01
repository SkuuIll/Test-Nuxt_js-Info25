<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="loading"
      class="container mx-auto px-4 py-8"
    >
      <div class="max-w-4xl mx-auto">
        <div class="skeleton h-8 w-3/4 mb-4" />
        <div class="skeleton h-4 w-1/2 mb-8" />
        <div class="skeleton h-64 mb-8" />
        <div class="space-y-4">
          <div class="skeleton-text h-4" />
          <div class="skeleton-text h-4" />
          <div class="skeleton-text h-4 w-3/4" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="container mx-auto px-4 py-8"
    >
      <div class="text-center py-12">
        <Icon
          name="x"
          class="w-12 h-12 text-red-500 mx-auto mb-4"
        />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Artículo no encontrado
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          {{ error }}
        </p>
        <NuxtLink
          to="/posts"
          class="btn btn-primary"
        >
          Ver todos los artículos
        </NuxtLink>
      </div>
    </div>

    <!-- Post Content -->
    <article
      v-else-if="post"
      class="container mx-auto px-4 py-8"
    >
      <div class="max-w-4xl mx-auto">
        <!-- Post Header -->
        <header class="mb-8">
          <!-- Category -->
          <div class="mb-4">
            <NuxtLink
              :to="`/posts?category=${post.category.slug}`"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors duration-200"
            >
              {{ post.category.name }}
            </NuxtLink>
          </div>

          <!-- Title -->
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {{ post.title }}
          </h1>

          <!-- Meta Information -->
          <div class="flex flex-col md:flex-row md:items-center md:justify-between text-gray-600 dark:text-gray-400 mb-6">
            <div class="flex items-center space-x-6 mb-4 md:mb-0">
              <!-- Author -->
              <div class="flex items-center space-x-2">
                <div class="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                  {{ post.author.username.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ post.author.username }}
                  </p>
                  <p class="text-sm">
                    Autor
                  </p>
                </div>
              </div>

              <!-- Date -->
              <div class="flex items-center space-x-1">
                <Icon
                  name="calendar"
                  class="w-4 h-4"
                />
                <time :datetime="post.published_at || post.created_at">
                  {{ formatDate(post.published_at || post.created_at) }}
                </time>
              </div>

              <!-- Reading Time -->
              <div class="flex items-center space-x-1">
                <Icon
                  name="clock"
                  class="w-4 h-4"
                />
                <span>{{ post.reading_time }} min de lectura</span>
              </div>
            </div>

            <!-- Share Buttons -->
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium mr-2">Compartir:</span>
              <button
                class="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
                title="Compartir en Facebook"
                @click="shareOnFacebook"
              >
                <Icon
                  name="facebook"
                  class="w-4 h-4"
                />
              </button>
              <button
                class="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors duration-200"
                title="Compartir en Twitter"
                @click="shareOnTwitter"
              >
                <Icon
                  name="twitter"
                  class="w-4 h-4"
                />
              </button>
              <button
                class="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors duration-200"
                title="Copiar enlace"
                @click="copyLink"
              >
                <Icon
                  name="share"
                  class="w-4 h-4"
                />
              </button>
            </div>
          </div>

          <!-- Featured Image -->
          <div
            v-if="post.image"
            class="mb-8"
          >
            <NuxtImg
              :src="post.image"
              :alt="post.title"
              class="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
              format="webp"
            />
          </div>
        </header>

        <!-- Post Content -->
        <div class="prose prose-lg dark:prose-invert max-w-none mb-12">
          <div v-html="post.content" />
        </div>

        <!-- Tags -->
        <div
          v-if="post.tags && post.tags.length > 0"
          class="mb-8"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tags:
          </h3>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="tag in post.tags"
              :key="tag.id"
              :to="`/posts?tags=${tag.slug}`"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
            >
              <Icon
                name="tag"
                class="w-3 h-3 mr-1"
              />
              {{ tag.name }}
            </NuxtLink>
          </div>
        </div>

        <!-- Post Actions -->
        <div class="flex items-center justify-between py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-8">
          <div class="flex items-center space-x-4">
            <button
              class="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              :class="{ 'text-red-500': isLiked }"
              @click="toggleLike"
            >
              <Icon
                name="heart"
                class="w-5 h-5"
              />
              <span>{{ isLiked ? 'Te gusta' : 'Me gusta' }}</span>
            </button>
          </div>

          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ post.comments_count }} comentarios
          </div>
        </div>

        <!-- Comments Section -->
        <section class="mb-12">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Comentarios ({{ post.comments_count }})
          </h3>

          <!-- Comment Form -->
          <div
            v-if="isAuthenticated"
            class="mb-8"
          >
            <form
              class="space-y-4"
              @submit.prevent="submitComment"
            >
              <textarea
                v-model="newComment"
                placeholder="Escribe tu comentario..."
                rows="4"
                class="input resize-none"
                required
              />
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="!newComment.trim() || commentLoading"
                  class="btn btn-primary"
                >
                  <span v-if="commentLoading">Enviando...</span>
                  <span v-else>Enviar comentario</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Login Prompt -->
          <div
            v-else
            class="mb-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
          >
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Inicia sesión para dejar un comentario
            </p>
            <NuxtLink
              to="/login"
              class="btn btn-primary"
            >
              Iniciar Sesión
            </NuxtLink>
          </div>

          <!-- Comments List -->
          <div class="space-y-6">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6"
            >
              <div class="flex items-start space-x-4">
                <div class="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                  {{ comment.author.username.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-2">
                    <h4 class="font-medium text-gray-900 dark:text-white">
                      {{ comment.author.username }}
                    </h4>
                    <time
                      class="text-sm text-gray-500 dark:text-gray-400"
                      :datetime="comment.created_at"
                    >
                      {{ formatDate(comment.created_at) }}
                    </time>
                  </div>
                  <p class="text-gray-700 dark:text-gray-300">
                    {{ comment.content }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Load More Comments -->
          <div
            v-if="hasMoreComments"
            class="text-center mt-6"
          >
            <button
              class="btn btn-secondary"
              @click="loadMoreComments"
            >
              Cargar más comentarios
            </button>
          </div>
        </section>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { Post, Comment } from '~/types'

const route = useRoute()
const { user, isAuthenticated } = useAuth()
const { $toast } = useNuxtApp()

// Reactive state
const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const newComment = ref('')
const commentLoading = ref(false)
const isLiked = ref(false)
const hasMoreComments = ref(false)

// Fetch post data
const fetchPost = async () => {
  try {
    loading.value = true
    error.value = null
    
    const api = useApi()
    const slug = route.params.slug as string
    
    // Debug logging
    console.log('🔍 Fetching post with slug:', slug)
    console.log('📍 Route params:', route.params)
    console.log('🛣️ Full route path:', route.fullPath)
    
    // Validate slug
    if (!slug || slug === 'undefined' || slug === 'null') {
      console.error('❌ Invalid slug detected:', slug)
      throw new Error('Slug de post inválido')
    }
    
    const response = await api.getPost(slug)
    post.value = response.data || response
    
    // Fetch comments
    const commentsResponse = await api.getComments({ post: post.value.id })
    comments.value = commentsResponse.results || commentsResponse.data || []
    hasMoreComments.value = !!commentsResponse.next
    
  } catch (err: any) {
    console.error('❌ Error fetching post:', err)
    error.value = err.message || 'Post no encontrado'
    
    // Only throw error for actual 404s, not network errors
    if (err.status === 404 || err.statusCode === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Post no encontrado'
      })
    }
  } finally {
    loading.value = false
  }
}

// Submit comment
const submitComment = async () => {
  if (!newComment.value.trim() || !post.value) return

  try {
    commentLoading.value = true
    const api = useApi()
    
    const response = await api.createComment({
      content: newComment.value.trim(),
      post: post.value.id
    })
    const comment = response.data || response
    
    comments.value.unshift(comment)
    newComment.value = ''
    post.value.comments_count++
    
    $toast.success('Comentario enviado exitosamente')
  } catch (error: any) {
    $toast.error(error.message || 'Error al enviar comentario')
  } finally {
    commentLoading.value = false
  }
}

// Load more comments
const loadMoreComments = async () => {
  if (!post.value) return
  
  try {
    const api = useApi()
    const response = await api.getComments({
      post: post.value.id,
      page: Math.floor(comments.value.length / 20) + 2
    })
    
    comments.value.push(...(response.results || response.data || []))
    hasMoreComments.value = !!response.next
  } catch (error) {
    $toast.error('Error al cargar más comentarios')
  }
}

// Toggle like
const toggleLike = () => {
  isLiked.value = !isLiked.value
  $toast.success(isLiked.value ? '¡Te gusta este artículo!' : 'Ya no te gusta este artículo')
}

// Share functions
const shareOnFacebook = () => {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
  window.open(url, '_blank', 'width=600,height=400')
}

const shareOnTwitter = () => {
  const text = `${post.value?.title} - ${window.location.href}`
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'width=600,height=400')
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    $toast.success('Enlace copiado al portapapeles')
  } catch (error) {
    $toast.error('Error al copiar enlace')
  }
}

// Format date utility
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// SEO
watchEffect(() => {
  if (post.value) {
    useHead({
      title: `${post.value.title} - Blog de Noticias`,
      meta: [
        {
          name: 'description',
          content: post.value.meta_description || post.value.excerpt
        },
        {
          property: 'og:title',
          content: post.value.meta_title || post.value.title
        },
        {
          property: 'og:description',
          content: post.value.meta_description || post.value.excerpt
        },
        {
          property: 'og:image',
          content: post.value.image || ''
        },
        {
          property: 'og:type',
          content: 'article'
        },
        {
          property: 'article:author',
          content: post.value.author.username
        },
        {
          property: 'article:published_time',
          content: post.value.published_at || post.value.created_at
        }
      ]
    })
  }
})

// Initialize
onMounted(async () => {
  try {
    await fetchPost()
  } catch (error) {
    console.error('Error initializing post page:', error)
  }
})
</script>

<style scoped>
.prose {
  @apply text-gray-700 dark:text-gray-300;
}

.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  @apply text-gray-900 dark:text-white;
}

.prose a {
  @apply text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300;
}

.prose blockquote {
  @apply border-l-4 border-primary-500 bg-gray-50 dark:bg-gray-800;
}

.prose code {
  @apply bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400;
}

.prose pre {
  @apply bg-gray-900 text-gray-100;
}
</style>
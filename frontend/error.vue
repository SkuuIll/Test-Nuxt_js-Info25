<template>
  <div class="error-page">
    <div class="error-container">
      <!-- Error Illustration -->
      <div class="error-illustration">
        <div v-if="error.statusCode === 404" class="illustration-404">
          <svg class="w-64 h-64 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0120 12a8 8 0 10-16 0 7.962 7.962 0 012 5.291z" />
          </svg>
          <div class="illustration-text">404</div>
        </div>
        
        <div v-else-if="error.statusCode === 500" class="illustration-500">
          <svg class="w-64 h-64 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="illustration-text">500</div>
        </div>
        
        <div v-else class="illustration-generic">
          <svg class="w-64 h-64 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="illustration-text">{{ error.statusCode || 'Error' }}</div>
        </div>
      </div>

      <!-- Error Content -->
      <div class="error-content">
        <h1 class="error-title">{{ errorTitle }}</h1>
        <p class="error-message">{{ errorMessage }}</p>
        
        <!-- Helpful Suggestions -->
        <div class="error-suggestions">
          <h3 class="suggestions-title">¿Qué puedes hacer?</h3>
          <ul class="suggestions-list">
            <li v-for="suggestion in suggestions" :key="suggestion">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="error-actions">
        <button
          @click="goHome"
          class="action-button primary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Ir al inicio
        </button>
        
        <button
          @click="goBack"
          class="action-button secondary"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver atrás
        </button>
        
        <button
          v-if="error.statusCode !== 404"
          @click="retry"
          class="action-button secondary"
          :disabled="retrying"
        >
          <svg v-if="retrying" class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ retrying ? 'Reintentando...' : 'Reintentar' }}
        </button>
      </div>

      <!-- Search Box for 404 -->
      <div v-if="error.statusCode === 404" class="error-search">
        <h3 class="search-title">¿Buscas algo específico?</h3>
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar en el sitio..."
            class="search-input"
            @keyup.enter="performSearch"
          >
          <button
            @click="performSearch"
            class="search-button"
            :disabled="!searchQuery.trim()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Popular Links -->
      <div class="popular-links">
        <h3 class="links-title">Enlaces populares</h3>
        <div class="links-grid">
          <NuxtLink
            v-for="link in popularLinks"
            :key="link.path"
            :to="link.path"
            class="popular-link"
          >
            <div class="link-icon">
              <component :is="link.icon" class="w-6 h-6" />
            </div>
            <div class="link-content">
              <div class="link-title">{{ link.title }}</div>
              <div class="link-description">{{ link.description }}</div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Error Details (Development) -->
      <details v-if="isDevelopment" class="error-details">
        <summary class="details-summary">Detalles técnicos (desarrollo)</summary>
        <div class="details-content">
          <div class="detail-item">
            <strong>Status Code:</strong> {{ error.statusCode }}
          </div>
          <div class="detail-item">
            <strong>Status Message:</strong> {{ error.statusMessage }}
          </div>
          <div class="detail-item">
            <strong>URL:</strong> {{ error.url }}
          </div>
          <div v-if="error.stack" class="detail-item">
            <strong>Stack Trace:</strong>
            <pre class="error-stack">{{ error.stack }}</pre>
          </div>
        </div>
      </details>

      <!-- Report Issue -->
      <div class="report-section">
        <button
          @click="reportIssue"
          class="report-button"
          :disabled="issueReported"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {{ issueReported ? 'Problema reportado' : 'Reportar problema' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
    stack?: string
    url?: string
  }
}

const props = defineProps<Props>()

// Composables
const router = useRouter()
const { success, info } = useToast()

// State
const searchQuery = ref('')
const retrying = ref(false)
const issueReported = ref(false)

// Environment detection
const isDevelopment = computed(() => process.env.NODE_ENV === 'development')

// Error information
const errorTitle = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'Página no encontrada'
    case 500:
      return 'Error interno del servidor'
    case 403:
      return 'Acceso denegado'
    case 401:
      return 'No autorizado'
    default:
      return 'Ha ocurrido un error'
  }
})

const errorMessage = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'La página que buscas no existe o ha sido movida. Verifica la URL o usa los enlaces de navegación.'
    case 500:
      return 'Estamos experimentando problemas técnicos. Nuestro equipo ha sido notificado y está trabajando en una solución.'
    case 403:
      return 'No tienes permisos para acceder a esta página. Si crees que esto es un error, contacta al administrador.'
    case 401:
      return 'Necesitas iniciar sesión para acceder a esta página.'
    default:
      return props.error.message || 'Se ha producido un error inesperado. Por favor, intenta nuevamente.'
  }
})

const suggestions = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return [
        'Verifica que la URL esté escrita correctamente',
        'Usa el menú de navegación para encontrar lo que buscas',
        'Prueba la función de búsqueda',
        'Visita nuestra página de inicio'
      ]
    case 500:
      return [
        'Espera unos minutos e intenta nuevamente',
        'Verifica tu conexión a internet',
        'Contacta al soporte si el problema persiste'
      ]
    case 403:
      return [
        'Inicia sesión con una cuenta autorizada',
        'Contacta al administrador para obtener permisos',
        'Verifica que tengas los permisos necesarios'
      ]
    default:
      return [
        'Recarga la página',
        'Verifica tu conexión a internet',
        'Intenta nuevamente más tarde'
      ]
  }
})

const popularLinks = computed(() => [
  {
    path: '/',
    title: 'Inicio',
    description: 'Página principal del sitio',
    icon: HomeIcon
  },
  {
    path: '/posts',
    title: 'Artículos',
    description: 'Todos los artículos del blog',
    icon: DocumentTextIcon
  },
  {
    path: '/about',
    title: 'Acerca de',
    description: 'Información sobre nosotros',
    icon: InformationCircleIcon
  },
  {
    path: '/contact',
    title: 'Contacto',
    description: 'Ponte en contacto con nosotros',
    icon: ChatBubbleLeftRightIcon
  }
])

// Methods
const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (process.client && window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const retry = async () => {
  retrying.value = true
  
  try {
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reload the current page
    if (process.client) {
      window.location.reload()
    }
  } catch (e) {
    console.error('Retry failed:', e)
  } finally {
    retrying.value = false
  }
}

const performSearch = () => {
  if (!searchQuery.value.trim()) return
  
  router.push({
    path: '/search',
    query: { q: searchQuery.value.trim() }
  })
}

const reportIssue = async () => {
  try {
    await $fetch('/api/v1/error-reports', {
      method: 'POST',
      body: {
        type: 'PAGE_ERROR',
        statusCode: props.error.statusCode,
        statusMessage: props.error.statusMessage,
        url: props.error.url,
        message: props.error.message,
        userAgent: process.client ? navigator.userAgent : 'server',
        timestamp: Date.now()
      }
    })
    
    issueReported.value = true
    success('Problema reportado. Gracias por tu ayuda.')
  } catch (e) {
    console.warn('Failed to report issue:', e)
    info('No se pudo reportar el problema, pero hemos registrado el error.')
  }
}

// Meta tags
useHead({
  title: computed(() => `${errorTitle.value} - Blog de Noticias`),
  meta: [
    {
      name: 'description',
      content: computed(() => errorMessage.value)
    },
    {
      name: 'robots',
      content: 'noindex, nofollow'
    }
  ]
})
</script>

<style scoped>
.error-page {
  @apply min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4;
}

.error-container {
  @apply max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center;
}

.error-illustration {
  @apply mb-8;
}

.illustration-404,
.illustration-500,
.illustration-generic {
  @apply relative inline-block;
}

.illustration-text {
  @apply absolute inset-0 flex items-center justify-center text-6xl font-bold text-gray-400 dark:text-gray-500;
}

.error-content {
  @apply mb-8;
}

.error-title {
  @apply text-4xl font-bold text-gray-900 dark:text-white mb-4;
}

.error-message {
  @apply text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto;
}

.error-suggestions {
  @apply bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8;
}

.suggestions-title {
  @apply text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4;
}

.suggestions-list {
  @apply text-left text-blue-800 dark:text-blue-200 space-y-2;
}

.suggestions-list li {
  @apply flex items-start;
}

.suggestions-list li::before {
  @apply content-['•'] text-blue-600 dark:text-blue-400 mr-2 mt-1;
}

.error-actions {
  @apply flex flex-wrap gap-4 justify-center mb-8;
}

.action-button {
  @apply inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transform hover:scale-105;
}

.action-button.secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-4 focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 dark:focus:ring-gray-700;
}

.error-search {
  @apply mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.search-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.search-box {
  @apply flex max-w-md mx-auto;
}

.search-input {
  @apply flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white;
}

.search-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.popular-links {
  @apply mb-8;
}

.links-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-6;
}

.links-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto;
}

.popular-link {
  @apply flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 text-left;
}

.link-icon {
  @apply flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4;
}

.link-icon svg {
  @apply text-blue-600 dark:text-blue-400;
}

.link-content {
  @apply flex-1;
}

.link-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.link-description {
  @apply text-sm text-gray-600 dark:text-gray-300;
}

.error-details {
  @apply mb-8 text-left bg-gray-50 dark:bg-gray-700 rounded-lg p-4;
}

.details-summary {
  @apply cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white;
}

.details-content {
  @apply mt-4 space-y-2;
}

.detail-item {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.error-stack {
  @apply mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto;
}

.report-section {
  @apply border-t border-gray-200 dark:border-gray-600 pt-6;
}

.report-button {
  @apply inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed;
}
</style>
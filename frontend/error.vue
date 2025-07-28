<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <Icon
          :name="errorIcon"
          class="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600 mb-4"
        />
        <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-2">
          {{ error.statusCode }}
        </h1>
        <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {{ errorTitle }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-8">
          {{ error.statusMessage || errorMessage }}
        </p>
      </div>
      
      <div class="space-y-4">
        <button
          class="btn btn-primary w-full"
          @click="handleError"
        >
          {{ actionText }}
        </button>
        
        <NuxtLink
          to="/"
          class="btn btn-secondary w-full"
        >
          Ir al Inicio
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ErrorProps {
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}

const props = defineProps<ErrorProps>()

const errorIcon = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'search'
    case 403:
      return 'lock'
    case 500:
      return 'server'
    default:
      return 'alert'
  }
})

const errorTitle = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'Página no encontrada'
    case 403:
      return 'Acceso denegado'
    case 500:
      return 'Error del servidor'
    default:
      return 'Error'
  }
})

const errorMessage = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'La página que buscas no existe o ha sido movida.'
    case 403:
      return 'No tienes permisos para acceder a esta página.'
    case 500:
      return 'Ha ocurrido un error interno del servidor.'
    default:
      return 'Ha ocurrido un error inesperado.'
  }
})

const actionText = computed(() => {
  switch (props.error.statusCode) {
    case 404:
      return 'Buscar en el sitio'
    case 403:
      return 'Iniciar sesión'
    case 500:
      return 'Intentar de nuevo'
    default:
      return 'Recargar página'
  }
})

const handleError = () => {
  switch (props.error.statusCode) {
    case 404:
      navigateTo('/search')
      break
    case 403:
      navigateTo('/login')
      break
    case 500:
    default:
      window.location.reload()
      break
  }
}

// SEO
useHead({
  title: `Error ${props.error.statusCode} - Blog de Noticias`,
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>
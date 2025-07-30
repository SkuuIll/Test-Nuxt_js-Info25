<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Recuperar Contraseña
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Ingresa tu email para recibir instrucciones de recuperación
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div>
          <label for="email" class="sr-only">Email</label>
          <input
            id="email"
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
            required
            class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
            placeholder="Dirección de email"
          />
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon v-if="loading" name="loading" class="w-4 h-4 animate-spin mr-2" />
            {{ loading ? 'Enviando...' : 'Enviar Instrucciones' }}
          </button>
        </div>

        <div class="text-center">
          <NuxtLink
            to="/login"
            class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Volver al Login
          </NuxtLink>
        </div>
      </form>

      <div v-if="message" class="mt-4 p-4 rounded-md" :class="messageType === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
})

const { requestPasswordReset } = useAuth()
const { handleError } = useErrorHandler()

const email = ref('')
const loading = ref(false)
const message = ref('')
const messageType = ref('')

const handleSubmit = async () => {
  try {
    loading.value = true
    message.value = ''
    
    await requestPasswordReset(email.value)
    
    message.value = 'Se han enviado las instrucciones de recuperación a tu email.'
    messageType.value = 'success'
    
  } catch (error) {
    message.value = 'Error al enviar las instrucciones. Inténtalo de nuevo.'
    messageType.value = 'error'
    handleError(error, 'forgotPassword')
  } finally {
    loading.value = false
  }
}

// SEO
useHead({
  title: 'Recuperar Contraseña - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content: 'Recupera tu contraseña para acceder a tu cuenta del blog.'
    },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>
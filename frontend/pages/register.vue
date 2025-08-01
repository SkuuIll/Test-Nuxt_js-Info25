<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Crear Cuenta
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          O
          <NuxtLink
            to="/login"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            inicia sesión con tu cuenta existente
          </NuxtLink>
        </p>
      </div>
      
      <form
        class="mt-8 space-y-6"
        @submit.prevent="handleRegister"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                for="first_name"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nombre
              </label>
              <input
                id="first_name"
                v-model="form.first_name"
                name="first_name"
                type="text"
                class="mt-1 input"
                placeholder="Tu nombre"
              >
            </div>
            <div>
              <label
                for="last_name"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Apellido
              </label>
              <input
                id="last_name"
                v-model="form.last_name"
                name="last_name"
                type="text"
                class="mt-1 input"
                placeholder="Tu apellido"
              >
            </div>
          </div>
          
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Usuario *
            </label>
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="text"
              required
              class="mt-1 input"
              placeholder="Nombre de usuario"
            >
          </div>
          
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email *
            </label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              required
              class="mt-1 input"
              placeholder="tu@email.com"
            >
          </div>
          
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Contraseña *
            </label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="mt-1 input"
              placeholder="Contraseña segura"
            >
          </div>
          
          <div>
            <label
              for="password_confirm"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Confirmar Contraseña *
            </label>
            <input
              id="password_confirm"
              v-model="form.password_confirm"
              name="password_confirm"
              type="password"
              required
              class="mt-1 input"
              placeholder="Confirma tu contraseña"
            >
          </div>
        </div>

        <div class="flex items-center">
          <input
            id="accept-terms"
            v-model="form.acceptTerms"
            name="accept-terms"
            type="checkbox"
            required
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
          >
          <label
            for="accept-terms"
            class="ml-2 block text-sm text-gray-900 dark:text-gray-300"
          >
            Acepto los
            <NuxtLink
              to="/terms"
              class="text-primary-600 hover:text-primary-500"
            >
              términos y condiciones
            </NuxtLink>
          </label>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              v-if="loading"
              class="absolute left-0 inset-y-0 flex items-center pl-3"
            >
              <Icon
                name="loading"
                class="h-5 w-5 text-primary-500 animate-spin"
              />
            </span>
            {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
          </button>
        </div>

        <div
          v-if="error"
          class="rounded-md bg-red-50 dark:bg-red-900/20 p-4"
        >
          <div class="text-sm text-red-700 dark:text-red-400">
            {{ error }}
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
  layout: false
})

const { register, loading, error } = useAuth()
const { handleSuccessfulRegistration } = useAuthRedirect()
const { handleError } = useErrorHandler()

const form = reactive({
  username: '',
  email: '',
  password: '',
  password_confirm: '',
  first_name: '',
  last_name: '',
  acceptTerms: false
})

const isFormValid = computed(() => {
  return form.username && 
         form.email && 
         form.password && 
         form.password_confirm && 
         form.password === form.password_confirm &&
         form.acceptTerms
})

const handleRegister = async () => {
  if (form.password !== form.password_confirm) {
    const { handleError } = useErrorHandler()
    handleError('Las contraseñas no coinciden')
    return
  }

  try {
    await register({
      username: form.username,
      email: form.email,
      password: form.password,
      password_confirm: form.password_confirm,
      first_name: form.first_name,
      last_name: form.last_name
    })
    
    handleSuccessfulRegistration('¡Cuenta creada exitosamente! Bienvenido')
    await navigateTo('/')
    
  } catch (err) {
    // Error is handled by the auth store
  }
}

// SEO
useHead({
  title: 'Crear Cuenta - Blog de Noticias',
  meta: [
    { name: 'description', content: 'Crea tu cuenta gratuita para acceder a contenido exclusivo y personalizado.' }
  ]
})
</script>
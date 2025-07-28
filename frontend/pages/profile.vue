<template>
  <div class="container mx-auto px-4 py-8">
    <Breadcrumbs :items="[{ name: 'Perfil' }]" />

    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Mi Perfil</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Profile Info -->
        <div class="lg:col-span-2">
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Información Personal
            </h2>

            <form @submit.prevent="updateProfile">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de usuario
                  </label>
                  <input
                    v-model="profileForm.username"
                    type="text"
                    class="input w-full"
                    readonly
                    disabled
                  />
                  <p class="text-xs text-gray-500 mt-1">El nombre de usuario no se puede cambiar</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input v-model="profileForm.email" type="email" class="input w-full" required />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre
                  </label>
                  <input v-model="profileForm.first_name" type="text" class="input w-full" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Apellido
                  </label>
                  <input v-model="profileForm.last_name" type="text" class="input w-full" />
                </div>
              </div>

              <div class="mt-6 flex justify-end">
                <button type="submit" :disabled="profileLoading" class="btn btn-primary">
                  <Icon v-if="profileLoading" name="loading" class="w-4 h-4 animate-spin mr-2" />
                  {{ profileLoading ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Change Password -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6"
          >
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Cambiar Contraseña
            </h2>

            <form @submit.prevent="changePassword">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña actual
                  </label>
                  <input
                    v-model="passwordForm.current_password"
                    type="password"
                    class="input w-full"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nueva contraseña
                  </label>
                  <input
                    v-model="passwordForm.new_password"
                    type="password"
                    class="input w-full"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    v-model="passwordForm.confirm_password"
                    type="password"
                    class="input w-full"
                    required
                  />
                </div>
              </div>

              <div class="mt-6 flex justify-end">
                <button
                  type="submit"
                  :disabled="passwordLoading || !isPasswordFormValid"
                  class="btn btn-primary"
                >
                  <Icon v-if="passwordLoading" name="loading" class="w-4 h-4 animate-spin mr-2" />
                  {{ passwordLoading ? 'Cambiando...' : 'Cambiar Contraseña' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Profile Stats -->
        <div class="lg:col-span-1">
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Información de la cuenta
            </h3>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  Activo
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ user?.is_staff ? 'Administrador' : 'Usuario' }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Miembro desde:</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatDate(user?.date_joined) }}
                </span>
              </div>
            </div>

            <!-- Admin Link -->
            <div
              v-if="user?.is_staff"
              class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <NuxtLink to="/admin" class="btn btn-secondary w-full">
                <Icon name="settings" class="w-4 h-4 mr-2" />
                Panel de Administración
              </NuxtLink>
            </div>

            <!-- Logout -->
            <div class="mt-4">
              <button
                class="btn btn-ghost w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                @click="handleLogout"
              >
                <Icon name="logout" class="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const {
  user,
  updateProfile: updateUserProfile,
  changePassword: changeUserPassword,
  logout,
} = useAuth()
const { handleSuccess, handleError } = useErrorHandler()

// Form states
const profileLoading = ref(false)
const passwordLoading = ref(false)

const profileForm = reactive({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

// Computed
const isPasswordFormValid = computed(() => {
  return (
    passwordForm.current_password &&
    passwordForm.new_password &&
    passwordForm.confirm_password &&
    passwordForm.new_password === passwordForm.confirm_password &&
    passwordForm.new_password.length >= 8
  )
})

// Methods
const updateProfile = async () => {
  try {
    profileLoading.value = true

    await updateUserProfile({
      email: profileForm.email,
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
    })

    handleSuccess('Perfil actualizado correctamente')
  } catch (error) {
    handleError(error, 'updateProfile')
  } finally {
    profileLoading.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    handleError('Las contraseñas no coinciden')
    return
  }

  try {
    passwordLoading.value = true

    await changeUserPassword(passwordForm.current_password, passwordForm.new_password)

    // Clear form
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''

    handleSuccess('Contraseña cambiada correctamente')
  } catch (error) {
    handleError(error, 'changePassword')
  } finally {
    passwordLoading.value = false
  }
}

const handleLogout = async () => {
  try {
    await logout()
    handleSuccess('Sesión cerrada correctamente')
    await navigateTo('/')
  } catch (error) {
    handleError(error, 'logout')
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Initialize form with user data
watch(
  user,
  newUser => {
    if (newUser) {
      profileForm.username = newUser.username
      profileForm.email = newUser.email
      profileForm.first_name = newUser.first_name || ''
      profileForm.last_name = newUser.last_name || ''
    }
  },
  { immediate: true }
)

// SEO
useHead({
  title: 'Mi Perfil - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content:
        'Gestiona tu perfil de usuario, actualiza tu información personal y cambia tu contraseña.',
    },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>
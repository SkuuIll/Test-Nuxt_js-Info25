<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            Gestionar Usuarios
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Administra las cuentas de usuario del blog
          </p>
        </div>

        <!-- Users Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rol
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Registro
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                          {{ user.username.charAt(0).toUpperCase() }}
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ user.username }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {{ user.email }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        user.is_superuser
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : user.is_staff
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      ]"
                    >
                      {{ user.is_superuser ? 'Superusuario' : user.is_staff ? 'Staff' : 'Usuario' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        user.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      ]"
                    >
                      {{ user.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(user.date_joined) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center space-x-2">
                      <button
                        @click="editUser(user)"
                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Editar usuario"
                      >
                        <Icon name="pencil" class="w-4 h-4" />
                      </button>
                      <button
                        v-if="user.id !== currentUser?.id"
                        @click="toggleUserStatus(user)"
                        :class="[
                          user.is_active
                            ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                            : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                        ]"
                        :title="user.is_active ? 'Desactivar usuario' : 'Activar usuario'"
                      >
                        <Icon :name="user.is_active ? 'x-circle' : 'check-circle'" class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Composables
const { user: currentUser } = useAuth()
const { $toast } = useNuxtApp()

// Check if user is staff
if (!currentUser.value?.is_staff) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Acceso denegado'
  })
}

// Mock data
const users = ref([
  {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    is_superuser: true,
    is_staff: true,
    is_active: true,
    date_joined: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    username: 'editor',
    email: 'editor@test.com',
    is_superuser: false,
    is_staff: true,
    is_active: true,
    date_joined: '2025-01-15T10:30:00Z'
  },
  {
    id: 3,
    username: 'usuario1',
    email: 'usuario1@test.com',
    is_superuser: false,
    is_staff: false,
    is_active: true,
    date_joined: '2025-01-20T14:15:00Z'
  },
  {
    id: 4,
    username: 'usuario2',
    email: 'usuario2@test.com',
    is_superuser: false,
    is_staff: false,
    is_active: false,
    date_joined: '2025-01-25T09:45:00Z'
  }
])

// Methods
const editUser = (user) => {
  $toast.info(`Editar usuario: ${user.username}`)
  // Implement edit functionality
}

const toggleUserStatus = async (user) => {
  const action = user.is_active ? 'desactivar' : 'activar'
  
  if (!confirm(`¿Estás seguro de que quieres ${action} a ${user.username}?`)) {
    return
  }
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    user.is_active = !user.is_active
    
    $toast.success(`Usuario ${user.is_active ? 'activado' : 'desactivado'} exitosamente`)
  } catch (error) {
    console.error('Error toggling user status:', error)
    $toast.error('Error al cambiar el estado del usuario')
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// SEO
useHead({
  title: 'Gestionar Usuarios - Admin',
  meta: [
    { name: 'description', content: 'Administra las cuentas de usuario del blog' }
  ]
})
</script>
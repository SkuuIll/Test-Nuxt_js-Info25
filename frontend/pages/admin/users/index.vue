<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Gestionar Usuarios
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Administra las cuentas de usuario del blog
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex flex-wrap gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar usuarios..."
          class="input flex-1 min-w-64"
          @input="debouncedSearch"
        />
        
        <select v-model="roleFilter" class="input">
          <option value="">Todos los roles</option>
          <option value="superuser">Superusuarios</option>
          <option value="staff">Staff</option>
          <option value="regular">Usuarios regulares</option>
        </select>
        
        <select v-model="statusFilter" class="input">
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>
    </div>

    <!-- Users List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div v-if="loading" class="p-8 text-center">
        <Icon name="loading" class="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
        <p class="text-gray-600 dark:text-gray-400">Cargando usuarios...</p>
      </div>
      
      <div v-else-if="users.length === 0" class="p-8 text-center">
        <Icon name="users" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No hay usuarios
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          No se encontraron usuarios con los filtros aplicados.
        </p>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usuario
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rol
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Último acceso
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ getInitials(user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) }}
                    </span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      @{{ user.username }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ user.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': user.is_superuser,
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': user.is_staff && !user.is_superuser,
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200': !user.is_staff && !user.is_superuser
                  }"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getUserRole(user) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': user.is_active,
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !user.is_active
                  }"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ user.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(user.last_login) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    v-if="user.id !== currentUser?.id"
                    @click="toggleUserStatus(user)"
                    :class="{
                      'text-green-600 hover:text-green-900': !user.is_active,
                      'text-red-600 hover:text-red-900': user.is_active
                    }"
                    :title="user.is_active ? 'Desactivar' : 'Activar'"
                  >
                    <Icon :name="user.is_active ? 'user-minus' : 'user-plus'" class="w-4 h-4" />
                  </button>
                  
                  <button
                    v-if="user.id !== currentUser?.id && !user.is_superuser"
                    @click="toggleStaffStatus(user)"
                    :class="{
                      'text-blue-600 hover:text-blue-900': !user.is_staff,
                      'text-gray-600 hover:text-gray-900': user.is_staff
                    }"
                    :title="user.is_staff ? 'Quitar staff' : 'Hacer staff'"
                  >
                    <Icon name="shield-check" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <nav class="flex space-x-2">
        <button
          v-for="page in totalPages"
          :key="page"
          @click="currentPage = page"
          :class="{
            'bg-primary-600 text-white': page === currentPage,
            'bg-white text-gray-700 hover:bg-gray-50': page !== currentPage
          }"
          class="px-3 py-2 text-sm font-medium rounded-md border border-gray-300"
        >
          {{ page }}
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'admin-check',
  requireSuperuser: true
})

// Composables
const { handleSuccess, handleError } = useErrorHandler()
const { user: currentUser } = useAuth()

// State
const loading = ref(false)
const users = ref([])
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

// Methods
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const getUserRole = (user: any) => {
  if (user.is_superuser) return 'Superusuario'
  if (user.is_staff) return 'Staff'
  return 'Usuario'
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Nunca'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchUsers = async () => {
  try {
    loading.value = true
    
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'fetchUsers')
      return
    }

    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (roleFilter.value) params.append('role', roleFilter.value)
    if (statusFilter.value) params.append('status', statusFilter.value)
    params.append('page', currentPage.value.toString())

    const response = await $fetch(`/api/v1/dashboard/api/users/?${params}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    users.value = response.results || response
    totalPages.value = Math.ceil((response.count || users.value.length) / 10)

  } catch (error) {
    console.error('Error fetching users:', error)
    handleError('Error al cargar los usuarios', 'fetchUsers')
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user: any) => {
  try {
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'toggleUserStatus')
      return
    }

    await $fetch(`/api/v1/dashboard/api/users/${user.id}/`, {
      method: 'PATCH',
      body: { is_active: !user.is_active },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    user.is_active = !user.is_active
    handleSuccess(`Usuario ${user.is_active ? 'activado' : 'desactivado'} exitosamente`)

  } catch (error) {
    handleError('Error al cambiar el estado del usuario', 'toggleUserStatus')
  }
}

const toggleStaffStatus = async (user: any) => {
  try {
    const { token } = useAuth()
    if (!token.value) {
      handleError('No se encontró token de autenticación', 'toggleStaffStatus')
      return
    }

    await $fetch(`/api/v1/dashboard/api/users/${user.id}/`, {
      method: 'PATCH',
      body: { is_staff: !user.is_staff },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    user.is_staff = !user.is_staff
    handleSuccess(`Permisos de staff ${user.is_staff ? 'otorgados' : 'removidos'} exitosamente`)

  } catch (error) {
    handleError('Error al cambiar los permisos del usuario', 'toggleStaffStatus')
  }
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
  fetchUsers()
}, 500)

// Watchers
watch([roleFilter, statusFilter, currentPage], () => {
  fetchUsers()
})

// Initialize
onMounted(() => {
  fetchUsers()
})

// SEO
useHead({
  title: 'Gestionar Usuarios - Administración',
  meta: [
    { name: 'description', content: 'Administrar usuarios del blog' }
  ]
})
</script>
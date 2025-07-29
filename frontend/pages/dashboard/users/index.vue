<template>
  <div>
    <!-- Page header -->
    <div class="sm:flex sm:items-center sm:justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Gestión de Usuarios
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          Administra todos los usuarios registrados en tu blog
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <button
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="showCreateModal = true"
        >
          <PlusIcon class="h-4 w-4 mr-2" />
          Crear Usuario
        </button>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <DashboardStatCard
        title="Total Usuarios"
        :value="totalCount"
        icon="UsersIcon"
        color="blue"
      />
      <DashboardStatCard
        title="Usuarios Activos"
        :value="activeUsersCount"
        icon="UserIcon"
        color="green"
      />
      <DashboardStatCard
        title="Administradores"
        :value="staffUsersCount"
        icon="ShieldCheckIcon"
        color="purple"
      />
      <DashboardStatCard
        title="Nuevos (30 días)"
        :value="newUsersCount"
        icon="UserPlusIcon"
        color="yellow"
      />
    </div>

    <!-- Filters and search -->
    <div class="bg-white shadow rounded-lg mb-6">
      <div class="p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Search -->
          <div>
            <label for="search" class="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              id="search"
              v-model="filters.search"
              type="text"
              placeholder="Nombre, email o usuario..."
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @input="debouncedSearch"
            />
          </div>

          <!-- Status filter -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              id="status"
              v-model="filters.is_active"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="fetchUsers"
            >
              <option value="">Todos</option>
              <option :value="true">Activos</option>
              <option :value="false">Inactivos</option>
            </select>
          </div>

          <!-- Role filter -->
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              id="role"
              v-model="filters.is_staff"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="fetchUsers"
            >
              <option value="">Todos los roles</option>
              <option :value="true">Administradores</option>
              <option :value="false">Usuarios normales</option>
            </select>
          </div>

          <!-- Ordering -->
          <div>
            <label for="ordering" class="block text-sm font-medium text-gray-700 mb-1">
              Ordenar por
            </label>
            <select
              id="ordering"
              v-model="filters.ordering"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              @change="fetchUsers"
            >
              <option value="-date_joined">Más recientes</option>
              <option value="date_joined">Más antiguos</option>
              <option value="username">Nombre A-Z</option>
              <option value="-username">Nombre Z-A</option>
              <option value="-last_login">Última conexión</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Users table -->
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-2 text-sm text-gray-500">Cargando usuarios...</p>
      </div>

      <div v-else-if="error" class="p-8 text-center">
        <ExclamationTriangleIcon class="h-12 w-12 text-red-400 mx-auto" />
        <p class="mt-2 text-sm text-red-600">{{ error }}</p>
        <button
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          @click="loadUsers"
        >
          Reintentar
        </button>
      </div>

      <div v-else-if="users.length === 0" class="p-8 text-center">
        <UsersIcon class="h-12 w-12 text-gray-400 mx-auto" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
        <p class="mt-1 text-sm text-gray-500">
          No se encontraron usuarios con los filtros aplicados.
        </p>
      </div>

      <ul v-else role="list" class="divide-y divide-gray-200">
        <li
          v-for="user in users"
          :key="user.id"
          class="hover:bg-gray-50"
        >
          <div class="px-4 py-4 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Avatar -->
              <div class="flex-shrink-0">
                <div class="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span class="text-sm font-medium text-gray-700">
                    {{ getUserInitials(user) }}
                  </span>
                </div>
              </div>

              <!-- User info -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-sm font-medium text-gray-900">
                    {{ getUserDisplayName(user) }}
                  </h3>
                  
                  <!-- Status badges -->
                  <span
                    v-if="user.is_superuser"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    <ShieldCheckIcon class="h-3 w-3 mr-1" />
                    Superusuario
                  </span>
                  <span
                    v-else-if="user.is_staff"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    <CogIcon class="h-3 w-3 mr-1" />
                    Admin
                  </span>
                  <span
                    v-if="!user.is_active"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    Inactivo
                  </span>
                </div>

                <div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span class="flex items-center">
                    <EnvelopeIcon class="h-4 w-4 mr-1" />
                    {{ user.email }}
                  </span>
                  <span class="flex items-center">
                    <CalendarIcon class="h-4 w-4 mr-1" />
                    Registrado {{ formatDate(user.date_joined) }}
                  </span>
                  <span v-if="user.last_login" class="flex items-center">
                    <ClockIcon class="h-4 w-4 mr-1" />
                    Último acceso {{ formatDate(user.last_login) }}
                  </span>
                  <span v-else class="text-gray-400">
                    Nunca se conectó
                  </span>
                </div>

                <!-- Stats -->
                <div v-if="user.posts_count !== undefined || user.comments_count !== undefined" class="mt-1 flex items-center space-x-4 text-xs text-gray-400">
                  <span v-if="user.posts_count !== undefined">
                    {{ user.posts_count }} posts
                  </span>
                  <span v-if="user.comments_count !== undefined">
                    {{ user.comments_count }} comentarios
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-2">
              <NuxtLink
                :to="`/dashboard/users/${user.id}`"
                class="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Ver perfil
              </NuxtLink>
              <button
                class="text-gray-600 hover:text-gray-500 text-sm font-medium"
                @click="editUser(user)"
              >
                Editar
              </button>
              <button
                v-if="user.is_active"
                class="text-yellow-600 hover:text-yellow-500 text-sm font-medium"
                @click="toggleUserStatus(user)"
              >
                Desactivar
              </button>
              <button
                v-else
                class="text-green-600 hover:text-green-500 text-sm font-medium"
                @click="toggleUserStatus(user)"
              >
                Activar
              </button>
            </div>
          </div>
        </li>
      </ul>

      <!-- Pagination -->
      <div v-if="totalCount > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            :disabled="currentPage <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            @click="changePage(currentPage - 1)"
          >
            Anterior
          </button>
          <button
            :disabled="currentPage >= totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            @click="changePage(currentPage + 1)"
          >
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando
              <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
              a
              <span class="font-medium">{{ Math.min(currentPage * pageSize, totalCount) }}</span>
              de
              <span class="font-medium">{{ totalCount }}</span>
              resultados
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                :disabled="currentPage <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                @click="changePage(currentPage - 1)"
              >
                <ChevronLeftIcon class="h-5 w-5" />
              </button>
              
              <button
                v-for="page in visiblePages"
                :key="page"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
              
              <button
                :disabled="currentPage >= totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                @click="changePage(currentPage + 1)"
              >
                <ChevronRightIcon class="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PlusIcon,
  UsersIcon,
  UserIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CogIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { debounce } from 'lodash-es'

// Layout
definePageMeta({
  layout: 'dashboard'
})

// Composables
const { users, loading, error, totalCount, fetchUsers } = useDashboardUsers()
const { success, error: showError } = useToast()

// State
const showCreateModal = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// Filters
const filters = reactive({
  search: '',
  is_active: '',
  is_staff: '',
  ordering: '-date_joined'
})

// Computed
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const activeUsersCount = computed(() => {
  return users.value.filter(user => user.is_active).length
})

const staffUsersCount = computed(() => {
  return users.value.filter(user => user.is_staff || user.is_superuser).length
})

const newUsersCount = computed(() => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return users.value.filter(user => {
    const joinDate = new Date(user.date_joined)
    return joinDate >= thirtyDaysAgo
  }).length
})

// Methods
const loadUsers = async () => {
  const params = {
    page: currentPage.value,
    page_size: pageSize.value,
    ...filters
  }
  
  await fetchUsers(params)
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadUsers()
}, 500)

const changePage = (page: number) => {
  currentPage.value = page
  loadUsers()
}

const getUserInitials = (user: any) => {
  const firstName = user.first_name || user.username
  const lastName = user.last_name || ''
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
}

const getUserDisplayName = (user: any) => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  return user.username
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Sin fecha'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const editUser = (user: any) => {
  // TODO: Implement edit user modal
  console.log('Edit user:', user)
}

const toggleUserStatus = (user: any) => {
  // TODO: Implement toggle user status
  console.log('Toggle user status:', user)
}

// Load data on mount
onMounted(() => {
  loadUsers()
})

// Watch filters
watch(filters, () => {
  currentPage.value = 1
  loadUsers()
}, { deep: true })

// SEO
useHead({
  title: 'Usuarios - Dashboard'
})
</script>
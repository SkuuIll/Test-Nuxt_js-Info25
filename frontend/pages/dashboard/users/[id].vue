<template>
  <div>
    <!-- Loading state -->
    <div v-if="loadingUser" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <ExclamationTriangleIcon class="h-12 w-12 text-red-400 mx-auto" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Error al cargar el usuario</h3>
        <p class="mt-1 text-sm text-gray-500">{{ loadError }}</p>
        <div class="mt-6">
          <NuxtLink
            to="/dashboard/users"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Volver a usuarios
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- User profile -->
    <div v-else-if="user">
      <!-- Page header -->
      <div class="mb-8">
        <div class="flex items-center space-x-4">
          <NuxtLink
            to="/dashboard/users"
            class="text-gray-400 hover:text-gray-500"
          >
            <ArrowLeftIcon class="h-6 w-6" />
          </NuxtLink>
          <div class="flex-1">
            <div class="flex items-center space-x-4">
              <!-- Avatar -->
              <div class="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
                <span class="text-xl font-medium text-gray-700">
                  {{ getUserInitials(user) }}
                </span>
              </div>
              
              <div>
                <h1 class="text-2xl font-bold text-gray-900">
                  {{ getUserDisplayName(user) }}
                </h1>
                <div class="flex items-center space-x-2 mt-1">
                  <span class="text-sm text-gray-600">@{{ user.username }}</span>
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
                    Administrador
                  </span>
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ user.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <button
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              @click="showEditModal = true"
            >
              <PencilIcon class="h-4 w-4 mr-2" />
              Editar
            </button>
            <button
              :class="[
                'inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium',
                user.is_active
                  ? 'text-white bg-red-600 hover:bg-red-700'
                  : 'text-white bg-green-600 hover:bg-green-700'
              ]"
              @click="toggleUserStatus"
            >
              {{ user.is_active ? 'Desactivar' : 'Activar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardStatCard
          title="Posts Publicados"
          :value="user.posts_count || 0"
          icon="DocumentTextIcon"
          color="blue"
        />
        <DashboardStatCard
          title="Comentarios"
          :value="user.comments_count || 0"
          icon="ChatBubbleLeftIcon"
          color="green"
        />
        <DashboardStatCard
          title="Días Registrado"
          :value="daysSinceJoined"
          icon="CalendarIcon"
          color="purple"
        />
        <DashboardStatCard
          title="Último Acceso"
          :value="lastLoginText"
          icon="ClockIcon"
          color="yellow"
        />
      </div>

      <!-- User details -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Personal Information -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Información Personal
            </h3>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Nombre completo</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ getUserDisplayName(user) || 'No especificado' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Nombre de usuario</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user.username }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="mt-1 text-sm text-gray-900">{{ user.email }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Estado</dt>
                <dd class="mt-1">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    ]"
                  >
                    {{ user.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Fecha de registro</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ formatDate(user.date_joined) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Último acceso</dt>
                <dd class="mt-1 text-sm text-gray-900">
                  {{ user.last_login ? formatDate(user.last_login) : 'Nunca' }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Permissions -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
              Permisos y Roles
            </h3>
            <div class="space-y-4">
              <!-- System roles -->
              <div>
                <h4 class="text-sm font-medium text-gray-700 mb-2">Roles del sistema</h4>
                <div class="space-y-2">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      :checked="user.is_superuser"
                      disabled
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label class="ml-2 text-sm text-gray-700">
                      Superusuario (acceso completo)
                    </label>
                  </div>
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      :checked="user.is_staff"
                      disabled
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label class="ml-2 text-sm text-gray-700">
                      Staff (acceso al admin)
                    </label>
                  </div>
                </div>
              </div>

              <!-- Dashboard permissions -->
              <div v-if="user.permissions">
                <h4 class="text-sm font-medium text-gray-700 mb-2">Permisos del dashboard</h4>
                <div class="space-y-2">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      :checked="user.permissions.can_view_stats"
                      disabled
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label class="ml-2 text-sm text-gray-700">
                      Ver estadísticas
                    </label>
                  </div>
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      :checked="user.permissions.can_manage_posts"
                      disabled
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label class="ml-2 text-sm text-gray-700">
                      Gestionar posts
                    </label>
                  </div>
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      :checked="user.permissions.can_manage_users"
                      disabled
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label class="ml-2 text-sm text-gray-700">
                      Gestionar usuarios
                    </label>
                  </div>
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      :checked="user.permissions.can_manage_comments"
                      disabled
                      class="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label class="ml-2 text-sm text-gray-700">
                      Gestionar comentarios
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="mt-8 bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div class="text-center py-8">
            <ClockIcon class="h-12 w-12 text-gray-400 mx-auto" />
            <p class="mt-2 text-sm text-gray-500">
              La actividad reciente aparecerá aquí cuando esté implementada
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CogIcon,
  PencilIcon,
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

// Layout
definePageMeta({
  layout: 'dashboard'
})

// Composables
const route = useRoute()
const { success, error: showError } = useToast()

// State
const user = ref(null)
const loadingUser = ref(true)
const loadError = ref<string | null>(null)
const showEditModal = ref(false)

// Computed
const daysSinceJoined = computed(() => {
  if (!user.value?.date_joined) return 0
  const joinDate = new Date(user.value.date_joined)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - joinDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const lastLoginText = computed(() => {
  if (!user.value?.last_login) return 'Nunca'
  const lastLogin = new Date(user.value.last_login)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastLogin.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `${diffDays} días`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semanas`
  return `${Math.ceil(diffDays / 30)} meses`
})

// Methods
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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleUserStatus = () => {
  // TODO: Implement toggle user status
  console.log('Toggle user status')
}

// Load user data on mount
onMounted(async () => {
  try {
    const userId = Number(route.params.id)
    
    // For now, simulate loading user data
    // In a real implementation, this would fetch from the API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock user data
    user.value = {
      id: userId,
      username: 'usuario_ejemplo',
      email: 'usuario@ejemplo.com',
      first_name: 'Usuario',
      last_name: 'Ejemplo',
      is_active: true,
      is_staff: false,
      is_superuser: false,
      date_joined: '2024-01-15T10:30:00Z',
      last_login: '2024-07-25T14:20:00Z',
      posts_count: 5,
      comments_count: 12,
      permissions: {
        can_view_stats: true,
        can_manage_posts: false,
        can_manage_users: false,
        can_manage_comments: false
      }
    }
    
  } catch (err: any) {
    loadError.value = err.message || 'No se pudo cargar el usuario'
  } finally {
    loadingUser.value = false
  }
})

// SEO
useHead({
  title: 'Perfil de Usuario - Dashboard'
})
</script>
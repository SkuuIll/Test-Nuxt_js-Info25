<template>
  <div class="flex h-full w-64 flex-col bg-white shadow-lg">
    <!-- Logo -->
    <div class="flex h-16 items-center justify-between px-4 border-b">
      <div class="flex items-center">
        <h1 class="text-xl font-bold text-gray-900">Dashboard</h1>
      </div>
      <button
        @click="$emit('close')"
        class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
      >
        <XMarkIcon class="h-6 w-6" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-4 space-y-2">
      <!-- Dashboard Home -->
      <SidebarItem
        to="/dashboard"
        :icon="HomeIcon"
        label="Inicio"
        :active="$route.path === '/dashboard'"
      />

      <!-- Estadísticas -->
      <SidebarItem
        v-if="canViewStats"
        to="/dashboard/stats"
        :icon="ChartBarIcon"
        label="Estadísticas"
        :active="$route.path.startsWith('/dashboard/stats')"
      />

      <!-- Posts -->
      <SidebarSection
        v-if="canManagePosts"
        title="Contenido"
        :icon="DocumentTextIcon"
        :items="[
          { to: '/dashboard/posts', label: 'Posts', active: $route.path.startsWith('/dashboard/posts') },
          { to: '/dashboard/categories', label: 'Categorías', active: $route.path.startsWith('/dashboard/categories') }
        ]"
      />

      <!-- Usuarios -->
      <SidebarItem
        v-if="canManageUsers"
        to="/dashboard/users"
        :icon="UsersIcon"
        label="Usuarios"
        :active="$route.path.startsWith('/dashboard/users')"
      />

      <!-- Comentarios -->
      <SidebarItem
        v-if="canManageComments"
        to="/dashboard/comments"
        :icon="ChatBubbleLeftRightIcon"
        label="Comentarios"
        :active="$route.path.startsWith('/dashboard/comments')"
        :badge="pendingCommentsCount"
      />

      <!-- Configuración -->
      <SidebarItem
        to="/dashboard/settings"
        :icon="CogIcon"
        label="Configuración"
        :active="$route.path.startsWith('/dashboard/settings')"
      />
    </nav>

    <!-- User info -->
    <div class="border-t p-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span class="text-sm font-medium text-gray-700">
              {{ user?.username?.charAt(0).toUpperCase() }}
            </span>
          </div>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-700">{{ user?.username }}</p>
          <p class="text-xs text-gray-500">{{ user?.email }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  HomeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// Props
defineProps<{
  isOpen: boolean
}>()

// Emits
defineEmits<{
  close: []
}>()

// Composables
const { user, permissions } = useDashboardAuth()
const { pendingCommentsCount } = useDashboardStats()

// Computed permissions
const canViewStats = computed(() => 
  permissions.value?.can_view_stats || user.value?.is_superuser
)

const canManagePosts = computed(() => 
  permissions.value?.can_manage_posts || user.value?.is_superuser
)

const canManageUsers = computed(() => 
  permissions.value?.can_manage_users || user.value?.is_superuser
)

const canManageComments = computed(() => 
  permissions.value?.can_manage_comments || user.value?.is_superuser
)
</script>
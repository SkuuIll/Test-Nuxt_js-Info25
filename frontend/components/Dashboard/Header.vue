<template>
  <header class="bg-white shadow-sm border-b">
    <div class="flex h-16 items-center justify-between px-4">
      <!-- Left side -->
      <div class="flex items-center">
        <!-- Mobile menu button -->
        <button
          @click="$emit('toggleSidebar')"
          class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
        >
          <Bars3Icon class="h-6 w-6" />
        </button>

        <!-- Page title -->
        <h1 class="ml-4 text-xl font-semibold text-gray-900 lg:ml-0">
          {{ pageTitle }}
        </h1>
      </div>

      <!-- Right side -->
      <div class="flex items-center space-x-4">
        <!-- Notifications -->
        <DashboardNotifications />

        <!-- User menu -->
        <DashboardUserMenu />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Bars3Icon } from '@heroicons/vue/24/outline'

// Emits
defineEmits<{
  toggleSidebar: []
}>()

// Computed page title based on route
const route = useRoute()
const pageTitle = computed(() => {
  const routeMap: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/stats': 'Estadísticas',
    '/dashboard/posts': 'Posts',
    '/dashboard/posts/create': 'Crear Post',
    '/dashboard/categories': 'Categorías',
    '/dashboard/users': 'Usuarios',
    '/dashboard/comments': 'Comentarios',
    '/dashboard/settings': 'Configuración'
  }

  // Check for dynamic routes
  if (route.path.includes('/dashboard/posts/') && route.path.includes('/edit')) {
    return 'Editar Post'
  }
  if (route.path.includes('/dashboard/users/') && !route.path.endsWith('/users')) {
    return 'Perfil de Usuario'
  }

  return routeMap[route.path] || 'Dashboard'
})
</script>
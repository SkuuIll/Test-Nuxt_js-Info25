<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <li>
        <NuxtLink
          to="/dashboard"
          class="text-gray-400 hover:text-gray-500"
        >
          <HomeIcon class="h-4 w-4" />
          <span class="sr-only">Dashboard</span>
        </NuxtLink>
      </li>

      <li v-for="(item, index) in breadcrumbs" :key="item.path">
        <div class="flex items-center">
          <ChevronRightIcon class="h-4 w-4 text-gray-300" />
          <NuxtLink
            v-if="index < breadcrumbs.length - 1"
            :to="item.path"
            class="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {{ item.name }}
          </NuxtLink>
          <span
            v-else
            class="ml-2 text-sm font-medium text-gray-900"
          >
            {{ item.name }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { HomeIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

interface BreadcrumbItem {
  name: string
  path: string
}

// Composables
const route = useRoute()

// Computed breadcrumbs based on current route
const breadcrumbs = computed((): BreadcrumbItem[] => {
  const pathSegments = route.path.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Skip 'dashboard' segment as it's the home
  const segments = pathSegments.slice(1)

  let currentPath = '/dashboard'

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`

    // Skip numeric IDs in breadcrumbs
    if (/^\d+$/.test(segment)) {
      continue
    }

    let name = segment

    // Map segment names to display names
    const nameMap: Record<string, string> = {
      'posts': 'Posts',
      'create': 'Crear',
      'edit': 'Editar',
      'categories': 'Categorías',
      'users': 'Usuarios',
      'comments': 'Comentarios',
      'stats': 'Estadísticas',
      'settings': 'Configuración',
      'profile': 'Perfil',
      'notifications': 'Notificaciones'
    }

    name = nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

    breadcrumbs.push({
      name,
      path: currentPath
    })
  }

  return breadcrumbs
})
</script>
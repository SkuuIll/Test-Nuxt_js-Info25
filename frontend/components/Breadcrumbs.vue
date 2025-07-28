<template>
  <nav
    v-if="breadcrumbs.length > 1"
    class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6"
    aria-label="Breadcrumb"
  >
    <ol class="flex items-center space-x-2">
      <li
        v-for="(breadcrumb, index) in breadcrumbs"
        :key="breadcrumb.path"
        class="flex items-center"
      >
        <Icon
          v-if="index > 0"
          name="chevron-right"
          class="w-4 h-4 mx-2 text-gray-400"
        />
        
        <NuxtLink
          v-if="breadcrumb.path && index < breadcrumbs.length - 1"
          :to="breadcrumb.path"
          class="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {{ breadcrumb.name }}
        </NuxtLink>
        
        <span
          v-else
          class="text-gray-900 dark:text-gray-100 font-medium"
        >
          {{ breadcrumb.name }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  name: string
  path?: string
}

interface Props {
  items?: BreadcrumbItem[]
}

const props = defineProps<Props>()
const route = useRoute()

const breadcrumbs = computed(() => {
  if (props.items) {
    return [{ name: 'Inicio', path: '/' }, ...props.items]
  }

  // Auto-generate breadcrumbs from route
  const pathSegments = route.path.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [{ name: 'Inicio', path: '/' }]

  let currentPath = ''
  
  for (const segment of pathSegments) {
    currentPath += `/${segment}`
    
    let name = segment
    
    // Customize names based on route patterns
    switch (segment) {
      case 'posts':
        name = 'Artículos'
        break
      case 'categories':
        name = 'Categorías'
        break
      case 'tags':
        name = 'Etiquetas'
        break
      case 'login':
        name = 'Iniciar Sesión'
        break
      case 'register':
        name = 'Registrarse'
        break
      case 'profile':
        name = 'Perfil'
        break
      case 'admin':
        name = 'Administración'
        break
      default:
        // Capitalize and replace hyphens with spaces
        name = segment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
    }
    
    breadcrumbs.push({
      name,
      path: currentPath === route.path ? undefined : currentPath
    })
  }

  return breadcrumbs
})
</script>
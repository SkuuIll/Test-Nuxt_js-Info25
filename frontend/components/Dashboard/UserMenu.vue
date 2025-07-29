<template>
  <div class="relative">
    <!-- User button -->
    <button
      @click="isOpen = !isOpen"
      class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <!-- Avatar -->
      <div class="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
        <span class="text-sm font-medium text-white">
          {{ userInitials }}
        </span>
      </div>
      
      <!-- User info -->
      <div class="hidden md:block text-left">
        <p class="text-sm font-medium text-gray-900">
          {{ user?.username }}
        </p>
        <p class="text-xs text-gray-500">
          {{ user?.email }}
        </p>
      </div>
      
      <!-- Chevron -->
      <ChevronDownIcon 
        :class="[
          'h-4 w-4 text-gray-400 transition-transform',
          { 'rotate-180': isOpen }
        ]"
      />
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50"
      >
        <div class="py-1">
          <!-- User info section -->
          <div class="px-4 py-3 border-b border-gray-100">
            <p class="text-sm font-medium text-gray-900">
              {{ user?.first_name || user?.username }}
            </p>
            <p class="text-sm text-gray-500">
              {{ user?.email }}
            </p>
            <div class="mt-1 flex items-center space-x-2">
              <span
                v-if="user?.is_superuser"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
              >
                Superusuario
              </span>
              <span
                v-else
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                Administrador
              </span>
            </div>
          </div>

          <!-- Menu items -->
          <div class="py-1">
            <NuxtLink
              to="/dashboard/profile"
              class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="isOpen = false"
            >
              <UserIcon class="mr-3 h-4 w-4" />
              Mi Perfil
            </NuxtLink>
            
            <NuxtLink
              to="/dashboard/settings"
              class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="isOpen = false"
            >
              <CogIcon class="mr-3 h-4 w-4" />
              Configuración
            </NuxtLink>
          </div>

          <!-- Logout section -->
          <div class="py-1 border-t border-gray-100">
            <button
              @click="handleLogout"
              class="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon class="mr-3 h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="isOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ChevronDownIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

// State
const isOpen = ref(false)

// Composables
const { user, logout } = useDashboardAuth()
const { success } = useToast()

// Computed
const userInitials = computed(() => {
  if (!user.value) return '?'
  
  const firstName = user.value.first_name || user.value.username
  const lastName = user.value.last_name || ''
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
})

// Handle logout
const handleLogout = async () => {
  isOpen.value = false
  
  try {
    await logout(false) // Don't show notification here
    success('Sesión cerrada', 'Has cerrado sesión exitosamente')
    await navigateTo('/dashboard/login')
  } catch (error) {
    console.error('Logout error:', error)
    await navigateTo('/dashboard/login')
  }
}

// Close menu when route changes
watch(() => useRoute().path, () => {
  isOpen.value = false
})
</script>
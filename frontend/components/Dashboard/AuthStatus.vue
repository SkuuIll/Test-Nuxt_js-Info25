<template>
  <div class="flex items-center space-x-3">
    <!-- User Avatar -->
    <div class="flex-shrink-0">
      <div class="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
        <span class="text-sm font-medium text-white">
          {{ userInitials }}
        </span>
      </div>
    </div>

    <!-- User Info -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
        {{ user?.username || 'Usuario' }}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
        {{ user?.is_superuser ? 'Superusuario' : 'Administrador' }}
      </p>
    </div>

    <!-- Status Indicator -->
    <div class="flex-shrink-0">
      <div class="h-2 w-2 bg-green-400 rounded-full" title="En línea"></div>
    </div>
  </div>
</template>

<script setup>
const { user } = useDashboardAuth()

const userInitials = computed(() => {
  if (!user.value) return 'U'
  
  const firstName = user.value.first_name || ''
  const lastName = user.value.last_name || ''
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  } else if (firstName) {
    return firstName.charAt(0).toUpperCase()
  } else if (user.value.username) {
    return user.value.username.charAt(0).toUpperCase()
  }
  
  return 'U'
})
</script>
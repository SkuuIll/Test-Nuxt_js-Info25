<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900">
          Cerrando sesión...
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Por favor espera mientras cerramos tu sesión
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Layout
definePageMeta({
  layout: false
})

// Composables
const { logout } = useDashboardAuth()

// Logout on mount
onMounted(async () => {
  try {
    await logout(false) // Don't show notification since we're redirecting
    
    // Redirect to login page
    await navigateTo('/dashboard/login')
  } catch (error) {
    console.error('Logout error:', error)
    // Redirect anyway
    await navigateTo('/dashboard/login')
  }
})

// SEO
useHead({
  title: 'Cerrando sesión - Dashboard'
})
</script>
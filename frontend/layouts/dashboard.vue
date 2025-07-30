<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Loading state -->
    <div v-if="!showContent" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
    
    <!-- Dashboard content -->
    <div v-else>
      <!-- Sidebar -->
      <DashboardSidebar 
        :is-open="sidebarOpen" 
        @close="sidebarOpen = false"
        class="fixed inset-y-0 left-0 z-50 lg:static lg:inset-0"
      />
      
      <!-- Main content -->
      <div class="lg:pl-64">
        <!-- Header -->
        <DashboardHeader 
          @toggle-sidebar="sidebarOpen = !sidebarOpen"
          class="sticky top-0 z-40"
        />
        
        <!-- Breadcrumb -->
        <DashboardBreadcrumb class="px-4 py-2 bg-white border-b" />
        
        <!-- Page content -->
        <main class="p-4">
          <slot />
        </main>
      </div>
      
      <!-- Mobile sidebar overlay -->
      <div 
        v-if="sidebarOpen" 
        class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
        @click="sidebarOpen = false"
      />
    </div>

    <!-- Toast notifications -->
    <DashboardToast />
    
    <!-- Session warning modal -->
    <DashboardSessionWarning />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Estado del sidebar para móviles
const sidebarOpen = ref(false)

// Verificar autenticación al cargar el layout
const { isAuthenticated, initialized } = useDashboardAuth()
const { initializeSession } = useDashboardSession()

// Mostrar loading hasta que se inicialice la autenticación
const showContent = ref(false)

// Cleanup function for session management
let sessionCleanup: (() => void) | null = null

// Redirigir si no está autenticado
onMounted(() => {
  // Esperar a que se inicialice la autenticación
  const checkAuth = () => {
    if (initialized.value) {
      if (!isAuthenticated()) {
        navigateTo('/dashboard/login')
      } else {
        showContent.value = true
        // Initialize session management
        sessionCleanup = initializeSession()
      }
    } else {
      // Reintentar en el siguiente tick
      nextTick(checkAuth)
    }
  }
  
  checkAuth()
})

// Cleanup on unmount
onUnmounted(() => {
  if (sessionCleanup) {
    sessionCleanup()
  }
})
</script>
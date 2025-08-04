<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="flex-1 pt-16">
      <slot />
    </main>
    
    <!-- Footer -->
    <AppFooter />
    
    <!-- Back to Top Button -->
    <BackToTop />
    
    <!-- Toast Container -->
    <ToastContainer />
    

  </div>
</template>

<script setup lang="ts">
// Initialize stores and global state
const blogStore = useBlogStore()
const authStore = useAuthStore()
const uiStore = useUIStore()
const { initializeNotifications } = useNotifications()

// Initialize app data
onMounted(async () => {
  // Only run on client side to avoid hydration issues
  if (!process.client) return
  
  try {
    // Initialize UI state
    uiStore.initializeTheme()
    uiStore.initializeWindowSize()
    uiStore.initializeScroll()
    
    // Initialize authentication
    await authStore.initializeAuth()
    
    // Initialize notifications after authentication (with safety check)
    if (authStore.isAuthenticated.value) {
      try {
        await initializeNotifications()
      } catch (notificationError) {
        console.warn('⚠️ Notification initialization failed:', notificationError)
        // Continue without notifications
      }
    }
    
    // Fetch initial data
    try {
      await Promise.all([
        blogStore.fetchCategories(),
        blogStore.fetchFeaturedPosts()
      ])
    } catch (error) {
      console.error('❌ Error cargando datos iniciales:', error)
      // Continue anyway - components will handle empty states
    }
  } catch (error) {
    console.error('❌ Error in layout initialization:', error)
  }
})
</script>
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
    <div id="toast-container" />
    
    <!-- Debug Panel (only in development) -->
    <DebugPanel />
  </div>
</template>

<script setup lang="ts">
// Initialize stores and global state
const blogStore = useBlogStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Initialize app data
onMounted(async () => {
  // Initialize UI state
  uiStore.initializeTheme()
  uiStore.initializeWindowSize()
  uiStore.initializeScroll()
  
  // Initialize authentication
  await authStore.initializeAuth()
  
  // Fetch initial data
  await Promise.all([
    blogStore.fetchCategories(),
    blogStore.fetchFeaturedPosts()
  ])
})
</script>
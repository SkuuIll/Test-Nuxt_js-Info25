<template>
  <div
    id="app"
    class="min-h-screen flex flex-col"
  >
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Global app configuration
useHead({
  htmlAttrs: {
    lang: 'es'
  },
  link: [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: ''
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
    }
  ]
})

// Initialize theme and other UI features after hydration
onMounted(() => {
  // Only initialize on client side to avoid hydration mismatches
  if (process.client) {
    const { initializeTheme } = useTheme()
    const uiStore = useUIStore()
    
    // Initialize theme
    initializeTheme()
    
    // Initialize UI features
    uiStore.initializeWindowSize()
    uiStore.initializeScroll()
  }
})
</script>

<style>
/* Global styles are handled in assets/css/main.css */
</style>
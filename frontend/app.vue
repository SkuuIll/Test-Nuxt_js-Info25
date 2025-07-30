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
  const { initializeTheme } = useTheme()
  const uiStore = useUIStore()
  
  // El tema ya se inicializó en el plugin, pero sincronizamos el store
  initializeTheme()
  
  // Inicializar otras funcionalidades de UI
  uiStore.initializeWindowSize()
  uiStore.initializeScroll()
})
</script>

<style>
/* Global styles are handled in assets/css/main.css */
</style>
<template>
  <ClientOnly>
    <div 
      v-if="isDev && showDebug" 
      class="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-sm"
    >
    <div class="flex justify-between items-center mb-2">
      <h3 class="text-sm font-bold">🐛 Debug Panel</h3>
      <button 
        @click="showDebug = false"
        class="text-gray-400 hover:text-white"
      >
        ✕
      </button>
    </div>
    
    <div class="space-y-2 text-xs">
      <!-- Route Info -->
      <div>
        <strong>Route:</strong> {{ $route.fullPath }}
      </div>
      
      <!-- Theme Info -->
      <div>
        <strong>Theme:</strong> {{ currentTheme }} ({{ isDark ? 'Dark' : 'Light' }})
      </div>
      
      <!-- Window Size -->
      <div>
        <strong>Screen:</strong> {{ windowWidth }}x{{ windowHeight }}
        <span class="ml-1">
          {{ isMobile ? '📱' : isTablet ? '📟' : '🖥️' }}
        </span>
      </div>
      
      <!-- Performance -->
      <div>
        <strong>Load Time:</strong> {{ loadTime }}ms
      </div>
      
      <!-- Errors Count -->
      <div v-if="errorCount > 0" class="text-red-400">
        <strong>Errors:</strong> {{ errorCount }}
      </div>
      
      <!-- API Calls -->
      <div v-if="apiCalls > 0">
        <strong>API Calls:</strong> {{ apiCalls }}
      </div>
    </div>
    
    <!-- Actions -->
    <div class="mt-3 flex gap-2">
      <button 
        @click="clearLogs"
        class="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
      >
        Clear Logs
      </button>
      <button 
        @click="exportLogs"
        class="px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs"
      >
        Export
      </button>
    </div>
  </div>
  
    <!-- Toggle Button -->
    <button
      v-if="isDev && !showDebug"
      @click="showDebug = true"
      class="fixed bottom-4 right-4 z-50 bg-black/70 text-white p-2 rounded-full shadow-lg hover:bg-black/90 transition-colors"
      title="Show Debug Panel"
    >
      🐛
    </button>
  </ClientOnly>
</template>

<script setup lang="ts">
const isDev = process.dev
const showDebug = ref(false)
const errorCount = ref(0)
const apiCalls = ref(0)
const loadTime = ref(0)

// UI Store
const { currentTheme, isDark, windowWidth, windowHeight, isMobile, isTablet } = useUIStore()

// Calculate load time
onMounted(() => {
  if (performance.timing) {
    loadTime.value = performance.timing.loadEventEnd - performance.timing.navigationStart
  }
})

// Listen for errors and API calls
if (process.client && isDev) {
  // Count errors
  window.addEventListener('error', () => {
    errorCount.value++
  })
  
  window.addEventListener('unhandledrejection', () => {
    errorCount.value++
  })
  
  // Count API calls (intercept fetch)
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    apiCalls.value++
    return originalFetch(...args)
  }
}

const clearLogs = () => {
  console.clear()
  errorCount.value = 0
  apiCalls.value = 0
  
  try {
    const { $logger } = useNuxtApp()
    $logger.info('Logs cleared')
  } catch (e) {
    console.log('Logs cleared')
  }
}

const exportLogs = () => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    route: useRoute().fullPath,
    theme: currentTheme,
    screen: `${windowWidth}x${windowHeight}`,
    device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    loadTime: loadTime.value,
    errorCount: errorCount.value,
    apiCalls: apiCalls.value,
    userAgent: navigator.userAgent
  }
  
  const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  try {
    const { $logger } = useNuxtApp()
    $logger.info('Debug info exported')
  } catch (e) {
    console.log('Debug info exported')
  }
}

// Keyboard shortcut to toggle debug panel
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + Shift + D
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault()
      showDebug.value = !showDebug.value
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>
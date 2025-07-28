<template>
  <div class="fixed top-0 left-0 right-0 z-50">
    <!-- Progress Bar -->
    <div class="h-1 bg-gray-200 dark:bg-gray-700">
      <div
        class="h-full bg-primary-600 transition-all duration-150 ease-out"
        :style="{ width: `${progress}%` }"
      />
    </div>
    
    <!-- Reading Stats (optional overlay) -->
    <div
      v-if="showStats"
      class="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-sm"
    >
      <div class="flex items-center space-x-4">
        <div class="flex items-center text-gray-600 dark:text-gray-400">
          <Icon
            name="clock"
            class="w-4 h-4 mr-1"
          />
          <span>{{ readingTime }} min</span>
        </div>
        <div class="flex items-center text-gray-600 dark:text-gray-400">
          <Icon
            name="eye"
            class="w-4 h-4 mr-1"
          />
          <span>{{ Math.round(progress) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  readingTime?: number
  showStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readingTime: 5,
  showStats: false
})

const progress = ref(0)

const updateProgress = () => {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const scrollPercent = (scrollTop / docHeight) * 100
  
  progress.value = Math.min(Math.max(scrollPercent, 0), 100)
}

onMounted(() => {
  window.addEventListener('scroll', updateProgress, { passive: true })
  updateProgress() // Initial calculation
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateProgress)
})
</script>
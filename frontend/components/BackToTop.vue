<template>
  <Transition name="back-to-top">
    <button
      v-if="showButton"
      class="fixed bottom-8 right-8 z-40 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      title="Volver arriba"
      @click="scrollToTop"
    >
      <Icon
        name="arrow-up"
        class="w-5 h-5 transform group-hover:-translate-y-1 transition-transform duration-200"
      />
    </button>
  </Transition>
</template>

<script setup lang="ts">
const showButton = ref(false)

// Show/hide button based on scroll position
const handleScroll = () => {
  showButton.value = window.scrollY > 300
}

// Smooth scroll to top
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// Add scroll listener
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

// Remove scroll listener
onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition: all 0.3s ease;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}
</style>
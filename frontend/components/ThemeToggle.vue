<template>
  <button
    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
    :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    @click="toggleTheme"
  >
    <Transition
      name="theme-icon"
      mode="out-in"
    >
      <Icon 
        v-if="isDark" 
        key="sun" 
        name="sun" 
        class="w-5 h-5 text-yellow-500"
      />
      <Icon 
        v-else 
        key="moon" 
        name="moon" 
        class="w-5 h-5 text-gray-600 dark:text-gray-400"
      />
    </Transition>
  </button>
</template>

<script setup lang="ts">
const { isDark, toggleTheme } = useTheme()
</script>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.2s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.8);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.8);
}
</style>
<template>
  <NuxtLink 
    :to="to" 
    :class="linkClasses"
    class="dropdown-item"
  >
    <Icon :name="icon" class="w-4 h-4" />
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  to: string
  icon: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const linkClasses = computed(() => {
  const baseClasses = 'dropdown-item'
  
  switch (props.variant) {
    case 'success':
      return `${baseClasses} text-green-700 dark:text-green-300`
    case 'warning':
      return `${baseClasses} text-yellow-700 dark:text-yellow-300`
    case 'danger':
      return `${baseClasses} text-red-700 dark:text-red-300`
    default:
      return baseClasses
  }
})
</script>
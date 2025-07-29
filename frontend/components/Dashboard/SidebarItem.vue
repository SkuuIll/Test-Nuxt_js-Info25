<template>
  <NuxtLink
    :to="to"
    :class="[
      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
      active
        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    ]"
  >
    <component :is="icon" class="mr-3 h-5 w-5 flex-shrink-0" />
    <span class="flex-1">{{ label }}</span>
    <span
      v-if="badge && badge > 0"
      class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
    >
      {{ badge }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  to: string
  icon: Component
  label: string
  active: boolean
  badge?: number
}>()
</script>
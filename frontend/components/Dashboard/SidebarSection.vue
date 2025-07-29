<template>
  <div>
    <!-- Section header -->
    <button
      @click="isOpen = !isOpen"
      :class="[
        'flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
        'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      ]"
    >
      <component :is="icon" class="mr-3 h-5 w-5 flex-shrink-0" />
      <span class="flex-1 text-left">{{ title }}</span>
      <ChevronDownIcon 
        :class="[
          'h-4 w-4 transition-transform',
          isOpen ? 'rotate-180' : ''
        ]"
      />
    </button>

    <!-- Section items -->
    <div v-show="isOpen" class="ml-8 mt-1 space-y-1">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :class="[
          'block px-3 py-2 text-sm rounded-md transition-colors',
          item.active
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        ]"
      >
        {{ item.label }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import type { Component } from 'vue'

interface SidebarSectionItem {
  to: string
  label: string
  active: boolean
}

defineProps<{
  title: string
  icon: Component
  items: SidebarSectionItem[]
}>()

const isOpen = ref(true)
</script>
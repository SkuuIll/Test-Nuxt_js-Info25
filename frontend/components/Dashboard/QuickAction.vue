<template>
  <NuxtLink
    :to="to"
    :class="[
      'relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-all duration-200',
      {
        'hover:bg-blue-50': color === 'blue',
        'hover:bg-green-50': color === 'green',
        'hover:bg-purple-50': color === 'purple',
        'hover:bg-yellow-50': color === 'yellow',
        'hover:bg-red-50': color === 'red'
      }
    ]"
  >
    <div>
      <span
        :class="[
          'rounded-lg inline-flex p-3 ring-4 ring-white',
          {
            'bg-blue-500': color === 'blue',
            'bg-green-500': color === 'green',
            'bg-purple-500': color === 'purple',
            'bg-yellow-500': color === 'yellow',
            'bg-red-500': color === 'red'
          }
        ]"
      >
        <component
          :is="iconComponent"
          class="h-6 w-6 text-white"
          aria-hidden="true"
        />
      </span>
    </div>
    <div class="mt-8">
      <h3 class="text-lg font-medium">
        <span class="absolute inset-0" aria-hidden="true" />
        {{ title }}
      </h3>
      <p class="mt-2 text-sm text-gray-500">
        {{ description }}
      </p>
    </div>
    <span
      class="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
      aria-hidden="true"
    >
      <ArrowRightIcon class="h-6 w-6" />
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'

interface Props {
  title: string
  description: string
  icon: string
  to: string
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue'
})

// Icon mapping
const iconMap = {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon
}

// Computed
const iconComponent = computed(() => {
  return iconMap[props.icon as keyof typeof iconMap] || DocumentTextIcon
})
</script>
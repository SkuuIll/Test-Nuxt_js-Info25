<template>
  <div class="bg-white overflow-hidden shadow rounded-lg">
    <div class="p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <component
            :is="iconComponent"
            :class="[
              'h-6 w-6',
              {
                'text-blue-600': color === 'blue',
                'text-green-600': color === 'green',
                'text-purple-600': color === 'purple',
                'text-yellow-600': color === 'yellow',
                'text-red-600': color === 'red',
                'text-indigo-600': color === 'indigo'
              }
            ]"
          />
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 truncate">
              {{ title }}
            </dt>
            <dd>
              <div class="text-lg font-medium text-gray-900">
                {{ formattedValue }}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    
    <!-- Change indicator and link -->
    <div
      v-if="change !== undefined || link"
      :class="[
        'px-5 py-3 border-t border-gray-200',
        {
          'bg-gray-50': !link,
          'bg-blue-50 hover:bg-blue-100 cursor-pointer transition-colors': link
        }
      ]"
      @click="handleClick"
    >
      <div class="text-sm">
        <!-- Change indicator -->
        <div v-if="change !== undefined" class="flex items-center">
          <ArrowUpIcon
            v-if="change > 0"
            class="h-4 w-4 text-green-500 mr-1"
          />
          <ArrowDownIcon
            v-else-if="change < 0"
            class="h-4 w-4 text-red-500 mr-1"
          />
          <span
            :class="[
              'font-medium',
              {
                'text-green-600': change > 0,
                'text-red-600': change < 0,
                'text-gray-600': change === 0
              }
            ]"
          >
            {{ changeText }}
          </span>
          <span v-if="changeLabel" class="text-gray-500 ml-1">
            {{ changeLabel }}
          </span>
        </div>
        
        <!-- Link text -->
        <div v-if="link" class="flex items-center justify-between">
          <span class="text-blue-600 font-medium">
            {{ linkText || 'Ver detalles' }}
          </span>
          <ArrowRightIcon class="h-4 w-4 text-blue-600" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DocumentTextIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'

interface Props {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  icon: string
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo'
  link?: string
  linkText?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue'
})

// Icon mapping
const iconMap = {
  DocumentTextIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  EyeIcon
}

// Computed
const iconComponent = computed(() => {
  return iconMap[props.icon as keyof typeof iconMap] || DocumentTextIcon
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const changeText = computed(() => {
  if (props.change === undefined) return ''
  
  const absChange = Math.abs(props.change)
  const sign = props.change > 0 ? '+' : props.change < 0 ? '-' : ''
  
  return `${sign}${absChange.toLocaleString()}`
})

// Methods
const handleClick = () => {
  if (props.link) {
    navigateTo(props.link)
  }
}
</script>
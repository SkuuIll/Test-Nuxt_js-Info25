<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div 
          class="w-8 h-8 rounded-md flex items-center justify-center"
          :class="iconBgClass"
        >
          <Icon :name="icon" class="w-5 h-5" :class="iconClass" />
        </div>
      </div>
      
      <div class="ml-5 w-0 flex-1">
        <dl>
          <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {{ title }}
          </dt>
          <dd class="flex items-baseline">
            <div class="text-2xl font-semibold text-gray-900 dark:text-white">
              <span v-if="loading" class="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-8 w-16 inline-block"></span>
              <span v-else>{{ formattedValue }}</span>
            </div>
            
            <div 
              v-if="change !== undefined && !loading"
              class="ml-2 flex items-baseline text-sm font-semibold"
              :class="changeClass"
            >
              <Icon 
                :name="changeIcon" 
                class="self-center flex-shrink-0 h-4 w-4"
                :class="changeClass"
              />
              <span class="sr-only">{{ change >= 0 ? 'Increased' : 'Decreased' }} by</span>
              {{ Math.abs(change) }}%
            </div>
          </dd>
        </dl>
      </div>
    </div>
    
    <!-- Trend line (optional) -->
    <div v-if="trend && trend.length > 0" class="mt-4">
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{{ trendLabel || 'Últimos 7 días' }}</span>
        <span v-if="trendChange !== undefined" :class="trendChangeClass">
          {{ trendChange >= 0 ? '+' : '' }}{{ trendChange }}%
        </span>
      </div>
      <div class="h-8">
        <svg class="w-full h-full" viewBox="0 0 100 32" preserveAspectRatio="none">
          <polyline
            :points="trendPoints"
            fill="none"
            :stroke="trendColor"
            stroke-width="2"
            class="opacity-75"
          />
          <polyline
            :points="trendPoints"
            fill="none"
            :stroke="trendColor"
            stroke-width="2"
            stroke-dasharray="0,5"
            class="opacity-25"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
interface Props {
  title: string
  value: number | string
  icon: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  change?: number
  loading?: boolean
  trend?: number[]
  trendLabel?: string
  trendChange?: number
  format?: 'number' | 'currency' | 'percentage'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  loading: false,
  format: 'number'
})

// Computed properties
const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(props.value)
    case 'percentage':
      return `${props.value}%`
    default:
      return new Intl.NumberFormat('es-ES').format(props.value)
  }
})

const iconBgClass = computed(() => {
  const classes = {
    blue: 'bg-blue-100 dark:bg-blue-900',
    green: 'bg-green-100 dark:bg-green-900',
    yellow: 'bg-yellow-100 dark:bg-yellow-900',
    red: 'bg-red-100 dark:bg-red-900',
    purple: 'bg-purple-100 dark:bg-purple-900',
    indigo: 'bg-indigo-100 dark:bg-indigo-900'
  }
  return classes[props.color]
})

const iconClass = computed(() => {
  const classes = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400'
  }
  return classes[props.color]
})

const changeClass = computed(() => {
  if (props.change === undefined) return ''
  return props.change >= 0 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400'
})

const changeIcon = computed(() => {
  if (props.change === undefined) return ''
  return props.change >= 0 ? 'trending-up' : 'trending-down'
})

const trendChangeClass = computed(() => {
  if (props.trendChange === undefined) return ''
  return props.trendChange >= 0 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400'
})

const trendColor = computed(() => {
  const colors = {
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
    purple: '#8B5CF6',
    indigo: '#6366F1'
  }
  return colors[props.color]
})

const trendPoints = computed(() => {
  if (!props.trend || props.trend.length === 0) return ''
  
  const max = Math.max(...props.trend)
  const min = Math.min(...props.trend)
  const range = max - min || 1
  
  return props.trend
    .map((value, index) => {
      const x = (index / (props.trend!.length - 1)) * 100
      const y = 32 - ((value - min) / range) * 32
      return `${x},${y}`
    })
    .join(' ')
})
</script>
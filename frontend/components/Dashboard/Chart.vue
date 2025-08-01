<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400">
          {{ subtitle }}
        </p>
      </div>
      
      <div v-if="!loading" class="flex space-x-2">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
          :class="selectedPeriod === period.value 
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300' 
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <Icon name="loading" class="w-8 h-8 animate-spin text-primary-600" />
    </div>

    <!-- Chart Content -->
    <div v-else-if="chartData && chartData.length > 0">
      <!-- Line Chart -->
      <div v-if="type === 'line'" class="h-64">
        <svg class="w-full h-full" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
          <!-- Grid lines -->
          <g class="opacity-20">
            <line
              v-for="i in 5"
              :key="`h-${i}`"
              :x1="padding"
              :y1="padding + (i - 1) * ((chartHeight - 2 * padding) / 4)"
              :x2="chartWidth - padding"
              :y2="padding + (i - 1) * ((chartHeight - 2 * padding) / 4)"
              stroke="currentColor"
              stroke-width="1"
              class="text-gray-300 dark:text-gray-600"
            />
            <line
              v-for="i in Math.min(chartData.length, 7)"
              :key="`v-${i}`"
              :x1="padding + (i - 1) * ((chartWidth - 2 * padding) / (Math.min(chartData.length, 7) - 1))"
              :y1="padding"
              :x2="padding + (i - 1) * ((chartWidth - 2 * padding) / (Math.min(chartData.length, 7) - 1))"
              :y2="chartHeight - padding"
              stroke="currentColor"
              stroke-width="1"
              class="text-gray-300 dark:text-gray-600"
            />
          </g>

          <!-- Data line -->
          <polyline
            :points="linePoints"
            fill="none"
            :stroke="lineColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <!-- Data points -->
          <circle
            v-for="(point, index) in chartData"
            :key="index"
            :cx="getX(index)"
            :cy="getY(point.value)"
            r="4"
            :fill="lineColor"
            class="hover:r-6 transition-all cursor-pointer"
            @mouseenter="showTooltip(index, $event)"
            @mouseleave="hideTooltip"
          />

          <!-- Area fill (optional) -->
          <path
            v-if="filled"
            :d="areaPath"
            :fill="lineColor"
            fill-opacity="0.1"
          />
        </svg>
      </div>

      <!-- Bar Chart -->
      <div v-else-if="type === 'bar'" class="h-64">
        <svg class="w-full h-full" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
          <!-- Grid lines -->
          <g class="opacity-20">
            <line
              v-for="i in 5"
              :key="`h-${i}`"
              :x1="padding"
              :y1="padding + (i - 1) * ((chartHeight - 2 * padding) / 4)"
              :x2="chartWidth - padding"
              :y2="padding + (i - 1) * ((chartHeight - 2 * padding) / 4)"
              stroke="currentColor"
              stroke-width="1"
              class="text-gray-300 dark:text-gray-600"
            />
          </g>

          <!-- Bars -->
          <rect
            v-for="(point, index) in chartData"
            :key="index"
            :x="getBarX(index)"
            :y="getY(point.value)"
            :width="barWidth"
            :height="getBarHeight(point.value)"
            :fill="getBarColor(index)"
            rx="2"
            class="hover:opacity-80 transition-opacity cursor-pointer"
            @mouseenter="showTooltip(index, $event)"
            @mouseleave="hideTooltip"
          />
        </svg>
      </div>

      <!-- Labels -->
      <div class="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span
          v-for="(point, index) in displayLabels"
          :key="index"
          class="text-center"
        >
          {{ point.label }}
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
      <Icon name="chart-bar" class="w-12 h-12 mb-4 opacity-50" />
      <p class="text-sm">No hay datos disponibles</p>
    </div>

    <!-- Tooltip -->
    <div
      v-if="tooltip.show"
      class="absolute z-10 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg pointer-events-none"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="font-medium">{{ tooltip.label }}</div>
      <div>{{ tooltip.value }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ChartData {
  label: string
  value: number
}

interface Period {
  label: string
  value: string
}

interface Props {
  title?: string
  subtitle?: string
  data?: ChartData[]
  type?: 'line' | 'bar'
  loading?: boolean
  color?: string
  filled?: boolean
  periods?: Period[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  color: '#3B82F6',
  filled: false,
  periods: () => [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' }
  ]
})

const emit = defineEmits<{
  periodChange: [period: string]
}>()

// State
const selectedPeriod = ref(props.periods[0]?.value || '7d')
const tooltip = reactive({
  show: false,
  x: 0,
  y: 0,
  label: '',
  value: ''
})

// Chart dimensions
const chartWidth = 400
const chartHeight = 200
const padding = 40

// Computed
const chartData = computed(() => props.data)

const maxValue = computed(() => {
  if (!chartData.value.length) return 0
  return Math.max(...chartData.value.map(d => d.value))
})

const minValue = computed(() => {
  if (!chartData.value.length) return 0
  return Math.min(...chartData.value.map(d => d.value))
})

const lineColor = computed(() => props.color)

const barWidth = computed(() => {
  if (!chartData.value.length) return 0
  return (chartWidth - 2 * padding) / chartData.value.length * 0.8
})

const displayLabels = computed(() => {
  if (chartData.value.length <= 7) return chartData.value
  
  // Show only every nth label to avoid crowding
  const step = Math.ceil(chartData.value.length / 7)
  return chartData.value.filter((_, index) => index % step === 0)
})

// Methods
const getX = (index: number) => {
  return padding + (index / (chartData.value.length - 1)) * (chartWidth - 2 * padding)
}

const getY = (value: number) => {
  const range = maxValue.value - minValue.value || 1
  return chartHeight - padding - ((value - minValue.value) / range) * (chartHeight - 2 * padding)
}

const getBarX = (index: number) => {
  return padding + (index / chartData.value.length) * (chartWidth - 2 * padding) + (barWidth.value * 0.1)
}

const getBarHeight = (value: number) => {
  const range = maxValue.value - minValue.value || 1
  return ((value - minValue.value) / range) * (chartHeight - 2 * padding)
}

const getBarColor = (index: number) => {
  // Vary opacity for visual interest
  const opacity = 0.7 + (index % 3) * 0.1
  return props.color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
}

const linePoints = computed(() => {
  return chartData.value
    .map((point, index) => `${getX(index)},${getY(point.value)}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (!chartData.value.length) return ''
  
  const points = chartData.value.map((point, index) => `${getX(index)},${getY(point.value)}`)
  const firstPoint = `${getX(0)},${chartHeight - padding}`
  const lastPoint = `${getX(chartData.value.length - 1)},${chartHeight - padding}`
  
  return `M${firstPoint} L${points.join(' L')} L${lastPoint} Z`
})

const showTooltip = (index: number, event: MouseEvent) => {
  const point = chartData.value[index]
  if (!point) return
  
  tooltip.show = true
  tooltip.x = event.clientX + 10
  tooltip.y = event.clientY - 10
  tooltip.label = point.label
  tooltip.value = new Intl.NumberFormat('es-ES').format(point.value)
}

const hideTooltip = () => {
  tooltip.show = false
}

// Watch for period changes
watch(selectedPeriod, (newPeriod) => {
  emit('periodChange', newPeriod)
})
</script>
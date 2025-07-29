<template>
  <div class="relative">
    <canvas ref="chartCanvas" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
    fill?: boolean
  }>
}

interface Props {
  type: 'line' | 'bar' | 'doughnut' | 'pie'
  data: ChartData
  options?: any
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 200,
  options: () => ({})
})

const chartCanvas = ref<HTMLCanvasElement>()
let chartInstance: ChartJS | null = null

// Default options
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
}

// Create chart
const createChart = () => {
  if (!chartCanvas.value) return

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  // Merge options
  const mergedOptions = {
    ...defaultOptions,
    ...props.options
  }

  // Remove scales for pie/doughnut charts
  if (props.type === 'pie' || props.type === 'doughnut') {
    delete mergedOptions.scales
  }

  // Create new chart
  chartInstance = new ChartJS(chartCanvas.value, {
    type: props.type,
    data: props.data,
    options: mergedOptions
  })
}

// Update chart data
const updateChart = () => {
  if (chartInstance) {
    chartInstance.data = props.data
    chartInstance.update()
  }
}

// Watch for data changes
watch(() => props.data, updateChart, { deep: true })

// Lifecycle
onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>
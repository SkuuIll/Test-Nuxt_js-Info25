<template>
  <div
    class="progress-bar"
    :class="[
      `progress-bar--${variant}`,
      `progress-bar--${size}`,
      {
        'progress-bar--animated': animated,
        'progress-bar--striped': striped,
        'progress-bar--indeterminate': indeterminate
      }
    ]"
    role="progressbar"
    :aria-valuenow="indeterminate ? undefined : value"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-label="ariaLabel"
    :aria-describedby="showLabel ? `${id}-label` : undefined"
  >
    <!-- Progress bar container -->
    <div class="progress-bar__container">
      <!-- Background track -->
      <div class="progress-bar__track" />
      
      <!-- Progress fill -->
      <div
        class="progress-bar__fill"
        :class="{
          'progress-bar__fill--indeterminate': indeterminate,
          'progress-bar__fill--striped': striped,
          'progress-bar__fill--animated': animated
        }"
        :style="fillStyles"
      >
        <!-- Stripes overlay -->
        <div v-if="striped" class="progress-bar__stripes" />
      </div>
      
      <!-- Multiple segments (for multi-step progress) -->
      <template v-if="segments && segments.length > 0">
        <div
          v-for="(segment, index) in segments"
          :key="index"
          class="progress-bar__segment"
          :class="`progress-bar__segment--${segment.color || 'primary'}`"
          :style="{
            left: `${segment.start}%`,
            width: `${segment.end - segment.start}%`
          }"
        />
      </template>
      
      <!-- Markers -->
      <template v-if="markers && markers.length > 0">
        <div
          v-for="(marker, index) in markers"
          :key="index"
          class="progress-bar__marker"
          :style="{ left: `${marker.position}%` }"
          :title="marker.label"
        />
      </template>
    </div>
    
    <!-- Label -->
    <div
      v-if="showLabel"
      :id="`${id}-label`"
      class="progress-bar__label"
      :class="{
        'progress-bar__label--inside': labelInside,
        'progress-bar__label--outside': !labelInside
      }"
    >
      <template v-if="customLabel">
        {{ customLabel }}
      </template>
      <template v-else-if="!indeterminate">
        {{ Math.round(value) }}{{ showPercentage ? '%' : '' }}
      </template>
      <template v-else>
        {{ loadingText }}
      </template>
    </div>
    
    <!-- Status text -->
    <div
      v-if="statusText"
      class="progress-bar__status"
    >
      {{ statusText }}
    </div>
    
    <!-- Time remaining -->
    <div
      v-if="showTimeRemaining && timeRemaining"
      class="progress-bar__time"
    >
      {{ formatTime(timeRemaining) }} restante{{ timeRemaining !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Segment {
  start: number
  end: number
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  label?: string
}

interface Marker {
  position: number
  label?: string
}

interface Props {
  // Progress value (0-100)
  value?: number
  
  // Appearance
  variant?: 'default' | 'thin' | 'thick' | 'rounded' | 'square'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  
  // Animation and styling
  animated?: boolean
  striped?: boolean
  indeterminate?: boolean
  
  // Label and text
  showLabel?: boolean
  labelInside?: boolean
  customLabel?: string
  showPercentage?: boolean
  statusText?: string
  loadingText?: string
  
  // Time tracking
  showTimeRemaining?: boolean
  timeRemaining?: number // in seconds
  
  // Multi-segment progress
  segments?: Segment[]
  
  // Markers
  markers?: Marker[]
  
  // Accessibility
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  variant: 'default',
  size: 'md',
  color: 'primary',
  animated: true,
  striped: false,
  indeterminate: false,
  showLabel: false,
  labelInside: false,
  showPercentage: true,
  loadingText: 'Cargando...',
  showTimeRemaining: false,
  ariaLabel: 'Progreso'
})

// Generate unique ID for accessibility
const id = ref(`progress-${Math.random().toString(36).substr(2, 9)}`)

// Computed styles for the fill
const fillStyles = computed(() => {
  if (props.indeterminate) {
    return {}
  }
  
  const clampedValue = Math.max(0, Math.min(100, props.value))
  return {
    width: `${clampedValue}%`,
    transition: props.animated ? 'width 0.3s ease-out' : 'none'
  }
})

// Format time remaining
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
}
</script>

<style scoped>
/* Base progress bar styles */
.progress-bar {
  @apply relative w-full;
}

.progress-bar__container {
  @apply relative overflow-hidden;
}

.progress-bar__track {
  @apply absolute inset-0 bg-gray-200 dark:bg-gray-700;
}

.progress-bar__fill {
  @apply relative h-full transition-all duration-300 ease-out;
}

/* Variant styles */
.progress-bar--default .progress-bar__container {
  @apply rounded;
}

.progress-bar--thin .progress-bar__container {
  @apply rounded-full;
}

.progress-bar--thick .progress-bar__container {
  @apply rounded-lg;
}

.progress-bar--rounded .progress-bar__container {
  @apply rounded-full;
}

.progress-bar--square .progress-bar__container {
  @apply rounded-none;
}

/* Size variants */
.progress-bar--xs .progress-bar__container {
  @apply h-1;
}

.progress-bar--sm .progress-bar__container {
  @apply h-2;
}

.progress-bar--md .progress-bar__container {
  @apply h-3;
}

.progress-bar--lg .progress-bar__container {
  @apply h-4;
}

.progress-bar--xl .progress-bar__container {
  @apply h-6;
}

/* Color variants */
.progress-bar--primary .progress-bar__fill {
  @apply bg-blue-500;
}

.progress-bar--secondary .progress-bar__fill {
  @apply bg-gray-500;
}

.progress-bar--success .progress-bar__fill {
  @apply bg-green-500;
}

.progress-bar--warning .progress-bar__fill {
  @apply bg-yellow-500;
}

.progress-bar--error .progress-bar__fill {
  @apply bg-red-500;
}

.progress-bar--info .progress-bar__fill {
  @apply bg-cyan-500;
}

/* Striped pattern */
.progress-bar__fill--striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 1rem 1rem;
}

.progress-bar__fill--animated.progress-bar__fill--striped {
  animation: progress-stripes 1s linear infinite;
}

/* Indeterminate animation */
.progress-bar__fill--indeterminate {
  @apply w-full;
  background: linear-gradient(
    90deg,
    transparent,
    currentColor,
    transparent
  );
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}

/* Segments */
.progress-bar__segment {
  @apply absolute top-0 h-full;
}

.progress-bar__segment--primary {
  @apply bg-blue-500;
}

.progress-bar__segment--secondary {
  @apply bg-gray-500;
}

.progress-bar__segment--success {
  @apply bg-green-500;
}

.progress-bar__segment--warning {
  @apply bg-yellow-500;
}

.progress-bar__segment--error {
  @apply bg-red-500;
}

/* Markers */
.progress-bar__marker {
  @apply absolute top-0 w-0.5 h-full bg-gray-400 dark:bg-gray-500;
  transform: translateX(-50%);
}

/* Labels */
.progress-bar__label {
  @apply text-sm font-medium;
}

.progress-bar__label--inside {
  @apply absolute inset-0 flex items-center justify-center text-white text-xs;
}

.progress-bar__label--outside {
  @apply mt-1 text-gray-700 dark:text-gray-300;
}

.progress-bar__status {
  @apply mt-1 text-xs text-gray-600 dark:text-gray-400;
}

.progress-bar__time {
  @apply mt-1 text-xs text-gray-500 dark:text-gray-500;
}

/* Animations */
@keyframes progress-stripes {
  0% {
    background-position: 1rem 0;
  }
  100% {
    background-position: 0 0;
  }
}

@keyframes progress-indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Dark mode adjustments */
.dark .progress-bar__track {
  @apply bg-gray-600;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .progress-bar__fill {
    @apply transition-none;
  }
  
  .progress-bar__fill--animated.progress-bar__fill--striped {
    animation: none;
  }
  
  .progress-bar__fill--indeterminate {
    animation: none;
    background: linear-gradient(90deg, transparent, currentColor, transparent);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .progress-bar__track {
    @apply bg-gray-300 dark:bg-gray-800;
  }
  
  .progress-bar__fill {
    @apply border border-current;
  }
}

/* Focus styles for interactive elements */
.progress-bar:focus-within {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .progress-bar__label--outside {
    @apply text-xs;
  }
  
  .progress-bar__status,
  .progress-bar__time {
    @apply text-xs;
  }
}
</style>
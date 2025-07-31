<template>
  <div 
    :class="skeletonClasses"
    :style="skeletonStyles"
    :aria-label="ariaLabel"
    role="status"
    aria-live="polite"
  >
    <!-- Default slot content when not loading -->
    <slot v-if="!loading" />
    
    <!-- Skeleton content when loading -->
    <div v-else class="skeleton-content">
      <!-- Avatar skeleton -->
      <div v-if="avatar" class="skeleton-avatar" :class="avatarClasses"></div>
      
      <!-- Lines skeleton -->
      <div v-if="lines > 0" class="skeleton-lines">
        <div 
          v-for="line in lines" 
          :key="line"
          class="skeleton-line"
          :class="getLineClasses(line)"
          :style="getLineStyles(line)"
        ></div>
      </div>
      
      <!-- Custom skeleton shapes -->
      <div v-if="shapes.length > 0" class="skeleton-shapes">
        <div
          v-for="(shape, index) in shapes"
          :key="index"
          class="skeleton-shape"
          :class="getShapeClasses(shape)"
          :style="getShapeStyles(shape)"
        ></div>
      </div>
      
      <!-- Card skeleton -->
      <div v-if="variant === 'card'" class="skeleton-card">
        <div class="skeleton-card-header">
          <div class="skeleton-card-avatar"></div>
          <div class="skeleton-card-info">
            <div class="skeleton-card-title"></div>
            <div class="skeleton-card-subtitle"></div>
          </div>
        </div>
        <div class="skeleton-card-content">
          <div class="skeleton-card-line"></div>
          <div class="skeleton-card-line"></div>
          <div class="skeleton-card-line short"></div>
        </div>
        <div class="skeleton-card-actions">
          <div class="skeleton-card-button"></div>
          <div class="skeleton-card-button"></div>
        </div>
      </div>
      
      <!-- List skeleton -->
      <div v-if="variant === 'list'" class="skeleton-list">
        <div 
          v-for="item in (count || 3)" 
          :key="item"
          class="skeleton-list-item"
        >
          <div class="skeleton-list-avatar"></div>
          <div class="skeleton-list-content">
            <div class="skeleton-list-title"></div>
            <div class="skeleton-list-subtitle"></div>
          </div>
          <div class="skeleton-list-action"></div>
        </div>
      </div>
      
      <!-- Table skeleton -->
      <div v-if="variant === 'table'" class="skeleton-table">
        <div class="skeleton-table-header">
          <div 
            v-for="col in (columns || 4)" 
            :key="col"
            class="skeleton-table-header-cell"
          ></div>
        </div>
        <div 
          v-for="row in (rows || 5)" 
          :key="row"
          class="skeleton-table-row"
        >
          <div 
            v-for="col in (columns || 4)" 
            :key="col"
            class="skeleton-table-cell"
            :class="{ 'short': col === 1, 'long': col === 2 }"
          ></div>
        </div>
      </div>
      
      <!-- Text skeleton -->
      <div v-if="variant === 'text'" class="skeleton-text">
        <div 
          v-for="paragraph in (paragraphs || 1)" 
          :key="paragraph"
          class="skeleton-paragraph"
        >
          <div 
            v-for="line in (linesPerParagraph || 3)" 
            :key="line"
            class="skeleton-text-line"
            :class="{ 'short': line === linesPerParagraph }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SkeletonShape {
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
}

interface Props {
  loading?: boolean
  variant?: 'default' | 'card' | 'list' | 'table' | 'text' | 'custom'
  animation?: 'pulse' | 'wave' | 'shimmer' | 'none'
  lines?: number
  avatar?: boolean
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl'
  shapes?: SkeletonShape[]
  count?: number
  columns?: number
  rows?: number
  paragraphs?: number
  linesPerParagraph?: number
  width?: string | number
  height?: string | number
  borderRadius?: string
  className?: string
  speed?: 'slow' | 'normal' | 'fast'
  color?: string
  highlightColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: true,
  variant: 'default',
  animation: 'pulse',
  lines: 3,
  avatar: false,
  avatarSize: 'md',
  shapes: () => [],
  count: 3,
  columns: 4,
  rows: 5,
  paragraphs: 1,
  linesPerParagraph: 3,
  borderRadius: '0.375rem',
  className: '',
  speed: 'normal',
  color: '#e5e7eb',
  highlightColor: '#f3f4f6'
})

// Computed properties
const skeletonClasses = computed(() => {
  const classes = ['skeleton-loader', `skeleton-${props.variant}`, `skeleton-${props.animation}`]
  
  if (props.speed !== 'normal') {
    classes.push(`skeleton-${props.speed}`)
  }
  
  if (props.className) {
    classes.push(props.className)
  }
  
  return classes
})

const skeletonStyles = computed(() => {
  const styles: Record<string, string> = {}
  
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  if (props.color) {
    styles['--skeleton-color'] = props.color
  }
  
  if (props.highlightColor) {
    styles['--skeleton-highlight'] = props.highlightColor
  }
  
  return styles
})

const avatarClasses = computed(() => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }
  
  return ['skeleton-element', sizeClasses[props.avatarSize]]
})

const ariaLabel = computed(() => {
  return props.loading ? 'Cargando contenido...' : undefined
})

// Methods
const getLineClasses = (lineNumber: number) => {
  const classes = ['skeleton-element']
  
  // Make last line shorter
  if (lineNumber === props.lines) {
    classes.push('short')
  }
  
  // Random width variations for more natural look
  const variations = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3']
  if (lineNumber < props.lines) {
    classes.push(variations[lineNumber % variations.length])
  } else {
    classes.push('w-1/2')
  }
  
  return classes
})

const getLineStyles = (lineNumber: number) => {
  const styles: Record<string, string> = {}
  
  // Add slight delay for wave animation
  if (props.animation === 'wave') {
    styles.animationDelay = `${lineNumber * 0.1}s`
  }
  
  return styles
})

const getShapeClasses = (shape: SkeletonShape) => {
  const classes = ['skeleton-element']
  
  if (shape.className) {
    classes.push(shape.className)
  }
  
  return classes
})

const getShapeStyles = (shape: SkeletonShape) => {
  const styles: Record<string, string> = {}
  
  if (shape.width) {
    styles.width = typeof shape.width === 'number' ? `${shape.width}px` : shape.width
  }
  
  if (shape.height) {
    styles.height = typeof shape.height === 'number' ? `${shape.height}px` : shape.height
  }
  
  if (shape.borderRadius) {
    styles.borderRadius = shape.borderRadius
  }
  
  return styles
})
</script>

<style scoped>
.skeleton-loader {
  --skeleton-color: #e5e7eb;
  --skeleton-highlight: #f3f4f6;
  --skeleton-duration: 1.5s;
}

.skeleton-element {
  background: var(--skeleton-color);
  border-radius: v-bind(borderRadius);
  position: relative;
  overflow: hidden;
}

/* Animation Variants */
.skeleton-pulse .skeleton-element {
  animation: skeleton-pulse var(--skeleton-duration) ease-in-out infinite;
}

.skeleton-wave .skeleton-element::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    var(--skeleton-highlight),
    transparent
  );
  animation: skeleton-wave var(--skeleton-duration) ease-in-out infinite;
}

.skeleton-shimmer .skeleton-element {
  background: linear-gradient(
    90deg,
    var(--skeleton-color) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-color) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer var(--skeleton-duration) ease-in-out infinite;
}

/* Speed Variants */
.skeleton-slow {
  --skeleton-duration: 2.5s;
}

.skeleton-fast {
  --skeleton-duration: 1s;
}

/* Layout Components */
.skeleton-content {
  @apply space-y-4;
}

.skeleton-lines {
  @apply space-y-3;
}

.skeleton-line {
  @apply h-4;
}

.skeleton-line.short {
  @apply w-2/3;
}

.skeleton-shapes {
  @apply flex flex-wrap gap-4;
}

.skeleton-avatar {
  @apply rounded-full mb-4;
}

/* Card Skeleton */
.skeleton-card {
  @apply p-6 border border-gray-200 rounded-lg space-y-4;
}

.skeleton-card-header {
  @apply flex items-center space-x-4;
}

.skeleton-card-avatar {
  @apply w-12 h-12 rounded-full;
  @extend .skeleton-element;
}

.skeleton-card-info {
  @apply flex-1 space-y-2;
}

.skeleton-card-title {
  @apply h-5 w-1/3;
  @extend .skeleton-element;
}

.skeleton-card-subtitle {
  @apply h-4 w-1/4;
  @extend .skeleton-element;
}

.skeleton-card-content {
  @apply space-y-3;
}

.skeleton-card-line {
  @apply h-4;
  @extend .skeleton-element;
}

.skeleton-card-line.short {
  @apply w-2/3;
}

.skeleton-card-actions {
  @apply flex space-x-3;
}

.skeleton-card-button {
  @apply h-10 w-20 rounded;
  @extend .skeleton-element;
}

/* List Skeleton */
.skeleton-list {
  @apply space-y-4;
}

.skeleton-list-item {
  @apply flex items-center space-x-4 p-4 border border-gray-200 rounded-lg;
}

.skeleton-list-avatar {
  @apply w-10 h-10 rounded-full;
  @extend .skeleton-element;
}

.skeleton-list-content {
  @apply flex-1 space-y-2;
}

.skeleton-list-title {
  @apply h-5 w-1/3;
  @extend .skeleton-element;
}

.skeleton-list-subtitle {
  @apply h-4 w-1/2;
  @extend .skeleton-element;
}

.skeleton-list-action {
  @apply h-8 w-16 rounded;
  @extend .skeleton-element;
}

/* Table Skeleton */
.skeleton-table {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.skeleton-table-header {
  @apply flex bg-gray-50 p-4 space-x-4;
}

.skeleton-table-header-cell {
  @apply h-5 flex-1;
  @extend .skeleton-element;
}

.skeleton-table-row {
  @apply flex p-4 space-x-4 border-t border-gray-200;
}

.skeleton-table-cell {
  @apply h-4 flex-1;
  @extend .skeleton-element;
}

.skeleton-table-cell.short {
  @apply w-16 flex-none;
}

.skeleton-table-cell.long {
  @apply flex-2;
}

/* Text Skeleton */
.skeleton-text {
  @apply space-y-6;
}

.skeleton-paragraph {
  @apply space-y-3;
}

.skeleton-text-line {
  @apply h-4;
  @extend .skeleton-element;
}

.skeleton-text-line.short {
  @apply w-3/4;
}

/* Animations */
@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes skeleton-wave {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .skeleton-loader {
    --skeleton-color: #374151;
    --skeleton-highlight: #4b5563;
  }
  
  .skeleton-card,
  .skeleton-list-item,
  .skeleton-table {
    @apply border-gray-700;
  }
  
  .skeleton-table-header {
    @apply bg-gray-800;
  }
  
  .skeleton-table-row {
    @apply border-gray-700;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .skeleton-card {
    @apply p-4;
  }
  
  .skeleton-list-item {
    @apply p-3;
  }
  
  .skeleton-table-header,
  .skeleton-table-row {
    @apply p-3 space-x-3;
  }
}
</style>
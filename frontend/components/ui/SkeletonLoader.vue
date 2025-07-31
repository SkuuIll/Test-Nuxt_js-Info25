<template>
  <div class="skeleton-loader" :class="[`skeleton-${type}`, { animated }]">
    <!-- Text Skeleton -->
    <template v-if="type === 'text'">
      <div 
        v-for="line in count" 
        :key="line"
        class="skeleton-line"
        :style="getLineStyle(line)"
      />
    </template>

    <!-- Card Skeleton -->
    <template v-else-if="type === 'card'">
      <div 
        v-for="card in count" 
        :key="card"
        class="skeleton-card"
      >
        <div class="skeleton-card-image" />
        <div class="skeleton-card-content">
          <div class="skeleton-line skeleton-title" />
          <div class="skeleton-line skeleton-subtitle" />
          <div class="skeleton-line skeleton-text" />
        </div>
      </div>
    </template>

    <!-- List Skeleton -->
    <template v-else-if="type === 'list'">
      <div 
        v-for="item in count" 
        :key="item"
        class="skeleton-list-item"
      >
        <div class="skeleton-avatar" />
        <div class="skeleton-list-content">
          <div class="skeleton-line skeleton-list-title" />
          <div class="skeleton-line skeleton-list-subtitle" />
        </div>
      </div>
    </template>

    <!-- Table Skeleton -->
    <template v-else-if="type === 'table'">
      <div class="skeleton-table">
        <div class="skeleton-table-header">
          <div 
            v-for="col in columns" 
            :key="col"
            class="skeleton-table-header-cell"
          />
        </div>
        <div 
          v-for="row in count" 
          :key="row"
          class="skeleton-table-row"
        >
          <div 
            v-for="col in columns" 
            :key="col"
            class="skeleton-table-cell"
          />
        </div>
      </div>
    </template>

    <!-- Custom Skeleton -->
    <template v-else-if="type === 'custom'">
      <div 
        class="skeleton-custom"
        :style="{ width, height }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'text' | 'card' | 'list' | 'table' | 'custom'
  count?: number
  columns?: number
  width?: string
  height?: string
  animated?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  count: 3,
  columns: 4,
  width: '100%',
  height: '20px',
  animated: true,
  className: ''
})

const getLineStyle = (lineNumber: number) => {
  // Vary line widths for more realistic skeleton
  const widths = ['100%', '85%', '92%', '78%', '95%']
  const width = widths[(lineNumber - 1) % widths.length]
  
  return {
    width,
    height: props.height
  }
}
</script>

<style scoped>
.skeleton-loader {
  @apply space-y-3;
}

.skeleton-line {
  @apply bg-gray-200 rounded;
  height: 16px;
}

.skeleton-line:last-child {
  width: 75% !important;
}

/* Animation */
.animated .skeleton-line,
.animated .skeleton-card-image,
.animated .skeleton-avatar,
.animated .skeleton-table-cell,
.animated .skeleton-table-header-cell,
.animated .skeleton-custom {
  @apply relative overflow-hidden;
}

.animated .skeleton-line::after,
.animated .skeleton-card-image::after,
.animated .skeleton-avatar::after,
.animated .skeleton-table-cell::after,
.animated .skeleton-table-header-cell::after,
.animated .skeleton-custom::after {
  @apply absolute inset-0;
  content: '';
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Card Skeleton */
.skeleton-card {
  @apply border border-gray-200 rounded-lg p-4 space-y-3;
}

.skeleton-card-image {
  @apply bg-gray-200 rounded w-full h-48;
}

.skeleton-card-content {
  @apply space-y-2;
}

.skeleton-title {
  @apply h-6;
  width: 70%;
}

.skeleton-subtitle {
  @apply h-4;
  width: 50%;
}

.skeleton-text {
  @apply h-4;
  width: 90%;
}

/* List Skeleton */
.skeleton-list-item {
  @apply flex items-center space-x-3 py-3;
}

.skeleton-avatar {
  @apply bg-gray-200 rounded-full w-10 h-10 flex-shrink-0;
}

.skeleton-list-content {
  @apply flex-1 space-y-2;
}

.skeleton-list-title {
  @apply h-4;
  width: 60%;
}

.skeleton-list-subtitle {
  @apply h-3;
  width: 40%;
}

/* Table Skeleton */
.skeleton-table {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.skeleton-table-header {
  @apply flex bg-gray-50 border-b border-gray-200;
}

.skeleton-table-header-cell {
  @apply flex-1 p-3 bg-gray-200 h-6;
}

.skeleton-table-header-cell:not(:last-child) {
  @apply border-r border-gray-200;
}

.skeleton-table-row {
  @apply flex border-b border-gray-200 last:border-b-0;
}

.skeleton-table-cell {
  @apply flex-1 p-3 bg-gray-100 h-4;
}

.skeleton-table-cell:not(:last-child) {
  @apply border-r border-gray-200;
}

/* Custom Skeleton */
.skeleton-custom {
  @apply bg-gray-200 rounded;
}

/* Dark mode support */
.dark .skeleton-line,
.dark .skeleton-card-image,
.dark .skeleton-avatar,
.dark .skeleton-table-cell,
.dark .skeleton-table-header-cell,
.dark .skeleton-custom {
  @apply bg-gray-700;
}

.dark .skeleton-card {
  @apply border-gray-700;
}

.dark .skeleton-table {
  @apply border-gray-700;
}

.dark .skeleton-table-header {
  @apply bg-gray-800;
}

.dark .skeleton-table-header-cell,
.dark .skeleton-table-row {
  @apply border-gray-700;
}

.dark .skeleton-table-cell {
  @apply bg-gray-800;
}

.dark .animated .skeleton-line::after,
.dark .animated .skeleton-card-image::after,
.dark .animated .skeleton-avatar::after,
.dark .animated .skeleton-table-cell::after,
.dark .animated .skeleton-table-header-cell::after,
.dark .animated .skeleton-custom::after {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .skeleton-card-image {
    @apply h-32;
  }
  
  .skeleton-table-header-cell,
  .skeleton-table-cell {
    @apply p-2;
  }
  
  .skeleton-list-item {
    @apply py-2;
  }
}
</style>
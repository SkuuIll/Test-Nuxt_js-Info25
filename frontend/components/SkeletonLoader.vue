<template>
  <div class="skeleton-loader" :class="containerClass">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="skeleton-item"
      :class="[item.class, 'skeleton']"
      :style="item.style"
    ></div>
  </div>
</template>

<script setup lang="ts">
interface SkeletonItem {
  class?: string
  style?: Record<string, string>
}

interface Props {
  type?: 'text' | 'card' | 'list' | 'table' | 'custom'
  lines?: number
  height?: string
  width?: string
  items?: SkeletonItem[]
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  lines: 3,
  height: '1rem',
  width: '100%',
  animated: true
})

const containerClass = computed(() => ({
  'skeleton-animated': props.animated,
  'space-y-2': props.type === 'text' || props.type === 'list',
  'space-y-4': props.type === 'card',
  'space-y-1': props.type === 'table'
}))

const items = computed(() => {
  if (props.items) {
    return props.items
  }

  switch (props.type) {
    case 'text':
      return Array.from({ length: props.lines }, (_, index) => ({
        class: 'skeleton-text',
        style: {
          height: props.height,
          width: index === props.lines - 1 ? '75%' : props.width
        }
      }))

    case 'card':
      return [
        {
          class: 'skeleton-image',
          style: { height: '12rem', width: '100%' }
        },
        {
          class: 'skeleton-title',
          style: { height: '1.5rem', width: '80%' }
        },
        {
          class: 'skeleton-text',
          style: { height: '1rem', width: '100%' }
        },
        {
          class: 'skeleton-text',
          style: { height: '1rem', width: '60%' }
        }
      ]

    case 'list':
      return Array.from({ length: props.lines }, () => ({
        class: 'skeleton-list-item',
        style: { height: '3rem', width: '100%' }
      }))

    case 'table':
      return Array.from({ length: props.lines }, () => ({
        class: 'skeleton-table-row',
        style: { height: '2.5rem', width: '100%' }
      }))

    default:
      return [{
        class: 'skeleton-custom',
        style: { height: props.height, width: props.width }
      }]
  }
})
</script>

<style scoped>
.skeleton-loader {
  padding: 0.5rem 0;
}

.skeleton-item {
  border-radius: 0.375rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
}

.skeleton-animated .skeleton-item {
  animation: skeleton-loading 1.5s infinite;
}

.dark .skeleton-item {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
}

.skeleton-text {
  height: 1rem;
}

.skeleton-title {
  height: 1.5rem;
}

.skeleton-image {
  height: 12rem;
  border-radius: 0.5rem;
}

.skeleton-list-item {
  height: 3rem;
  border-radius: 0.5rem;
}

.skeleton-table-row {
  height: 2.5rem;
  border-radius: 0.25rem;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
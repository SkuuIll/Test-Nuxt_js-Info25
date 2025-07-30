<template>
  <div v-if="show" class="loading-indicator" :class="[sizeClass, positionClass]">
    <div class="loading-spinner" :class="spinnerClass">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    <div v-if="message" class="loading-message" :class="messageClass">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
  message?: string
  size?: 'small' | 'medium' | 'large'
  position?: 'inline' | 'overlay' | 'fixed'
  color?: 'primary' | 'secondary' | 'white'
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  size: 'medium',
  position: 'inline',
  color: 'primary'
})

const sizeClass = computed(() => {
  const sizes = {
    small: 'loading-small',
    medium: 'loading-medium',
    large: 'loading-large'
  }
  return sizes[props.size]
})

const positionClass = computed(() => {
  const positions = {
    inline: 'loading-inline',
    overlay: 'loading-overlay',
    fixed: 'loading-fixed'
  }
  return positions[props.position]
})

const spinnerClass = computed(() => {
  const colors = {
    primary: 'spinner-primary',
    secondary: 'spinner-secondary',
    white: 'spinner-white'
  }
  return colors[props.color]
})

const messageClass = computed(() => {
  const colors = {
    primary: 'text-gray-700 dark:text-gray-300',
    secondary: 'text-gray-600 dark:text-gray-400',
    white: 'text-white'
  }
  return colors[props.color]
})
</script>

<style scoped>
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.loading-inline {
  padding: 1rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  z-index: 10;
}

.loading-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  z-index: 9999;
}

.dark .loading-overlay,
.dark .loading-fixed {
  background-color: rgba(0, 0, 0, 0.8);
}

.loading-spinner {
  position: relative;
  display: inline-block;
}

.loading-small .loading-spinner {
  width: 24px;
  height: 24px;
}

.loading-medium .loading-spinner {
  width: 40px;
  height: 40px;
}

.loading-large .loading-spinner {
  width: 64px;
  height: 64px;
}

.spinner-ring {
  position: absolute;
  border: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.loading-small .spinner-ring {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

.loading-medium .spinner-ring {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.loading-large .spinner-ring {
  width: 64px;
  height: 64px;
  border-width: 4px;
}

.spinner-primary .spinner-ring {
  border-top-color: #3b82f6;
  border-right-color: #3b82f6;
}

.spinner-secondary .spinner-ring {
  border-top-color: #6b7280;
  border-right-color: #6b7280;
}

.spinner-white .spinner-ring {
  border-top-color: #ffffff;
  border-right-color: #ffffff;
}

.spinner-ring:nth-child(1) {
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.15s;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-message {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
}

.loading-small .loading-message {
  font-size: 0.75rem;
}

.loading-large .loading-message {
  font-size: 1rem;
}

/* Skeleton loading animation */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.dark .skeleton {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
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
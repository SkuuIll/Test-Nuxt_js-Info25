<template>
  <transition
    name="error-message"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 transform -translate-y-2"
    enter-to-class="opacity-100 transform translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 transform translate-y-0"
    leave-to-class="opacity-0 transform -translate-y-2"
  >
    <div
      v-if="visible && (message || errors.length > 0)"
      class="error-message"
      :class="[
        `error-message--${variant}`,
        `error-message--${size}`,
        {
          'error-message--dismissible': dismissible,
          'error-message--with-icon': showIcon,
          'error-message--inline': inline
        }
      ]"
      role="alert"
      :aria-live="persistent ? 'polite' : 'assertive'"
    >
      <!-- Icon -->
      <div v-if="showIcon" class="error-message__icon">
        <component :is="iconComponent" class="error-message__icon-svg" />
      </div>
      
      <!-- Content -->
      <div class="error-message__content">
        <!-- Title -->
        <div v-if="title" class="error-message__title">
          {{ title }}
        </div>
        
        <!-- Single message -->
        <div v-if="message && !errors.length" class="error-message__text">
          {{ message }}
        </div>
        
        <!-- Multiple errors -->
        <div v-else-if="errors.length > 0" class="error-message__errors">
          <!-- Single error -->
          <div v-if="errors.length === 1" class="error-message__text">
            {{ errors[0].message || errors[0] }}
          </div>
          
          <!-- Multiple errors list -->
          <ul v-else class="error-message__list">
            <li
              v-for="(error, index) in errors"
              :key="index"
              class="error-message__list-item"
            >
              <span v-if="error.field" class="error-message__field">
                {{ formatFieldName(error.field) }}:
              </span>
              {{ error.message || error }}
            </li>
          </ul>
        </div>
        
        <!-- Actions -->
        <div v-if="actions.length > 0" class="error-message__actions">
          <button
            v-for="(action, index) in actions"
            :key="index"
            @click="handleAction(action)"
            class="error-message__action"
            :class="`error-message__action--${action.variant || 'default'}`"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
      
      <!-- Dismiss button -->
      <button
        v-if="dismissible"
        @click="dismiss"
        class="error-message__dismiss"
        aria-label="Cerrar mensaje de error"
      >
        <svg
          class="error-message__dismiss-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
interface ErrorItem {
  field?: string
  message: string
  code?: string
  value?: any
}

interface ActionItem {
  label: string
  action: () => void | Promise<void>
  variant?: 'default' | 'primary' | 'secondary'
}

interface Props {
  // Content
  message?: string
  errors?: (ErrorItem | string)[]
  title?: string
  
  // Appearance
  variant?: 'error' | 'warning' | 'info' | 'success'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  inline?: boolean
  
  // Behavior
  dismissible?: boolean
  persistent?: boolean
  autoHide?: boolean
  autoHideDelay?: number
  
  // Actions
  actions?: ActionItem[]
  
  // Field formatting
  fieldLabels?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'error',
  size: 'md',
  showIcon: true,
  inline: false,
  dismissible: true,
  persistent: false,
  autoHide: false,
  autoHideDelay: 5000,
  errors: () => [],
  actions: () => [],
  fieldLabels: () => ({})
})

const emit = defineEmits<{
  dismiss: []
  action: [action: ActionItem]
}>()

// State
const visible = ref(true)
const autoHideTimer = ref<NodeJS.Timeout | null>(null)

// Computed
const iconComponent = computed(() => {
  const icons = {
    error: 'IconError',
    warning: 'IconWarning',
    info: 'IconInfo',
    success: 'IconSuccess'
  }
  return icons[props.variant] || icons.error
})

// Methods
const dismiss = () => {
  visible.value = false
  emit('dismiss')
  
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
    autoHideTimer.value = null
  }
}

const handleAction = async (action: ActionItem) => {
  try {
    await action.action()
    emit('action', action)
  } catch (error) {
    console.error('Error executing action:', error)
  }
}

const formatFieldName = (field: string): string => {
  // Use custom label if provided
  if (props.fieldLabels[field]) {
    return props.fieldLabels[field]
  }
  
  // Convert snake_case to readable format
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const setupAutoHide = () => {
  if (props.autoHide && !props.persistent) {
    autoHideTimer.value = setTimeout(() => {
      dismiss()
    }, props.autoHideDelay)
  }
}

// Watchers
watch(() => [props.message, props.errors], () => {
  visible.value = true
  
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
    autoHideTimer.value = null
  }
  
  setupAutoHide()
}, { deep: true })

// Lifecycle
onMounted(() => {
  setupAutoHide()
})

onUnmounted(() => {
  if (autoHideTimer.value) {
    clearTimeout(autoHideTimer.value)
  }
})

// Icon components (inline for simplicity)
const IconError = {
  template: `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  `
}

const IconWarning = {
  template: `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  `
}

const IconInfo = {
  template: `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}

const IconSuccess = {
  template: `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `
}
</script>

<style scoped>
.error-message {
  @apply flex items-start gap-3 p-4 rounded-lg border;
  @apply transition-all duration-200 ease-in-out;
}

/* Variants */
.error-message--error {
  @apply bg-red-50 border-red-200 text-red-800;
}

.error-message--warning {
  @apply bg-yellow-50 border-yellow-200 text-yellow-800;
}

.error-message--info {
  @apply bg-blue-50 border-blue-200 text-blue-800;
}

.error-message--success {
  @apply bg-green-50 border-green-200 text-green-800;
}

/* Sizes */
.error-message--sm {
  @apply p-3 text-sm;
}

.error-message--md {
  @apply p-4 text-base;
}

.error-message--lg {
  @apply p-5 text-lg;
}

/* Inline variant */
.error-message--inline {
  @apply p-2 text-sm border-0 bg-transparent;
}

.error-message--inline.error-message--error {
  @apply text-red-600;
}

.error-message--inline.error-message--warning {
  @apply text-yellow-600;
}

.error-message--inline.error-message--info {
  @apply text-blue-600;
}

.error-message--inline.error-message--success {
  @apply text-green-600;
}

/* Icon */
.error-message__icon {
  @apply flex-shrink-0 mt-0.5;
}

.error-message--error .error-message__icon {
  @apply text-red-500;
}

.error-message--warning .error-message__icon {
  @apply text-yellow-500;
}

.error-message--info .error-message__icon {
  @apply text-blue-500;
}

.error-message--success .error-message__icon {
  @apply text-green-500;
}

.error-message__icon-svg {
  @apply w-5 h-5;
}

.error-message--sm .error-message__icon-svg {
  @apply w-4 h-4;
}

.error-message--lg .error-message__icon-svg {
  @apply w-6 h-6;
}

/* Content */
.error-message__content {
  @apply flex-1 min-w-0;
}

.error-message__title {
  @apply font-semibold mb-1;
}

.error-message--sm .error-message__title {
  @apply text-sm;
}

.error-message--lg .error-message__title {
  @apply text-lg;
}

.error-message__text {
  @apply leading-relaxed;
}

.error-message__errors {
  @apply space-y-1;
}

.error-message__list {
  @apply list-none space-y-1 ml-0 pl-0;
}

.error-message__list-item {
  @apply flex items-start gap-2;
}

.error-message__list-item::before {
  content: '•';
  @apply text-current opacity-60 flex-shrink-0 mt-0.5;
}

.error-message__field {
  @apply font-medium;
}

/* Actions */
.error-message__actions {
  @apply flex gap-2 mt-3 flex-wrap;
}

.error-message__action {
  @apply px-3 py-1 text-sm font-medium rounded-md transition-colors;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.error-message__action--default {
  @apply bg-white border border-current text-current;
  @apply hover:bg-gray-50;
}

.error-message--error .error-message__action--default {
  @apply hover:bg-red-100 focus:ring-red-500;
}

.error-message--warning .error-message__action--default {
  @apply hover:bg-yellow-100 focus:ring-yellow-500;
}

.error-message--info .error-message__action--default {
  @apply hover:bg-blue-100 focus:ring-blue-500;
}

.error-message--success .error-message__action--default {
  @apply hover:bg-green-100 focus:ring-green-500;
}

.error-message__action--primary {
  @apply text-white;
}

.error-message--error .error-message__action--primary {
  @apply bg-red-600 hover:bg-red-700 focus:ring-red-500;
}

.error-message--warning .error-message__action--primary {
  @apply bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500;
}

.error-message--info .error-message__action--primary {
  @apply bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.error-message--success .error-message__action--primary {
  @apply bg-green-600 hover:bg-green-700 focus:ring-green-500;
}

/* Dismiss button */
.error-message__dismiss {
  @apply flex-shrink-0 p-1 rounded-md transition-colors;
  @apply hover:bg-black hover:bg-opacity-10;
  @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.error-message--error .error-message__dismiss {
  @apply text-red-500 focus:ring-red-500;
}

.error-message--warning .error-message__dismiss {
  @apply text-yellow-500 focus:ring-yellow-500;
}

.error-message--info .error-message__dismiss {
  @apply text-blue-500 focus:ring-blue-500;
}

.error-message--success .error-message__dismiss {
  @apply text-green-500 focus:ring-green-500;
}

.error-message__dismiss-icon {
  @apply w-4 h-4;
}

/* Responsive */
@media (max-width: 640px) {
  .error-message {
    @apply p-3;
  }
  
  .error-message__actions {
    @apply flex-col;
  }
  
  .error-message__action {
    @apply w-full justify-center;
  }
}
</style>
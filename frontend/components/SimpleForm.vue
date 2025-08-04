<template>
  <form @submit.prevent="handleSubmit" class="simple-form space-y-6">
    <slot 
      :form="form" 
      :loading="loading" 
      :errors="errors"
      :setField="setField"
      :getError="getError"
      :hasError="hasError"
    />
    
    <div class="form-actions flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <button
        v-if="showCancel"
        type="button"
        @click="handleCancel"
        :disabled="loading"
        class="btn btn-secondary"
      >
        {{ cancelText }}
      </button>
      
      <button
        v-if="showDraft && isDraftable"
        type="button"
        @click="handleDraft"
        :disabled="loading"
        class="btn btn-outline"
      >
        <Icon v-if="loading && actionType === 'draft'" name="loading" class="w-4 h-4 animate-spin mr-2" />
        {{ draftText }}
      </button>
      
      <button
        type="submit"
        :disabled="loading || !isValid"
        class="btn btn-primary"
      >
        <Icon v-if="loading && actionType === 'submit'" name="loading" class="w-4 h-4 animate-spin mr-2" />
        {{ loading && actionType === 'submit' ? loadingText : submitText }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
interface Props {
  initialData?: Record<string, any>
  submitText?: string
  loadingText?: string
  cancelText?: string
  draftText?: string
  showCancel?: boolean
  showDraft?: boolean
  isDraftable?: boolean
  validationRules?: Record<string, (value: any) => string | null>
}

const props = withDefaults(defineProps<Props>(), {
  submitText: 'Guardar',
  loadingText: 'Guardando...',
  cancelText: 'Cancelar',
  draftText: 'Guardar Borrador',
  showCancel: true,
  showDraft: false,
  isDraftable: false,
  initialData: () => ({}),
  validationRules: () => ({})
})

const emit = defineEmits<{
  submit: [data: Record<string, any>]
  draft: [data: Record<string, any>]
  cancel: []
}>()

// State
const loading = ref(false)
const actionType = ref<'submit' | 'draft' | null>(null)
const form = reactive({ ...props.initialData })
const errors = reactive<Record<string, string>>({})

// Computed
const isValid = computed(() => {
  return Object.keys(errors).length === 0
})

// Methods
const setField = (field: string, value: any) => {
  form[field] = value
  validateField(field)
}

const validateField = (field: string) => {
  const rule = props.validationRules[field]
  if (rule) {
    const error = rule(form[field])
    if (error) {
      errors[field] = error
    } else {
      delete errors[field]
    }
  }
}

const validateAll = () => {
  Object.keys(props.validationRules).forEach(field => {
    validateField(field)
  })
}

const getError = (field: string) => {
  return errors[field] || null
}

const hasError = (field: string) => {
  return !!errors[field]
}

const handleSubmit = async () => {
  validateAll()
  if (!isValid.value) return
  
  try {
    loading.value = true
    actionType.value = 'submit'
    emit('submit', { ...form })
  } finally {
    loading.value = false
    actionType.value = null
  }
}

const handleDraft = async () => {
  try {
    loading.value = true
    actionType.value = 'draft'
    emit('draft', { ...form })
  } finally {
    loading.value = false
    actionType.value = null
  }
}

const handleCancel = () => {
  emit('cancel')
}

// Watch for initial data changes
watch(() => props.initialData, (newData) => {
  Object.assign(form, newData)
}, { deep: true })

// Validate on mount
onMounted(() => {
  validateAll()
})
</script>

<style scoped>
.simple-form {
  @apply max-w-none;
}

.form-actions {
  @apply sticky bottom-0 bg-white dark:bg-gray-800 p-4 -mx-4 -mb-4;
}
</style>
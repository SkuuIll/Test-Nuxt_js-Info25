<template>
  <div class="markdown-editor">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <!-- Toolbar -->
    <div class="border border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-2 flex flex-wrap gap-1">
      <button
        v-for="tool in tools"
        :key="tool.name"
        type="button"
        @click="insertMarkdown(tool.before, tool.after)"
        class="px-2 py-1 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
        :title="tool.title"
      >
        {{ tool.icon }}
      </button>
    </div>
    
    <!-- Editor -->
    <textarea
      ref="textareaRef"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :rows="rows"
      :class="[
        'w-full px-3 py-2 border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none',
        errorClass
      ]"
      :placeholder="placeholder"
    ></textarea>
    
    <!-- Error Message -->
    <p v-if="error" class="text-red-500 text-sm mt-1">
      {{ error }}
    </p>
    
    <!-- Help Text -->
    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
      Puedes usar Markdown para formatear el contenido. 
      <a href="https://www.markdownguide.org/basic-syntax/" target="_blank" class="text-primary-600 hover:text-primary-700">
        Guía de Markdown
      </a>
    </p>
  </div>
</template>

<script setup lang="ts">
interface Tool {
  name: string
  icon: string
  title: string
  before: string
  after?: string
}

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  rows?: number
  required?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Contenido',
  placeholder: 'Escribe tu contenido aquí...',
  rows: 15,
  required: false,
  error: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement>()

const errorClass = computed(() => {
  return props.error ? 'border-red-500' : ''
})

const tools: Tool[] = [
  { name: 'bold', icon: '𝐁', title: 'Negrita', before: '**', after: '**' },
  { name: 'italic', icon: '𝐼', title: 'Cursiva', before: '*', after: '*' },
  { name: 'heading1', icon: 'H1', title: 'Título 1', before: '# ' },
  { name: 'heading2', icon: 'H2', title: 'Título 2', before: '## ' },
  { name: 'heading3', icon: 'H3', title: 'Título 3', before: '### ' },
  { name: 'link', icon: '🔗', title: 'Enlace', before: '[texto](', after: ')' },
  { name: 'image', icon: '🖼️', title: 'Imagen', before: '![alt](', after: ')' },
  { name: 'code', icon: '</>', title: 'Código', before: '`', after: '`' },
  { name: 'codeblock', icon: '{ }', title: 'Bloque de código', before: '```\n', after: '\n```' },
  { name: 'quote', icon: '❝', title: 'Cita', before: '> ' },
  { name: 'list', icon: '•', title: 'Lista', before: '- ' },
  { name: 'numberedlist', icon: '1.', title: 'Lista numerada', before: '1. ' },
  { name: 'hr', icon: '—', title: 'Línea horizontal', before: '\n---\n' }
]

const insertMarkdown = (before: string, after: string = '') => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = props.modelValue.substring(start, end)
  
  let newText: string
  
  if (after) {
    // For wrapping text (bold, italic, etc.)
    newText = props.modelValue.substring(0, start) + 
              before + selectedText + after + 
              props.modelValue.substring(end)
    
    // Set cursor position
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    })
  } else {
    // For prefixes (headings, lists, etc.)
    const lines = props.modelValue.split('\n')
    const startLine = props.modelValue.substring(0, start).split('\n').length - 1
    const endLine = props.modelValue.substring(0, end).split('\n').length - 1
    
    for (let i = startLine; i <= endLine; i++) {
      if (lines[i] !== undefined) {
        lines[i] = before + lines[i]
      }
    }
    
    newText = lines.join('\n')
    
    // Set cursor position
    nextTick(() => {
      textarea.focus()
      const newStart = start + before.length
      textarea.setSelectionRange(newStart, newStart)
    })
  }
  
  emit('update:modelValue', newText)
}
</script>

<style scoped>
.markdown-editor {
  @apply w-full;
}
</style>
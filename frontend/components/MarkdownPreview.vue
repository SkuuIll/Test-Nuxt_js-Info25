<template>
  <div class="markdown-preview">
    <div class="prose prose-sm max-w-none dark:prose-invert" v-html="renderedContent"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content: string
}

const props = defineProps<Props>()

const renderedContent = computed(() => {
  if (!props.content) return '<p class="text-gray-500 italic">Vista previa aparecerá aquí...</p>'
  
  // Simple Markdown to HTML conversion
  let html = props.content
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full h-auto" />')
    // Line breaks
    .replace(/\n/gim, '<br>')
    // Quotes
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
    // Horizontal rule
    .replace(/^---$/gim, '<hr>')
  
  return html
})
</script>

<style scoped>
.markdown-preview {
  @apply p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700;
}

.prose {
  @apply text-gray-900 dark:text-gray-100;
}

.prose h1 {
  @apply text-2xl font-bold mb-4;
}

.prose h2 {
  @apply text-xl font-bold mb-3;
}

.prose h3 {
  @apply text-lg font-bold mb-2;
}

.prose p {
  @apply mb-3;
}

.prose blockquote {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400;
}

.prose code {
  @apply bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm;
}

.prose a {
  @apply text-primary-600 hover:text-primary-700 underline;
}

.prose ul, .prose ol {
  @apply ml-6 mb-3;
}

.prose li {
  @apply mb-1;
}

.prose hr {
  @apply my-6 border-gray-300 dark:border-gray-600;
}
</style>
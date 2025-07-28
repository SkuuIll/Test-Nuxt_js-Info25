<template>
  <div
    v-if="headings.length > 0"
    class="sticky top-24"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <Icon
          name="list"
          class="w-5 h-5 mr-2"
        />
        Tabla de Contenidos
      </h3>
      
      <nav class="space-y-1">
        <a
          v-for="heading in headings"
          :key="heading.id"
          :href="`#${heading.id}`"
          :class="[
            'block py-2 px-3 text-sm rounded-md transition-colors duration-200',
            heading.level === 2 ? 'font-medium' : 'font-normal ml-4',
            heading.level === 4 ? 'ml-8' : '',
            heading.level === 5 ? 'ml-12' : '',
            heading.level === 6 ? 'ml-16' : '',
            activeHeading === heading.id
              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
          @click="scrollToHeading(heading.id)"
        >
          {{ heading.text }}
        </a>
      </nav>
      
      <!-- Reading Progress -->
      <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progreso de lectura</span>
          <span>{{ Math.round(readingProgress) }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-primary-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${readingProgress}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Heading {
  id: string
  text: string
  level: number
}

interface Props {
  content?: string
}

const props = defineProps<Props>()

const headings = ref<Heading[]>([])
const activeHeading = ref<string>('')
const readingProgress = ref(0)

const generateTableOfContents = () => {
  if (!props.content) return
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = props.content
  
  const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const extractedHeadings: Heading[] = []
  
  headingElements.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1))
    const text = heading.textContent?.trim() || ''
    const id = heading.id || `heading-${index}`
    
    // Ensure the heading has an ID for navigation
    if (!heading.id) {
      heading.id = id
    }
    
    extractedHeadings.push({
      id,
      text,
      level
    })
  })
  
  headings.value = extractedHeadings
}

const scrollToHeading = (headingId: string) => {
  const element = document.getElementById(headingId)
  if (element) {
    const offset = 100 // Account for fixed header
    const elementPosition = element.offsetTop - offset
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }
}

const updateActiveHeading = () => {
  const headingElements = headings.value.map(h => document.getElementById(h.id)).filter(Boolean)
  const scrollTop = window.scrollY + 120 // Account for header height
  
  let currentHeading = ''
  
  for (const element of headingElements) {
    if (element && element.offsetTop <= scrollTop) {
      currentHeading = element.id
    } else {
      break
    }
  }
  
  activeHeading.value = currentHeading
}

const updateReadingProgress = () => {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  const scrollPercent = (scrollTop / docHeight) * 100
  
  readingProgress.value = Math.min(Math.max(scrollPercent, 0), 100)
}

const handleScroll = () => {
  updateActiveHeading()
  updateReadingProgress()
}

// Watch for content changes
watch(() => props.content, () => {
  nextTick(() => {
    generateTableOfContents()
  })
}, { immediate: true })

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // Initial calculation
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
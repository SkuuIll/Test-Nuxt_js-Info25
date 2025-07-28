<template>
  <div class="flex items-center space-x-3">
    <span
      v-if="showLabel"
      class="text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      Compartir:
    </span>
    
    <div class="flex items-center space-x-2">
      <!-- Twitter -->
      <button
        class="social-btn bg-blue-500 hover:bg-blue-600"
        title="Compartir en Twitter"
        @click="shareOnTwitter"
      >
        <Icon
          name="twitter"
          class="w-4 h-4"
        />
      </button>
      
      <!-- Facebook -->
      <button
        class="social-btn bg-blue-600 hover:bg-blue-700"
        title="Compartir en Facebook"
        @click="shareOnFacebook"
      >
        <Icon
          name="facebook"
          class="w-4 h-4"
        />
      </button>
      
      <!-- LinkedIn -->
      <button
        class="social-btn bg-blue-700 hover:bg-blue-800"
        title="Compartir en LinkedIn"
        @click="shareOnLinkedIn"
      >
        <Icon
          name="linkedin"
          class="w-4 h-4"
        />
      </button>
      
      <!-- WhatsApp -->
      <button
        class="social-btn bg-green-500 hover:bg-green-600"
        title="Compartir en WhatsApp"
        @click="shareOnWhatsApp"
      >
        <Icon
          name="whatsapp"
          class="w-4 h-4"
        />
      </button>
      
      <!-- Copy Link -->
      <button
        class="social-btn bg-gray-500 hover:bg-gray-600"
        title="Copiar enlace"
        @click="copyLink"
      >
        <Icon
          name="link"
          class="w-4 h-4"
        />
      </button>
      
      <!-- Email -->
      <button
        class="social-btn bg-gray-600 hover:bg-gray-700"
        title="Compartir por email"
        @click="shareByEmail"
      >
        <Icon
          name="mail"
          class="w-4 h-4"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  url?: string
  title?: string
  description?: string
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  url: '',
  title: '',
  description: '',
  showLabel: true
})

const { handleSuccess, handleError } = useErrorHandler()

const currentUrl = computed(() => {
  if (props.url) return props.url
  if (process.client) return window.location.href
  return ''
})

const encodedUrl = computed(() => encodeURIComponent(currentUrl.value))
const encodedTitle = computed(() => encodeURIComponent(props.title))
const encodedDescription = computed(() => encodeURIComponent(props.description))

const shareOnTwitter = () => {
  const text = props.title ? `${props.title} ${currentUrl.value}` : currentUrl.value
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
  openShareWindow(url)
}

const shareOnFacebook = () => {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl.value}`
  openShareWindow(url)
}

const shareOnLinkedIn = () => {
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl.value}&title=${encodedTitle.value}&summary=${encodedDescription.value}`
  openShareWindow(url)
}

const shareOnWhatsApp = () => {
  const text = props.title ? `${props.title} ${currentUrl.value}` : currentUrl.value
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  openShareWindow(url)
}

const shareByEmail = () => {
  const subject = props.title || 'Artículo interesante'
  const body = props.description 
    ? `${props.description}\n\nLeer más: ${currentUrl.value}`
    : `Te comparto este artículo interesante: ${currentUrl.value}`
  
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = url
}

const copyLink = async () => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(currentUrl.value)
      handleSuccess('Enlace copiado al portapapeles')
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = currentUrl.value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      handleSuccess('Enlace copiado al portapapeles')
    }
  } catch (error) {
    handleError('Error al copiar el enlace')
  }
}

const openShareWindow = (url: string) => {
  const width = 600
  const height = 400
  const left = (window.innerWidth - width) / 2
  const top = (window.innerHeight - height) / 2
  
  window.open(
    url,
    'share',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  )
}

// Native Web Share API (if available)
const nativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.title,
        text: props.description,
        url: currentUrl.value
      })
    } catch (error) {
      // User cancelled or error occurred
      console.log('Share cancelled or failed:', error)
    }
  }
}

// Use native share on mobile if available
const handleShare = () => {
  if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    nativeShare()
  }
}
</script>

<style scoped>
.social-btn {
  @apply inline-flex items-center justify-center w-8 h-8 rounded-full text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900;
}
</style>
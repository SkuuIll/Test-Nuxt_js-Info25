<template>
  <footer class="bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Brand Section -->
        <div class="lg:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <Icon
              name="newspaper"
              class="w-8 h-8 text-primary-400"
            />
            <span class="text-2xl font-bold">Blog de Noticias</span>
          </div>
          <p class="text-gray-300 mb-6 max-w-md">
            Tu fuente confiable de información actualizada y relevante. 
            Conectamos historias que importan con las personas que las necesitan.
          </p>
          
          <!-- Social Links -->
          <div class="flex space-x-4">
            <a
              href="#"
              class="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors duration-200"
              title="Facebook"
            >
              <Icon
                name="facebook"
                class="w-5 h-5"
              />
            </a>
            <a
              href="#"
              class="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors duration-200"
              title="Twitter"
            >
              <Icon
                name="twitter"
                class="w-5 h-5"
              />
            </a>
            <a
              href="#"
              class="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors duration-200"
              title="Instagram"
            >
              <Icon
                name="instagram"
                class="w-5 h-5"
              />
            </a>
            <a
              href="#"
              class="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors duration-200"
              title="LinkedIn"
            >
              <Icon
                name="linkedin"
                class="w-5 h-5"
              />
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-lg font-semibold mb-4">
            Enlaces Rápidos
          </h3>
          <ul class="space-y-2">
            <li>
              <NuxtLink
                to="/"
                class="text-gray-300 hover:text-primary-400 transition-colors duration-200"
              >
                Inicio
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/posts"
                class="text-gray-300 hover:text-primary-400 transition-colors duration-200"
              >
                Todos los Posts
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/about"
                class="text-gray-300 hover:text-primary-400 transition-colors duration-200"
              >
                Acerca de
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/contact"
                class="text-gray-300 hover:text-primary-400 transition-colors duration-200"
              >
                Contacto
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/privacy"
                class="text-gray-300 hover:text-primary-400 transition-colors duration-200"
              >
                Privacidad
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Categories -->
        <div>
          <h3 class="text-lg font-semibold mb-4">
            Categorías
          </h3>
          <ul class="space-y-2">
            <li
              v-for="category in (categories || []).slice(0, 6)"
              :key="category?.id || category?.slug"
            >
              <NuxtLink 
                :to="`/category/${category?.slug || ''}`" 
                class="text-gray-300 hover:text-primary-400 transition-colors duration-200 flex items-center justify-between"
              >
                <span>{{ category?.name || 'Sin nombre' }}</span>
                <span class="text-xs bg-gray-800 px-2 py-1 rounded">{{ category?.posts_count || 0 }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Newsletter Section -->
      <div class="border-t border-gray-800 mt-8 pt-8">
        <div class="max-w-md mx-auto text-center">
          <h3 class="text-lg font-semibold mb-2">
            Mantente Informado
          </h3>
          <p class="text-gray-300 mb-4">
            Recibe las últimas noticias directamente en tu bandeja de entrada
          </p>
          <form
            class="flex space-x-2"
            @submit.prevent="subscribeNewsletter"
          >
            <input
              v-model="newsletterEmail"
              type="email"
              placeholder="Tu dirección de email"
              required
              class="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-gray-400"
              :disabled="newsletterLoading"
            >
            <button
              type="submit"
              class="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="newsletterLoading"
            >
              <span v-if="newsletterLoading">...</span>
              <span v-else>Suscribirse</span>
            </button>
          </form>
          <p class="text-xs text-gray-400 mt-2">
            No spam, solo contenido de calidad. Puedes cancelar en cualquier momento.
          </p>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
        <div class="text-gray-400 text-sm mb-4 md:mb-0">
          © {{ currentYear }} Blog de Noticias. Todos los derechos reservados.
        </div>
        
        <div class="flex items-center space-x-6 text-sm text-gray-400">
          <NuxtLink
            to="/terms"
            class="hover:text-primary-400 transition-colors duration-200"
          >
            Términos de Uso
          </NuxtLink>
          <NuxtLink
            to="/privacy"
            class="hover:text-primary-400 transition-colors duration-200"
          >
            Política de Privacidad
          </NuxtLink>
          <NuxtLink
            to="/cookies"
            class="hover:text-primary-400 transition-colors duration-200"
          >
            Cookies
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const blogStore = useBlogStore()
const { $toast } = useNuxtApp()

// Reactive state
const newsletterEmail = ref('')
const newsletterLoading = ref(false)

// Computed
const categories = computed(() => blogStore.categories)
const currentYear = computed(() => new Date().getFullYear())

// Methods
const subscribeNewsletter = async () => {
  if (!newsletterEmail.value.trim()) return

  try {
    newsletterLoading.value = true
    const api = useApi()
    await api.subscribeNewsletter(newsletterEmail.value)
    
    $toast.success('¡Suscripción exitosa! Revisa tu email.')
    newsletterEmail.value = ''
  } catch (error: any) {
    $toast.error(error.message || 'Error al suscribirse. Intenta de nuevo.')
  } finally {
    newsletterLoading.value = false
  }
}
</script>
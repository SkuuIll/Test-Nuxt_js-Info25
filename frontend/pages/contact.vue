<template>
  <div class="container mx-auto px-4 py-8">
    <Breadcrumbs :items="[{ name: 'Contacto' }]" />

    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-8">Contacto</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Contact Form -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Envíanos un mensaje
          </h2>

          <form @submit.prevent="submitForm">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="input w-full"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  class="input w-full"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asunto *
                </label>
                <input
                  v-model="form.subject"
                  type="text"
                  required
                  class="input w-full"
                  placeholder="Asunto de tu mensaje"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mensaje *
                </label>
                <textarea
                  v-model="form.message"
                  required
                  rows="6"
                  class="input w-full"
                  placeholder="Escribe tu mensaje aquí..."
                />
              </div>
            </div>

            <div class="mt-6">
              <button type="submit" :disabled="loading" class="btn btn-primary w-full">
                <Icon v-if="loading" name="loading" class="w-4 h-4 animate-spin mr-2" />
                {{ loading ? 'Enviando...' : 'Enviar Mensaje' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Contact Info -->
        <div class="space-y-6">
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Información de Contacto
            </h3>

            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <Icon name="mail" class="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Email</p>
                  <p class="text-gray-600 dark:text-gray-400">contacto@blogdenoticias.com</p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="phone" class="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Teléfono</p>
                  <p class="text-gray-600 dark:text-gray-400">+54 11 1234-5678</p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="map-pin" class="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Dirección</p>
                  <p class="text-gray-600 dark:text-gray-400">Buenos Aires, Argentina</p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="clock" class="w-5 h-5 text-primary-600 mt-0.5" />
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">Horario de Atención</p>
                  <p class="text-gray-600 dark:text-gray-400">
                    Lunes a Viernes: 9:00 - 18:00<br />
                    Sábados: 9:00 - 14:00
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Social Media -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Síguenos</h3>

            <div class="flex space-x-4">
              <a
                href="#"
                class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Icon name="facebook" class="w-5 h-5" />
              </a>
              <a
                href="#"
                class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-400 text-white hover:bg-blue-500 transition-colors"
              >
                <Icon name="twitter" class="w-5 h-5" />
              </a>
              <a
                href="#"
                class="flex items-center justify-center w-10 h-10 rounded-full bg-pink-600 text-white hover:bg-pink-700 transition-colors"
              >
                <Icon name="instagram" class="w-5 h-5" />
              </a>
              <a
                href="#"
                class="flex items-center justify-center w-10 h-10 rounded-full bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                <Icon name="linkedin" class="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { handleSuccess, handleError } = useErrorHandler()

const loading = ref(false)
const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const submitForm = async () => {
  try {
    loading.value = true

    // Here you would typically send the form data to your API
    // For now, we'll just simulate a successful submission
    await new Promise(resolve => setTimeout(resolve, 1000))

    handleSuccess('Mensaje enviado correctamente. Te responderemos pronto.')

    // Reset form
    form.name = ''
    form.email = ''
    form.subject = ''
    form.message = ''
  } catch (error) {
    handleError('Error al enviar el mensaje. Intenta de nuevo.')
  } finally {
    loading.value = false
  }
}

// SEO
useHead({
  title: 'Contacto - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content: 'Ponte en contacto con nosotros. Envíanos tus comentarios, sugerencias o consultas.',
    },
  ],
})
</script>
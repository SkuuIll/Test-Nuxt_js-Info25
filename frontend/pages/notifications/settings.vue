<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Configuración de Notificaciones
      </h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Personaliza cómo y cuándo recibes notificaciones
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse space-y-6">
      <div v-for="i in 4" :key="i" class="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div class="space-y-3">
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Settings Form -->
    <form v-else @submit.prevent="handleSave" class="space-y-6">
      <!-- General Settings -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Configuración General
        </h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Notificaciones en la aplicación
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Recibe notificaciones dentro de la aplicación
              </p>
            </div>
            <toggle-switch
              v-model="form.in_app_notifications"
              :disabled="saving"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Notificaciones por email
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Recibe notificaciones en tu correo electrónico
              </p>
            </div>
            <toggle-switch
              v-model="form.email_notifications"
              :disabled="saving"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Notificaciones push del navegador
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Recibe notificaciones push en tu navegador
              </p>
            </div>
            <toggle-switch
              v-model="form.push_notifications"
              :disabled="saving"
            />
          </div>
        </div>
      </div>

      <!-- Content Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notificaciones de Contenido
        </h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Nuevos comentarios
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cuando alguien comenta en tus posts
              </p>
            </div>
            <toggle-switch
              v-model="form.notify_comments"
              :disabled="saving"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Respuestas a comentarios
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cuando alguien responde a tus comentarios
              </p>
            </div>
            <toggle-switch
              v-model="form.notify_comment_replies"
              :disabled="saving"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Posts destacados
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cuando tus posts son destacados
              </p>
            </div>
            <toggle-switch
              v-model="form.notify_post_featured"
              :disabled="saving"
            />
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Moderación de contenido
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Cuando tu contenido es aprobado o rechazado
              </p>
            </div>
            <toggle-switch
              v-model="form.notify_content_moderation"
              :disabled="saving"
            />
          </div>
        </div>
      </div>

      <!-- System Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notificaciones del Sistema
        </h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Anuncios del sistema
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Anuncios importantes y actualizaciones
              </p>
            </div>
            <toggle-switch
              v-model="form.notify_system_announcements"
              :disabled="saving"
            />
          </div>
          
          <!-- Admin-only notifications -->
          <template v-if="user?.is_staff">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white">
                  Nuevos usuarios
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Cuando se registran nuevos usuarios
                </p>
              </div>
              <toggle-switch
                v-model="form.notify_user_registrations"
                :disabled="saving"
              />
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white">
                  Moderación requerida
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Cuando el contenido requiere moderación
                </p>
              </div>
              <toggle-switch
                v-model="form.notify_moderation_required"
                :disabled="saving"
              />
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-900 dark:text-white">
                  Posts publicados
                </label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Cuando se publican nuevos posts
                </p>
              </div>
              <toggle-switch
                v-model="form.notify_post_published"
                :disabled="saving"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Quiet Hours -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Horario de Silencio
        </h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-900 dark:text-white">
                Activar horario de silencio
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                No recibir notificaciones durante ciertas horas
              </p>
            </div>
            <toggle-switch
              v-model="form.quiet_hours_enabled"
              :disabled="saving"
            />
          </div>
          
          <div v-if="form.quiet_hours_enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de inicio
              </label>
              <input
                v-model="form.quiet_hours_start"
                type="time"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                :disabled="saving"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora de fin
              </label>
              <input
                v-model="form.quiet_hours_end"
                type="time"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                :disabled="saving"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Email Digest -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Resumen por Email
        </h2>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Frecuencia del resumen
          </label>
          <select
            v-model="form.digest_frequency"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            :disabled="saving"
          >
            <option value="never">Nunca</option>
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Recibe un resumen de tus notificaciones por email
          </p>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="saving" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
          </span>
          <span v-else>Guardar Configuración</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { NotificationPreferences } from '~/types/notifications'

// Meta
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Composables
const { user } = useAuthStore()
const { preferences, loading, fetchPreferences, updatePreferences } = useNotifications()
const { showToast } = useToast()

// State
const saving = ref(false)
const form = ref<Partial<NotificationPreferences>>({
  email_notifications: true,
  push_notifications: true,
  in_app_notifications: true,
  notify_comments: true,
  notify_comment_replies: true,
  notify_post_likes: true,
  notify_user_follows: true,
  notify_post_featured: true,
  notify_content_moderation: true,
  notify_system_announcements: true,
  notify_user_registrations: false,
  notify_moderation_required: false,
  notify_post_published: false,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  digest_frequency: 'weekly'
})

// Methods
const handleSave = async () => {
  try {
    saving.value = true
    
    await updatePreferences(form.value)
    
    showToast({
      title: 'Configuración guardada',
      message: 'Tus preferencias de notificación han sido actualizadas',
      type: 'success'
    })
  } catch (error) {
    showToast({
      title: 'Error',
      message: 'No se pudo guardar la configuración',
      type: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Initialize
onMounted(async () => {
  await fetchPreferences()
  
  if (preferences.value) {
    form.value = { ...preferences.value }
  }
})

// Watch for preferences changes
watch(preferences, (newPreferences) => {
  if (newPreferences) {
    form.value = { ...newPreferences }
  }
}, { deep: true })
</script>

<style scoped>
/* Custom toggle switch component styles will be added when we create the component */
</style>
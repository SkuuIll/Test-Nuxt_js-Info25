<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Acceso al Dashboard
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-400">
            Información sobre cómo acceder al panel de administración
          </p>
        </div>

        <!-- Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- For Authenticated Admin Users -->
          <div v-if="isAuthenticated && user?.is_staff" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <div class="flex items-center space-x-3 mb-4">
              <Icon name="check-circle" class="w-8 h-8 text-green-600" />
              <h2 class="text-2xl font-semibold text-green-900 dark:text-green-100">
                ¡Tienes Acceso!
              </h2>
            </div>
            
            <p class="text-green-800 dark:text-green-200 mb-6">
              Como usuario administrador, puedes acceder al dashboard desde varios lugares:
            </p>

            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <Icon name="cursor-click" class="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 class="font-medium text-green-900 dark:text-green-100">Menú de Usuario</h3>
                  <p class="text-sm text-green-700 dark:text-green-300">
                    Haz clic en tu avatar en la esquina superior derecha y selecciona "Dashboard"
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="lightning-bolt" class="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 class="font-medium text-green-900 dark:text-green-100">Acceso Rápido</h3>
                  <p class="text-sm text-green-700 dark:text-green-300">
                    Usa el botón "Dashboard" en la barra de navegación superior
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="link" class="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 class="font-medium text-green-900 dark:text-green-100">URL Directa</h3>
                  <p class="text-sm text-green-700 dark:text-green-300">
                    Navega directamente a <code class="bg-green-100 dark:bg-green-800 px-1 rounded">/dashboard</code>
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-green-200 dark:border-green-800">
              <NuxtLink 
                to="/dashboard" 
                class="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Icon name="settings" class="w-5 h-5" />
                <span>Ir al Dashboard Ahora</span>
              </NuxtLink>
            </div>
          </div>

          <!-- For Authenticated Non-Admin Users -->
          <div v-else-if="isAuthenticated && !user?.is_staff" class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <div class="flex items-center space-x-3 mb-4">
              <Icon name="exclamation" class="w-8 h-8 text-yellow-600" />
              <h2 class="text-2xl font-semibold text-yellow-900 dark:text-yellow-100">
                Acceso Restringido
              </h2>
            </div>
            
            <p class="text-yellow-800 dark:text-yellow-200 mb-4">
              Tu cuenta actual no tiene permisos de administrador para acceder al dashboard.
            </p>

            <div class="space-y-3">
              <div class="flex items-start space-x-3">
                <Icon name="user" class="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 class="font-medium text-yellow-900 dark:text-yellow-100">Tu Cuenta</h3>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300">
                    Usuario: {{ user?.username }} ({{ user?.email }})
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="shield-check" class="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 class="font-medium text-yellow-900 dark:text-yellow-100">Permisos Necesarios</h3>
                  <p class="text-sm text-yellow-700 dark:text-yellow-300">
                    Se requieren permisos de staff/administrador para acceder al dashboard
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-yellow-200 dark:border-yellow-800">
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                Si necesitas acceso administrativo, contacta con el administrador del sistema.
              </p>
            </div>
          </div>

          <!-- For Non-Authenticated Users -->
          <div v-else class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <div class="flex items-center space-x-3 mb-4">
              <Icon name="login" class="w-8 h-8 text-blue-600" />
              <h2 class="text-2xl font-semibold text-blue-900 dark:text-blue-100">
                Inicia Sesión
              </h2>
            </div>
            
            <p class="text-blue-800 dark:text-blue-200 mb-6">
              Necesitas iniciar sesión con una cuenta de administrador para acceder al dashboard.
            </p>

            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <Icon name="key" class="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 class="font-medium text-blue-900 dark:text-blue-100">Credenciales de Admin</h3>
                  <p class="text-sm text-blue-700 dark:text-blue-300">
                    Usa una cuenta con permisos de administrador
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="shield-check" class="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 class="font-medium text-blue-900 dark:text-blue-100">Acceso Automático</h3>
                  <p class="text-sm text-blue-700 dark:text-blue-300">
                    Una vez autenticado, el dashboard aparecerá en tu menú de usuario
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
              <NuxtLink 
                to="/login" 
                class="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Icon name="login" class="w-5 h-5" />
                <span>Iniciar Sesión</span>
              </NuxtLink>
            </div>
          </div>

          <!-- General Information -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              ¿Qué es el Dashboard?
            </h2>
            
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              El dashboard es el panel de administración donde los usuarios autorizados pueden:
            </p>

            <div class="space-y-3">
              <div class="flex items-start space-x-3">
                <Icon name="document-text" class="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">Gestionar Contenido</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Crear, editar y eliminar posts y categorías
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="users" class="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">Administrar Usuarios</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Gestionar cuentas de usuario y permisos
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="chart-bar" class="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">Ver Estadísticas</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Analizar métricas y rendimiento del sitio
                  </p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <Icon name="cog" class="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">Configuración</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Ajustar configuraciones del sistema
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Back to Home -->
        <div class="text-center mt-12">
          <NuxtLink 
            to="/" 
            class="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Icon name="arrow-left" class="w-4 h-4" />
            <span>Volver al Inicio</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, isAuthenticated } = useAuth()

// SEO
useHead({
  title: 'Acceso al Dashboard - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content: 'Información sobre cómo acceder al panel de administración del blog.'
    }
  ]
})
</script>
<template>
  <Teleport to="body">
    <div
      v-if="showWarning"
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <!-- Background overlay -->
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
          <div>
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Icon name="exclamation-triangle" class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            
            <div class="mt-3 text-center sm:mt-5">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                Sesión por expirar
              </h3>
              
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Tu sesión expirará en {{ formatTime(timeLeft) }}. ¿Deseas extender tu sesión?
                </p>
              </div>
              
              <!-- Countdown bar -->
              <div class="mt-4">
                <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                    :style="{ width: `${(timeLeft / 300) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              @click="handleExtendSession"
              :disabled="extending"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
            >
              <Icon v-if="extending" name="loading" class="w-4 h-4 animate-spin mr-2" />
              {{ extending ? 'Extendiendo...' : 'Extender sesión' }}
            </button>
            
            <button
              type="button"
              @click="handleLogout"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const { showWarning, timeLeft, extendSession, formatTime } = useDashboardSession()
const { logout } = useDashboardAuth()

const extending = ref(false)

const handleExtendSession = async () => {
  try {
    extending.value = true
    await extendSession()
  } catch (error) {
    console.error('Failed to extend session:', error)
  } finally {
    extending.value = false
  }
}

const handleLogout = async () => {
  await logout()
  await navigateTo('/dashboard/login?reason=manual')
}
</script>
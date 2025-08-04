/**
 * Simple admin authentication middleware
 * Ensures user is authenticated and has admin privileges
 * Simplified version - uses only basic auth checks
 */
export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side
  if (!process.client) return

  const { user, isAuthenticated } = useAuth()

  // Check if user is authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/login?redirect=' + encodeURIComponent(to.fullPath))
  }

  // Check if user has admin privileges
  if (!user.value?.is_staff && !user.value?.is_superuser) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acceso denegado. Se requieren permisos de administrador.'
    })
  }
})
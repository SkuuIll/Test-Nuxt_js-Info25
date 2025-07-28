export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, isAdmin } = useAuth()
  
  if (!isAuthenticated.value) {
    const redirectTo = to.fullPath
    return navigateTo({
      path: '/login',
      query: { redirect: redirectTo }
    })
  }
  
  if (!isAdmin.value) {
    // User is authenticated but not admin
    throw createError({
      statusCode: 403,
      statusMessage: 'Acceso denegado. Se requieren permisos de administrador.'
    })
  }
})
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth()
  
  if (isAuthenticated.value) {
    // User is already authenticated, redirect to home
    return navigateTo('/')
  }
})
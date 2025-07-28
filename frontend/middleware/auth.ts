export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated.value) {
    // Store the intended destination
    const redirectTo = to.fullPath
    
    // Redirect to login with return URL
    return navigateTo({
      path: '/login',
      query: { redirect: redirectTo }
    })
  }
})
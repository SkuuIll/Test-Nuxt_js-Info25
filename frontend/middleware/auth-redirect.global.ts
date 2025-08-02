/**
 * Global middleware to handle authentication redirects
 */

export default defineNuxtRouteMiddleware((to, from) => {
    // Only run on client side
    if (!process.client) return

    // Skip if we're already on login page
    if (to.path === '/login') return

    // Skip for other auth pages
    if (to.path.startsWith('/auth/') || to.path === '/register') return

    // Skip for test pages
    if (to.path.startsWith('/test-')) return

    // Check if user just logged in (coming from login page)
    if (from.path === '/login' && to.path === '/') {
        console.log('🔄 User redirected from login to home - ensuring fresh state')

        // Small delay to ensure auth state is properly set
        setTimeout(() => {
            // Force a refresh of the page to ensure all components get the new auth state
            if (process.client) {
                window.location.reload()
            }
        }, 100)
    }
})
/**
 * Unified admin middleware - Simple and direct
 * Replaces complex dashboard-auth and dashboard-permission middlewares
 */
export default defineNuxtRouteMiddleware((to) => {
    // Only run on client side
    if (!process.client) return

    const { user, isAuthenticated } = useAuth()

    // DEVELOPMENT BYPASS: Allow access in development mode
    if (import.meta.dev) {
        console.log('🚧 DEV MODE: Bypassing admin check for development')
        return
    }

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

    // For superuser-only routes, check additional permission
    if (to.meta.requireSuperuser && !user.value?.is_superuser) {
        throw createError({
            statusCode: 403,
            statusMessage: 'Acceso denegado. Se requieren permisos de superusuario.'
        })
    }
})
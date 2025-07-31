/**
 * Dashboard permission middleware
 * Ensures user has specific permissions for dashboard features
 * Usage: definePageMeta({ middleware: ['dashboard-auth', 'dashboard-permission'], permission: 'can_manage_posts' })
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
    const {
        hasPermission,
        requireDashboardAuth,
        permissions
    } = useDashboardAuth()

    // Ensure user is authenticated first
    try {
        await requireDashboardAuth()
    } catch (error) {
        console.error('Dashboard authentication required for permission check:', error)
        return navigateTo('/dashboard/login')
    }

    // Get required permission from route meta
    const requiredPermission = to.meta.permission as string

    if (!requiredPermission) {
        console.warn('No permission specified in route meta for dashboard-permission middleware')
        return
    }

    // Check if user has the required permission
    if (!hasPermission(requiredPermission as any)) {
        console.log(`🚫 Dashboard permission required: ${requiredPermission}`)

        throw createError({
            statusCode: 403,
            statusMessage: `Dashboard access denied. Required permission: ${requiredPermission}`
        })
    }

    console.log(`✅ Dashboard permission granted: ${requiredPermission}`)
})
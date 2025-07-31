/**
 * Permission-based middleware factory
 * Creates middleware that checks for specific permissions
 */

interface PermissionMiddlewareOptions {
    permissions: string[]
    requireAll?: boolean // true = require ALL permissions, false = require ANY permission
    redirectTo?: string
    message?: string
}

/**
 * Create a permission middleware with specific requirements
 */
export const createPermissionMiddleware = (options: PermissionMiddlewareOptions) => {
    const {
        permissions,
        requireAll = false,
        redirectTo = '/unauthorized',
        message = 'Insufficient permissions'
    } = options

    return defineNuxtRouteMiddleware(async (to, from) => {
        const {
            isAuthenticated,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions,
            requireAuth,
            updateActivity,
            checkAuthHealth
        } = useAuth()

        try {
            // Update activity for session tracking
            updateActivity()

            // First ensure authentication
            await requireAuth({
                redirectTo: '/login',
                message: 'Authentication required'
            })

            // Check authentication health
            const healthCheck = await checkAuthHealth()
            if (healthCheck.status === 'critical') {
                console.log('🚨 Critical authentication issues for permission check:', healthCheck.issues)
                return navigateTo('/login')
            }

            // Check permissions
            const hasRequiredPermissions = requireAll
                ? hasAllPermissions(permissions)
                : hasAnyPermission(permissions)

            if (!hasRequiredPermissions) {
                console.log(`🚫 Permission denied - Required: ${permissions.join(', ')} (${requireAll ? 'ALL' : 'ANY'})`)

                // Log current user permissions for debugging
                const currentPermissions = permissions.filter(p => hasPermission(p))
                console.log(`Current permissions: ${currentPermissions.join(', ')}`)

                return navigateTo(redirectTo)
            }

            console.log(`✅ Permission verified - ${permissions.join(', ')} (${requireAll ? 'ALL' : 'ANY'})`)

        } catch (error) {
            console.error('❌ Permission middleware error:', error)
            return navigateTo(redirectTo)
        }
    })
}

/**
 * Pre-defined permission middlewares for common use cases
 */

// Dashboard access
export const dashboardPermission = createPermissionMiddleware({
    permissions: ['can_view_dashboard'],
    redirectTo: '/unauthorized',
    message: 'Dashboard access required'
})

// Post management
export const postManagementPermission = createPermissionMiddleware({
    permissions: ['can_create_posts', 'can_edit_posts'],
    requireAll: false, // ANY permission is sufficient
    redirectTo: '/unauthorized',
    message: 'Post management permissions required'
})

// User management
export const userManagementPermission = createPermissionMiddleware({
    permissions: ['can_manage_users'],
    redirectTo: '/unauthorized',
    message: 'User management permissions required'
})

// Comment moderation
export const commentModerationPermission = createPermissionMiddleware({
    permissions: ['can_moderate_comments'],
    redirectTo: '/unauthorized',
    message: 'Comment moderation permissions required'
})

// Analytics access
export const analyticsPermission = createPermissionMiddleware({
    permissions: ['can_view_analytics'],
    redirectTo: '/unauthorized',
    message: 'Analytics access required'
})

// Content creation (posts and pages)
export const contentCreationPermission = createPermissionMiddleware({
    permissions: ['can_create_posts', 'can_edit_posts'],
    requireAll: true, // Require BOTH permissions
    redirectTo: '/unauthorized',
    message: 'Content creation permissions required'
})

/**
 * Default export for basic permission checking
 */
export default createPermissionMiddleware({
    permissions: ['can_view_posts'],
    redirectTo: '/unauthorized',
    message: 'Basic permissions required'
})
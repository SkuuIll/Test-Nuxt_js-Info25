/**
 * Enhanced Dashboard permission middleware
 * Ensures user has specific permissions for dashboard features with comprehensive error handling
 * 
 * Usage examples:
 * - Single permission: definePageMeta({ middleware: ['dashboard-auth', 'dashboard-permission'], permission: 'can_manage_posts' })
 * - Multiple permissions (any): definePageMeta({ middleware: ['dashboard-auth', 'dashboard-permission'], permissions: ['can_manage_posts', 'can_moderate_content'] })
 * - Multiple permissions (all): definePageMeta({ middleware: ['dashboard-auth', 'dashboard-permission'], permissions: ['can_manage_posts', 'can_view_stats'], requireAll: true })
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
    const {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        requireDashboardAuth,
        permissions,
        user,
        isAdmin,
        isSuperuser
    } = useDashboardAuth()

    const { error: errorToast, warning } = useToast()

    try {
        console.log('🛡️ Dashboard permission middleware executing for:', to.path)

        // Ensure user is authenticated first
        try {
            await requireDashboardAuth()
        } catch (error) {
            console.error('❌ Dashboard authentication required for permission check:', error)
            return navigateTo('/dashboard/login')
        }

        // Get permission requirements from route meta
        const singlePermission = to.meta.permission as string
        const multiplePermissions = to.meta.permissions as string[]
        const requireAll = to.meta.requireAll as boolean
        const allowAdmin = to.meta.allowAdmin !== false // Default to true
        const allowSuperuser = to.meta.allowSuperuser !== false // Default to true

        // If no permissions specified, allow access (but log warning)
        if (!singlePermission && !multiplePermissions?.length) {
            console.warn('⚠️ No permission specified in route meta for dashboard-permission middleware')
            return
        }

        // Superuser bypass (if allowed)
        if (allowSuperuser && isSuperuser.value) {
            console.log('👑 Superuser access granted, bypassing permission check')
            return
        }

        // Admin bypass (if allowed and user is admin)
        if (allowAdmin && isAdmin.value && !singlePermission?.includes('superuser')) {
            console.log('👨‍💼 Admin access granted, bypassing permission check')
            return
        }

        // Check if permissions are loaded
        if (!permissions.value) {
            console.error('❌ User permissions not loaded')

            errorToast(
                'Permission Error',
                'Unable to verify your permissions. Please try refreshing the page.'
            )

            throw createError({
                statusCode: 403,
                statusMessage: 'Permissions not available'
            })
        }

        let hasRequiredPermission = false
        let permissionDetails = ''

        // Handle single permission check
        if (singlePermission) {
            hasRequiredPermission = hasPermission(singlePermission as any)
            permissionDetails = singlePermission

            console.log(`🔍 Checking single permission: ${singlePermission} = ${hasRequiredPermission}`)
        }
        // Handle multiple permissions check
        else if (multiplePermissions?.length) {
            if (requireAll) {
                hasRequiredPermission = hasAllPermissions(multiplePermissions as any)
                permissionDetails = `all of [${multiplePermissions.join(', ')}]`

                console.log(`🔍 Checking all permissions: [${multiplePermissions.join(', ')}] = ${hasRequiredPermission}`)
            } else {
                hasRequiredPermission = hasAnyPermission(multiplePermissions as any)
                permissionDetails = `any of [${multiplePermissions.join(', ')}]`

                console.log(`🔍 Checking any permissions: [${multiplePermissions.join(', ')}] = ${hasRequiredPermission}`)
            }
        }

        // Handle permission denial
        if (!hasRequiredPermission) {
            console.log(`🚫 Dashboard permission denied: ${permissionDetails}`)

            // Log detailed permission info for debugging
            console.log('👤 User permissions:', {
                userId: user.value?.id,
                username: user.value?.username,
                isStaff: user.value?.is_staff,
                isSuperuser: user.value?.is_superuser,
                permissions: permissions.value
            })

            // Show user-friendly error message
            const friendlyPermissionName = getFriendlyPermissionName(singlePermission || multiplePermissions?.[0] || 'unknown')

            errorToast(
                'Access Denied',
                `You don't have permission to access this feature. Required: ${friendlyPermissionName}`
            )

            // Redirect to dashboard home or show error page
            if (to.path !== '/dashboard') {
                return navigateTo('/dashboard')
            }

            throw createError({
                statusCode: 403,
                statusMessage: `Dashboard access denied. Required permission: ${permissionDetails}`,
                data: {
                    requiredPermission: singlePermission || multiplePermissions,
                    userPermissions: permissions.value,
                    userId: user.value?.id
                }
            })
        }

        console.log(`✅ Dashboard permission granted: ${permissionDetails}`)

    } catch (error: any) {
        // If it's already a createError, re-throw it
        if (error.statusCode) {
            throw error
        }

        console.error('❌ Unexpected error in dashboard permission middleware:', error)

        errorToast(
            'Permission Error',
            'An unexpected error occurred while checking permissions. Please try again.'
        )

        throw createError({
            statusCode: 500,
            statusMessage: 'Permission check failed',
            data: { originalError: error.message }
        })
    }
})

/**
 * Convert technical permission names to user-friendly names
 */
function getFriendlyPermissionName(permission: string): string {
    const permissionMap: Record<string, string> = {
        'can_manage_posts': 'Post Management',
        'can_manage_users': 'User Management',
        'can_manage_comments': 'Comment Management',
        'can_view_stats': 'Statistics Access',
        'can_moderate_content': 'Content Moderation',
        'can_access_analytics': 'Analytics Access',
        'can_manage_categories': 'Category Management',
        'can_manage_media': 'Media Management',
        'can_export_data': 'Data Export',
        'can_manage_settings': 'Settings Management'
    }

    return permissionMap[permission] || permission.replace(/_/g, ' ').replace(/^can /, '').replace(/\b\w/g, l => l.toUpperCase())
}
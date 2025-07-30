export default defineNuxtRouteMiddleware((to, from) => {
    // Log navigation attempts
    if (process.dev) {
        try {
            const { $logger } = useNuxtApp()

            // Check for potential issues
            if (to.path.includes('undefined') || to.path.includes('null')) {
                $logger.warn('Suspicious route detected', {
                    to: to.fullPath,
                    from: from.fullPath
                })
            }

            // Log 404 potential
            if (to.matched.length === 0) {
                $logger.warn('Route not found', {
                    path: to.fullPath,
                    params: to.params,
                    query: to.query
                })
            }

        } catch (e) {
            // Logger not available yet
            console.log('Navigation:', from.fullPath, '→', to.fullPath)
        }
    }
})
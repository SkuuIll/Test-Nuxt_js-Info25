export default defineNuxtPlugin(() => {
    const router = useRouter()

    // Log route changes
    router.beforeEach((to, from) => {
        try {
            const { $logger } = useNuxtApp()
            $logger.route(from.fullPath, to.fullPath)
        } catch (e) {
            console.log('Route change:', from.fullPath, '→', to.fullPath)
        }
    })

    // Log route errors
    router.onError((error) => {
        try {
            const { $logger } = useNuxtApp()
            $logger.error('Router Error', {
                message: error.message,
                stack: error.stack
            })
        } catch (e) {
            console.error('Router Error:', error)
        }
    })
})
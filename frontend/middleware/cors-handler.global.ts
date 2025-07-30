export default defineNuxtRouteMiddleware((to, from) => {
    // This middleware runs on every route change
    // It helps handle CORS-related issues by ensuring proper headers

    if (process.client) {
        // Add CORS handling for client-side requests
        const originalFetch = window.fetch

        window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
            // Ensure credentials are included for same-origin requests
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
            const config = useRuntimeConfig()

            if (url.startsWith(config.public.apiBase)) {
                init = init || {}
                init.credentials = init.credentials || 'include'

                // Ensure proper headers for API requests
                init.headers = {
                    'Content-Type': 'application/json',
                    ...init.headers
                }
            }

            return originalFetch.call(this, input, init)
        }
    }
})
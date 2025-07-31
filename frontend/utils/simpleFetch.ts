/**
 * Ultra-simple fetch wrapper that we know works
 */

export function createSimpleFetch(baseURL: string) {
    return async function simpleFetch(endpoint: string, options: any = {}) {
        try {
            // Build URL
            const cleanBaseURL = baseURL.replace(/\/$/, '')
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
            let url = `${cleanBaseURL}${cleanEndpoint}`

            // Add query parameters
            if (options.params) {
                const searchParams = new URLSearchParams()
                Object.entries(options.params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        searchParams.append(key, String(value))
                    }
                })
                if (searchParams.toString()) {
                    url += `?${searchParams.toString()}`
                }
            }

            // Prepare headers
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            }

            // Prepare fetch options
            const fetchOptions = {
                method: options.method || 'GET',
                headers,
                credentials: 'include' as RequestCredentials,
                ...options.body && { body: JSON.stringify(options.body) }
            }

            console.log('🔗 Simple fetch request:', { url, method: fetchOptions.method })

            // Make the request
            const response = await fetch(url, fetchOptions)

            console.log('📊 Simple fetch response:', {
                status: response.status,
                ok: response.ok
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            // Parse JSON response
            return await response.json()

        } catch (error) {
            console.error('🚨 Simple fetch error:', error)
            throw error
        }
    }
}
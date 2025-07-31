/**
 * Custom fetch wrapper that mimics $fetch behavior but uses native fetch()
 * This solves the connectivity issues between Nuxt frontend and Django backend
 */

export interface FetchWrapperOptions {
    method?: string
    headers?: Record<string, string>
    body?: any
    params?: Record<string, any>
    credentials?: RequestCredentials
    timeout?: number
}

export interface FetchWrapperError extends Error {
    status?: number
    statusText?: string
    url: string
    method: string
    timestamp: Date
    response?: Response
}

export class CustomFetchError extends Error implements FetchWrapperError {
    status?: number
    statusText?: string
    url: string
    method: string
    timestamp: Date
    response?: Response

    constructor(
        message: string,
        url: string,
        method: string,
        status?: number,
        statusText?: string,
        response?: Response
    ) {
        super(message)
        this.name = 'CustomFetchError'
        this.url = url
        this.method = method
        this.status = status
        this.statusText = statusText
        this.timestamp = new Date()
        this.response = response
    }
}

/**
 * Create a fetch wrapper with base configuration
 */
export function createFetchWrapper(baseURL: string, defaultOptions: FetchWrapperOptions = {}) {
    return async function fetchWrapper(endpoint: string, options: FetchWrapperOptions = {}): Promise<any> {
        try {
            // Build URL - handle both absolute and relative endpoints
            let finalUrl: string
            if (endpoint.startsWith('http')) {
                finalUrl = endpoint
            } else {
                // Ensure baseURL doesn't end with slash and endpoint starts with slash
                const cleanBaseURL = baseURL.replace(/\/$/, '')
                const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
                finalUrl = `${cleanBaseURL}${cleanEndpoint}`
            }

            // Add query parameters
            if (options.params) {
                const url = new URL(finalUrl)
                Object.entries(options.params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        url.searchParams.append(key, String(value))
                    }
                })
                finalUrl = url.toString()
            }

            // Merge headers
            const headers = {
                'Accept': 'application/json',
                ...defaultOptions.headers,
                ...options.headers,
            }

            // Prepare fetch options
            const fetchOptions: RequestInit = {
                method: options.method || defaultOptions.method || 'GET',
                headers,
                credentials: options.credentials || defaultOptions.credentials || 'include',
            }

            // Add body for non-GET requests
            if (options.body && fetchOptions.method !== 'GET') {
                if (typeof options.body === 'object') {
                    fetchOptions.body = JSON.stringify(options.body)
                    headers['Content-Type'] = 'application/json'
                } else {
                    fetchOptions.body = options.body
                }
            }

            console.log('🔗 Fetch request:', {
                url: finalUrl,
                method: fetchOptions.method,
                headers: fetchOptions.headers
            })

            // Make the request
            const response = await fetch(finalUrl, fetchOptions)

            console.log('📊 Fetch response:', {
                status: response.status,
                ok: response.ok,
                statusText: response.statusText
            })

            // Check if response is ok
            if (!response.ok) {
                const errorMessage = `HTTP ${response.status}: ${response.statusText}`
                throw new CustomFetchError(
                    errorMessage,
                    finalUrl,
                    fetchOptions.method || 'GET',
                    response.status,
                    response.statusText,
                    response
                )
            }

            // Parse response
            const contentType = response.headers.get('content-type')

            if (contentType && contentType.includes('application/json')) {
                return await response.json()
            } else if (contentType && contentType.includes('text/')) {
                return await response.text()
            } else {
                return response
            }

        } catch (error) {
            console.error('🚨 Fetch error:', error)

            // Handle different types of errors
            if (error instanceof CustomFetchError) {
                throw error
            }

            if (error instanceof TypeError && error.message.includes('fetch')) {
                // Network error
                throw new CustomFetchError(
                    `Network error: ${error.message}`,
                    finalUrl,
                    fetchOptions.method || 'GET'
                )
            }

            // Generic error
            throw new CustomFetchError(
                `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                finalUrl,
                fetchOptions.method || 'GET'
            )
        }
    }
}
}

/**
 * Utility function to clean undefined/null parameters
 */
export function cleanParams(params: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {}

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            cleaned[key] = value
        }
    })

    return cleaned
}
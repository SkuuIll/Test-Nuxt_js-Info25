/**
 * CORS handling composable for frontend
 * Provides utilities for handling CORS-related functionality
 */

interface CorsConfig {
    credentials: boolean
    headers: Record<string, string>
    methods: string[]
}

interface CorsError {
    type: 'cors' | 'network' | 'server'
    message: string
    status?: number
    origin?: string
}

export const useCors = () => {
    const config = useRuntimeConfig()
    // Error handlers imported from utils to avoid circular dependencies

    // CORS configuration
    const corsConfig: CorsConfig = {
        credentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    }

    // Check if CORS is enabled
    const isCorsEnabled = computed(() => config.public.corsEnabled)

    // Get current origin
    const getCurrentOrigin = (): string => {
        if (import.meta.client) {
            return window.location.origin
        }
        return config.public.siteUrl
    }

    // Check if origin is allowed
    const isOriginAllowed = (origin: string): boolean => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            config.public.siteUrl
        ]

        return allowedOrigins.includes(origin)
    }

    // Create CORS-compliant headers
    const createCorsHeaders = (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
        const headers = {
            ...corsConfig.headers,
            ...additionalHeaders
        }

        // Add origin header if in browser
        if (import.meta.client) {
            headers['Origin'] = getCurrentOrigin()
        }

        return headers
    }



    // Handle CORS errors
    const handleCorsError = (error: any, context: string = 'CORS Request'): CorsError => {
        let corsError: CorsError

        if (error.name === 'TypeError' && error.message.includes('CORS')) {
            corsError = {
                type: 'cors',
                message: 'CORS policy blocked the request. Check server CORS configuration.',
                origin: getCurrentOrigin()
            }
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            corsError = {
                type: 'network',
                message: 'Network error. Server may be unreachable or CORS misconfigured.',
                origin: getCurrentOrigin()
            }
        } else if (error.status) {
            corsError = {
                type: 'server',
                message: `Server error: ${error.status} ${error.statusText || ''}`,
                status: error.status,
                origin: getCurrentOrigin()
            }
        } else {
            corsError = {
                type: 'cors',
                message: error.message || 'Unknown CORS error',
                origin: getCurrentOrigin()
            }
        }

        // Log error details
        console.error(`❌ ${context} CORS Error:`, {
            type: corsError.type,
            message: corsError.message,
            status: corsError.status,
            origin: corsError.origin,
            originalError: error
        })

        // Handle with error handler
        handleApiError(error, context)

        return corsError
    }

    // Create fetch wrapper with CORS handling
    const corsAwareFetch = async (
        url: string,
        options: RequestInit = {}
    ): Promise<Response> => {
        try {
            const corsOptions: RequestInit = {
                ...options,
                credentials: 'include',
                headers: {
                    ...createCorsHeaders(),
                    ...(options.headers as Record<string, string> || {})
                }
            }

            // Ensure method is allowed
            const method = (options.method || 'GET').toUpperCase()
            if (!corsConfig.methods.includes(method)) {
                throw new Error(`Method ${method} not allowed by CORS policy`)
            }

            const response = await fetch(url, corsOptions)

            // Check for CORS-related errors
            if (!response.ok && response.status === 0) {
                throw new Error('CORS policy blocked the request')
            }

            return response

        } catch (error: any) {
            const corsError = handleCorsError(error, 'CORS Aware Fetch')
            throw corsError
        }
    }

    // Get CORS debug information
    const getCorsDebugInfo = () => {
        return {
            currentOrigin: getCurrentOrigin(),
            corsEnabled: isCorsEnabled.value,
            apiBase: config.public.apiBase,
            wsBase: config.public.wsBase,
            corsConfig,
            allowedOrigins: [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                config.public.siteUrl
            ]
        }
    }



    return {
        // Configuration
        corsConfig: readonly(corsConfig),
        isCorsEnabled,

        // Utilities
        getCurrentOrigin,
        isOriginAllowed,
        createCorsHeaders,



        // Error handling
        handleCorsError,

        // Fetch wrapper
        corsAwareFetch,

        // Debug
        getCorsDebugInfo
    }
}
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

    // Test CORS connectivity
    const testCorsConnection = async (endpoint: string = '/api/v1/posts/'): Promise<boolean> => {
        try {
            const url = `${config.public.apiBase}${endpoint}`

            console.log('🔍 Testing CORS connection to:', url)

            // Test preflight request
            const preflightResponse = await fetch(url, {
                method: 'OPTIONS',
                headers: {
                    'Origin': getCurrentOrigin(),
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type, Authorization'
                },
                credentials: 'include'
            })

            if (!preflightResponse.ok) {
                console.error('❌ CORS preflight failed:', preflightResponse.status)
                return false
            }

            // Check CORS headers in response
            const corsHeaders = {
                allowOrigin: preflightResponse.headers.get('Access-Control-Allow-Origin'),
                allowMethods: preflightResponse.headers.get('Access-Control-Allow-Methods'),
                allowHeaders: preflightResponse.headers.get('Access-Control-Allow-Headers'),
                allowCredentials: preflightResponse.headers.get('Access-Control-Allow-Credentials')
            }

            console.log('✅ CORS preflight successful:', corsHeaders)

            // Test actual request
            const actualResponse = await fetch(url, {
                method: 'GET',
                headers: createCorsHeaders(),
                credentials: 'include'
            })

            console.log('✅ CORS actual request successful:', actualResponse.status)
            return true

        } catch (error: any) {
            console.error('❌ CORS connection test failed:', error)
            return false
        }
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

    // Validate CORS setup
    const validateCorsSetup = async (): Promise<{
        isValid: boolean
        issues: string[]
        recommendations: string[]
    }> => {
        const issues: string[] = []
        const recommendations: string[] = []

        try {
            // Test basic connectivity
            const isConnected = await testCorsConnection()
            if (!isConnected) {
                issues.push('CORS connection test failed')
                recommendations.push('Check if backend server is running and CORS is properly configured')
            }

            // Check origin
            const currentOrigin = getCurrentOrigin()
            if (!isOriginAllowed(currentOrigin)) {
                issues.push(`Current origin ${currentOrigin} may not be allowed`)
                recommendations.push('Add current origin to CORS_ALLOWED_ORIGINS in backend settings')
            }

            // Check if CORS is enabled
            if (!isCorsEnabled.value) {
                issues.push('CORS is disabled in frontend configuration')
                recommendations.push('Enable CORS in frontend configuration')
            }

            return {
                isValid: issues.length === 0,
                issues,
                recommendations
            }

        } catch (error) {
            issues.push('CORS validation failed with error')
            recommendations.push('Check network connectivity and server configuration')

            return {
                isValid: false,
                issues,
                recommendations
            }
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

        // Testing
        testCorsConnection,
        validateCorsSetup,

        // Error handling
        handleCorsError,

        // Fetch wrapper
        corsAwareFetch,

        // Debug
        getCorsDebugInfo
    }
}
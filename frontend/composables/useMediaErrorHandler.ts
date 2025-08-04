/**
 * Composable for handling media file errors and providing fallbacks
 */

interface MediaErrorOptions {
    retryAttempts?: number
    retryDelay?: number
    onError?: (error: MediaError) => void
    onRetry?: (attempt: number) => void
    onFallback?: (fallbackSrc: string) => void
}

interface MediaError {
    originalSrc: string
    currentSrc: string
    errorType: 'NETWORK' | 'IPX' | 'NOT_FOUND' | 'CORS' | 'UNKNOWN'
    attempts: number
    timestamp: number
    message: string
}

interface MediaFallbackStrategy {
    type: 'custom' | 'ipx' | 'default' | 'placeholder'
    src: string
    priority: number
}

export const useMediaErrorHandler = (options: MediaErrorOptions = {}) => {
    const {
        retryAttempts = 3,
        retryDelay = 1000,
        onError,
        onRetry,
        onFallback
    } = options

    // State
    const retryCount = ref(0)
    const isRetrying = ref(false)

    // Error classification
    const classifyError = (src: string, event?: Event): MediaError['errorType'] => {
        if (src.includes('/_ipx/')) {
            return 'IPX'
        }

        if (event && 'target' in event) {
            const img = event.target as HTMLImageElement
            if (img.naturalWidth === 0 && img.naturalHeight === 0) {
                return 'NOT_FOUND'
            }
        }

        if (src.startsWith('http') && !src.startsWith(window.location.origin)) {
            return 'CORS'
        }

        if (!navigator.onLine) {
            return 'NETWORK'
        }

        return 'UNKNOWN'
    }

    // Generate fallback strategies
    const generateFallbackStrategies = (originalSrc: string, context?: string): MediaFallbackStrategy[] => {
        const strategies: MediaFallbackStrategy[] = []

        // IPX fallback (highest priority for IPX URLs)
        if (originalSrc.includes('/_ipx/')) {
            const { handleIPXError } = useIPXFallback()
            try {
                const ipxFallback = handleIPXError(originalSrc)
                strategies.push({
                    type: 'ipx',
                    src: ipxFallback,
                    priority: 1
                })
            } catch (e) {
                // Silently handle IPX fallback errors
            }
        }

        // Context-based default fallbacks
        const { DEFAULT_FALLBACKS } = useImageFallback()
        let defaultFallback = DEFAULT_FALLBACKS.general

        if (context) {
            const contextLower = context.toLowerCase()
            if (contextLower.includes('avatar') || contextLower.includes('profile')) {
                defaultFallback = DEFAULT_FALLBACKS.avatar
            } else if (contextLower.includes('post') || contextLower.includes('article')) {
                defaultFallback = DEFAULT_FALLBACKS.post
            } else if (contextLower.includes('category')) {
                defaultFallback = DEFAULT_FALLBACKS.category
            }
        }

        strategies.push({
            type: 'default',
            src: defaultFallback,
            priority: 2
        })

        // Placeholder generation as last resort
        strategies.push({
            type: 'placeholder',
            src: generatePlaceholderImage(originalSrc, context),
            priority: 3
        })

        return strategies.sort((a, b) => a.priority - b.priority)
    }

    // Generate placeholder image
    const generatePlaceholderImage = (originalSrc: string, context?: string): string => {
        const { generateImagePlaceholder } = useImagePlaceholder()

        // Extract dimensions from URL if possible
        let width = 400
        let height = 300

        // Try to extract dimensions from IPX URL
        const ipxMatch = originalSrc.match(/\/w_(\d+)/)
        if (ipxMatch) {
            width = parseInt(ipxMatch[1])
            height = Math.round(width * 0.75) // Assume 4:3 aspect ratio
        }

        const text = context || 'Imagen no disponible'
        return generateImagePlaceholder(width, height, text)
    }

    // Handle media error with fallback strategies
    const handleMediaError = async (
        originalSrc: string,
        event?: Event,
        context?: string
    ): Promise<string | null> => {
        const errorType = classifyError(originalSrc, event)
        const error: MediaError = {
            originalSrc,
            currentSrc: originalSrc,
            errorType,
            attempts: retryCount.value,
            timestamp: Date.now(),
            message: getErrorMessage(errorType)
        }

        // Call error callback
        onError?.(error)

        // Try fallback strategies
        const strategies = generateFallbackStrategies(originalSrc, context)

        for (const strategy of strategies) {
            try {
                // Test if fallback image loads
                const canLoad = await testImageLoad(strategy.src)
                if (canLoad) {
                    onFallback?.(strategy.src)
                    return strategy.src
                }
            } catch (e) {
                // Silently handle fallback errors
            }
        }

        return null
    }

    // Test if an image can load
    const testImageLoad = (src: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve(true)
            img.onerror = () => resolve(false)
            img.src = src

            // Timeout after 2 seconds for production
            setTimeout(() => resolve(false), 2000)
        })
    }

    // Retry with exponential backoff
    const retryWithBackoff = async (src: string): Promise<string | null> => {
        if (retryCount.value >= retryAttempts || isRetrying.value) {
            return null
        }

        isRetrying.value = true
        retryCount.value++

        onRetry?.(retryCount.value)

        // Calculate delay with exponential backoff
        const delay = retryDelay * Math.pow(2, retryCount.value - 1)
        await new Promise(resolve => setTimeout(resolve, delay))

        // Simple retry without extensive cache busting
        const separator = src.includes('?') ? '&' : '?'
        const retrySrc = `${src}${separator}_t=${Date.now()}`

        try {
            const canLoad = await testImageLoad(retrySrc)
            if (canLoad) {
                isRetrying.value = false
                return retrySrc
            }
        } catch (e) {
            // Handle retry errors silently
        }

        isRetrying.value = false
        return null
    }

    // Get user-friendly error message
    const getErrorMessage = (errorType: MediaError['errorType']): string => {
        switch (errorType) {
            case 'IPX':
                return 'Error de optimización de imagen'
            case 'NETWORK':
                return 'Error de conexión de red'
            case 'NOT_FOUND':
                return 'Imagen no encontrada'
            case 'CORS':
                return 'Error de permisos de imagen'
            default:
                return 'Error al cargar imagen'
        }
    }

    // Reset error state
    const resetErrorState = () => {
        retryCount.value = 0
        isRetrying.value = false
    }

    return {
        // State
        retryCount: readonly(retryCount),
        isRetrying: readonly(isRetrying),

        // Methods
        handleMediaError,
        retryWithBackoff,
        resetErrorState,

        // Utilities (essential only)
        getErrorMessage
    }
}
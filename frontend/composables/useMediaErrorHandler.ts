/**
 * Composable for handling media file errors and providing fallbacks
 */

interface MediaErrorOptions {
    retryAttempts?: number
    retryDelay?: number
    enableLogging?: boolean
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
        enableLogging = true,
        onError,
        onRetry,
        onFallback
    } = options

    // State
    const errorHistory = ref<MediaError[]>([])
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
                if (enableLogging) {
                    console.warn('Failed to generate IPX fallback:', e)
                }
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

        // Add to error history
        errorHistory.value.push(error)

        if (enableLogging) {
            console.warn(`❌ Media error (${errorType}):`, originalSrc)
        }

        // Call error callback
        onError?.(error)

        // Try fallback strategies
        const strategies = generateFallbackStrategies(originalSrc, context)

        for (const strategy of strategies) {
            try {
                if (enableLogging) {
                    console.log(`🔄 Trying ${strategy.type} fallback:`, strategy.src)
                }

                // Test if fallback image loads
                const canLoad = await testImageLoad(strategy.src)
                if (canLoad) {
                    onFallback?.(strategy.src)
                    return strategy.src
                }
            } catch (e) {
                if (enableLogging) {
                    console.warn(`❌ ${strategy.type} fallback failed:`, e)
                }
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

            // Timeout after 5 seconds
            setTimeout(() => resolve(false), 5000)
        })
    }

    // Retry with exponential backoff
    const retryWithBackoff = async (src: string): Promise<string | null> => {
        if (retryCount.value >= retryAttempts || isRetrying.value) {
            return null
        }

        isRetrying.value = true
        retryCount.value++

        if (enableLogging) {
            console.log(`🔄 Retrying media load (${retryCount.value}/${retryAttempts}):`, src)
        }

        onRetry?.(retryCount.value)

        // Calculate delay with exponential backoff
        const delay = retryDelay * Math.pow(2, retryCount.value - 1)
        await new Promise(resolve => setTimeout(resolve, delay))

        // Add cache busting parameter
        const separator = src.includes('?') ? '&' : '?'
        const retrySrc = `${src}${separator}_retry=${retryCount.value}&_t=${Date.now()}`

        try {
            const canLoad = await testImageLoad(retrySrc)
            if (canLoad) {
                isRetrying.value = false
                return retrySrc
            }
        } catch (e) {
            if (enableLogging) {
                console.warn(`❌ Retry ${retryCount.value} failed:`, e)
            }
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
        errorHistory.value = []
        retryCount.value = 0
        isRetrying.value = false
    }

    // Get error statistics
    const getErrorStats = () => {
        const stats = {
            total: errorHistory.value.length,
            byType: {} as Record<MediaError['errorType'], number>,
            recentErrors: errorHistory.value.slice(-10)
        }

        errorHistory.value.forEach(error => {
            stats.byType[error.errorType] = (stats.byType[error.errorType] || 0) + 1
        })

        return stats
    }

    // Preload critical images
    const preloadImages = async (srcs: string[]): Promise<void> => {
        const { preloadImages: preload } = useImagePreloader()

        try {
            await preload(srcs)
            if (enableLogging) {
                console.log(`✅ Preloaded ${srcs.length} images`)
            }
        } catch (e) {
            if (enableLogging) {
                console.warn('⚠️ Some images failed to preload:', e)
            }
        }
    }

    return {
        // State
        errorHistory: readonly(errorHistory),
        retryCount: readonly(retryCount),
        isRetrying: readonly(isRetrying),

        // Methods
        handleMediaError,
        retryWithBackoff,
        testImageLoad,
        resetErrorState,
        getErrorStats,
        preloadImages,

        // Utilities
        classifyError,
        generateFallbackStrategies,
        getErrorMessage
    }
}
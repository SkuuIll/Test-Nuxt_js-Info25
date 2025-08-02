/**
 * Composable for handling image fallbacks and error states
 */

interface ImageFallbackOptions {
    fallbackSrc?: string
    retryAttempts?: number
    retryDelay?: number
    onError?: (error: Event) => void
    onLoad?: (event: Event) => void
}

export const useImageFallback = (src: string, options: ImageFallbackOptions = {}) => {
    const {
        fallbackSrc = '/images/placeholder.jpg',
        retryAttempts = 2,
        retryDelay = 1000,
        onError,
        onLoad
    } = options

    // State
    const loading = ref(true)
    const hasError = ref(false)
    const currentSrc = ref(src)
    const currentAttempt = ref(0)

    // Methods
    const handleLoad = (event: Event) => {
        loading.value = false
        hasError.value = false
        onLoad?.(event)
    }

    const handleError = async (event: Event) => {
        console.warn(`❌ Image load failed: ${currentSrc.value}`)

        // Try fallback if available and not already using it
        if (fallbackSrc && currentSrc.value !== fallbackSrc) {
            console.log(`🔄 Using fallback image: ${fallbackSrc}`)
            currentSrc.value = fallbackSrc
            return
        }

        // Try retry if attempts remaining
        if (currentAttempt.value < retryAttempts) {
            currentAttempt.value++
            console.log(`🔄 Retrying image load (attempt ${currentAttempt.value}/${retryAttempts})`)

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, retryDelay))

            // Add cache busting parameter
            const separator = src.includes('?') ? '&' : '?'
            currentSrc.value = `${src}${separator}_retry=${currentAttempt.value}&_t=${Date.now()}`
            return
        }

        // All attempts failed
        loading.value = false
        hasError.value = true
        onError?.(event)
    }

    const retry = () => {
        loading.value = true
        hasError.value = false
        currentAttempt.value = 0
        currentSrc.value = src
    }

    const reset = (newSrc: string) => {
        loading.value = true
        hasError.value = false
        currentAttempt.value = 0
        currentSrc.value = newSrc
    }

    // Watch for src changes
    watch(() => src, (newSrc) => {
        if (newSrc !== currentSrc.value) {
            reset(newSrc)
        }
    })

    return {
        loading: readonly(loading),
        hasError: readonly(hasError),
        currentSrc: readonly(currentSrc),
        currentAttempt: readonly(currentAttempt),
        handleLoad,
        handleError,
        retry,
        reset
    }
}

/**
 * Composable for generating placeholder images
 */
export const useImagePlaceholder = () => {
    const generatePlaceholder = (width: number, height: number, text?: string, bgColor = 'e5e7eb', textColor = '6b7280') => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) return ''

        canvas.width = width
        canvas.height = height

        // Background
        ctx.fillStyle = `#${bgColor}`
        ctx.fillRect(0, 0, width, height)

        // Text
        if (text) {
            ctx.fillStyle = `#${textColor}`
            ctx.font = `${Math.min(width, height) / 8}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(text, width / 2, height / 2)
        }

        return canvas.toDataURL()
    }

    const generateAvatarPlaceholder = (initials: string, size = 100) => {
        return generatePlaceholder(size, size, initials, 'f3f4f6', '374151')
    }

    const generateImagePlaceholder = (width: number, height: number, text = 'Imagen no disponible') => {
        return generatePlaceholder(width, height, text)
    }

    return {
        generatePlaceholder,
        generateAvatarPlaceholder,
        generateImagePlaceholder
    }
}

/**
 * Composable for handling IPX image optimization errors
 */
export const useIPXFallback = () => {
    const getOriginalImageUrl = (ipxUrl: string): string => {
        // Extract original URL from IPX URL
        // IPX URLs typically look like: /_ipx/f_webp/media/posts/image.jpg
        const ipxMatch = ipxUrl.match(/\/_ipx\/[^/]+\/(.+)/)
        if (ipxMatch) {
            return `/${ipxMatch[1]}`
        }
        return ipxUrl
    }

    const handleIPXError = (ipxUrl: string): string => {
        console.warn(`❌ IPX optimization failed for: ${ipxUrl}`)
        const originalUrl = getOriginalImageUrl(ipxUrl)
        console.log(`🔄 Falling back to original image: ${originalUrl}`)
        return originalUrl
    }

    const createIPXFallbackSrc = (originalSrc: string): string => {
        // If it's already an IPX URL that failed, return the original
        if (originalSrc.includes('/_ipx/')) {
            return getOriginalImageUrl(originalSrc)
        }
        return originalSrc
    }

    return {
        getOriginalImageUrl,
        handleIPXError,
        createIPXFallbackSrc
    }
}

/**
 * Composable for preloading images
 */
export const useImagePreloader = () => {
    const preloadImage = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve()
            img.onerror = reject
            img.src = src
        })
    }

    const preloadImages = async (srcs: string[]): Promise<void> => {
        try {
            await Promise.all(srcs.map(src => preloadImage(src)))
            console.log(`✅ Preloaded ${srcs.length} images`)
        } catch (error) {
            console.warn('⚠️ Some images failed to preload:', error)
        }
    }

    return {
        preloadImage,
        preloadImages
    }
}

/**
 * Default fallback images
 */
export const DEFAULT_FALLBACKS = {
    post: '/images/post-placeholder.svg',
    avatar: '/images/placeholder.svg',
    category: '/images/placeholder.svg',
    general: '/images/placeholder.svg'
} as const
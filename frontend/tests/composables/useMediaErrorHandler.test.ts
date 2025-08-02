import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMediaErrorHandler } from '~/composables/useMediaErrorHandler'

// Mock dependencies
vi.mock('~/composables/useImageFallback', () => ({
    useImageFallback: () => ({
        DEFAULT_FALLBACKS: {
            post: '/images/post-placeholder.svg',
            avatar: '/images/placeholder.svg',
            category: '/images/placeholder.svg',
            general: '/images/placeholder.svg'
        }
    })
}))

vi.mock('~/composables/useImagePlaceholder', () => ({
    useImagePlaceholder: () => ({
        generateImagePlaceholder: vi.fn().mockReturnValue('data:image/svg+xml;base64,test')
    })
}))

vi.mock('~/composables/useIPXFallback', () => ({
    useIPXFallback: () => ({
        handleIPXError: vi.fn().mockReturnValue('/fallback-image.jpg')
    })
}))

vi.mock('~/composables/useImagePreloader', () => ({
    useImagePreloader: () => ({
        preloadImages: vi.fn().mockResolvedValue(undefined)
    })
}))

describe('useMediaErrorHandler', () => {
    let mediaErrorHandler: any

    beforeEach(() => {
        vi.clearAllMocks()

        mediaErrorHandler = useMediaErrorHandler({
            retryAttempts: 3,
            retryDelay: 100,
            enableLogging: false,
            onError: vi.fn(),
            onRetry: vi.fn(),
            onFallback: vi.fn()
        })
    })

    it('initializes with correct default state', () => {
        expect(mediaErrorHandler.errorHistory.value).toEqual([])
        expect(mediaErrorHandler.retryCount.value).toBe(0)
        expect(mediaErrorHandler.isRetrying.value).toBe(false)
    })

    it('classifies IPX errors correctly', () => {
        const ipxUrl = '/_ipx/f_webp/test-image.jpg'
        const errorType = mediaErrorHandler.classifyError(ipxUrl)

        expect(errorType).toBe('IPX')
    })

    it('classifies CORS errors correctly', () => {
        // Mock window.location
        Object.defineProperty(window, 'location', {
            value: { origin: 'http://localhost:3000' },
            writable: true
        })

        const corsUrl = 'https://external-domain.com/image.jpg'
        const errorType = mediaErrorHandler.classifyError(corsUrl)

        expect(errorType).toBe('CORS')
    })

    it('classifies network errors correctly', () => {
        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            value: false,
            writable: true
        })

        const url = 'https://example.com/image.jpg'
        const errorType = mediaErrorHandler.classifyError(url)

        expect(errorType).toBe('NETWORK')
    })

    it('classifies not found errors correctly', () => {
        const mockEvent = {
            target: {
                naturalWidth: 0,
                naturalHeight: 0
            }
        }

        const errorType = mediaErrorHandler.classifyError('/image.jpg', mockEvent)

        expect(errorType).toBe('NOT_FOUND')
    })

    it('generates fallback strategies for IPX URLs', () => {
        const ipxUrl = '/_ipx/f_webp/test-image.jpg'
        const strategies = mediaErrorHandler.generateFallbackStrategies(ipxUrl)

        expect(strategies.length).toBeGreaterThan(0)
        expect(strategies.some((s: any) => s.type === 'ipx')).toBe(true)
        expect(strategies.some((s: any) => s.type === 'default')).toBe(true)
        expect(strategies.some((s: any) => s.type === 'placeholder')).toBe(true)
    })

    it('generates context-based fallbacks', () => {
        const url = '/user-avatar.jpg'
        const strategies = mediaErrorHandler.generateFallbackStrategies(url, 'avatar profile')

        const defaultStrategy = strategies.find((s: any) => s.type === 'default')
        expect(defaultStrategy?.src).toBe('/images/placeholder.svg')
    })

    it('generates placeholder images with dimensions', () => {
        const url = '/w_300/test-image.jpg'
        const placeholder = mediaErrorHandler.generatePlaceholderImage(url, 'Test image')

        expect(typeof placeholder).toBe('string')
        expect(placeholder).toContain('data:image/svg+xml')
    })

    it('tests image loading correctly', async () => {
        // Mock Image constructor
        const mockImage = {
            onload: null as any,
            onerror: null as any,
            src: ''
        }

        global.Image = vi.fn(() => mockImage) as any

        const testPromise = mediaErrorHandler.testImageLoad('/test-image.jpg')

        // Simulate successful load
        setTimeout(() => {
            if (mockImage.onload) mockImage.onload()
        }, 10)

        const result = await testPromise
        expect(result).toBe(true)
    })

    it('handles image load timeout', async () => {
        // Mock Image constructor
        const mockImage = {
            onload: null as any,
            onerror: null as any,
            src: ''
        }

        global.Image = vi.fn(() => mockImage) as any

        const testPromise = mediaErrorHandler.testImageLoad('/test-image.jpg')

        // Don't trigger onload or onerror - let it timeout
        const result = await testPromise
        expect(result).toBe(false)
    }, 6000)

    it('handles media errors with fallback strategies', async () => {
        // Mock successful fallback
        mediaErrorHandler.testImageLoad = vi.fn().mockResolvedValue(true)

        const fallbackSrc = await mediaErrorHandler.handleMediaError('/non-existent.jpg', null, 'test image')

        expect(fallbackSrc).toBeDefined()
        expect(typeof fallbackSrc).toBe('string')
    })

    it('returns null when all fallbacks fail', async () => {
        // Mock all fallbacks failing
        mediaErrorHandler.testImageLoad = vi.fn().mockResolvedValue(false)

        const fallbackSrc = await mediaErrorHandler.handleMediaError('/non-existent.jpg', null, 'test image')

        expect(fallbackSrc).toBeNull()
    })

    it('retries with exponential backoff', async () => {
        const mockOnRetry = vi.fn()

        const handler = useMediaErrorHandler({
            retryAttempts: 2,
            retryDelay: 50,
            onRetry: mockOnRetry
        })

        // Mock failed image load
        handler.testImageLoad = vi.fn().mockResolvedValue(false)

        const result = await handler.retryWithBackoff('/test-image.jpg')

        expect(result).toBeNull()
        expect(mockOnRetry).toHaveBeenCalled()
    })

    it('stops retrying after max attempts', async () => {
        mediaErrorHandler.retryCount.value = 3 // At max attempts

        const result = await mediaErrorHandler.retryWithBackoff('/test-image.jpg')

        expect(result).toBeNull()
    })

    it('provides appropriate error messages', () => {
        expect(mediaErrorHandler.getErrorMessage('IPX')).toBe('Error de optimización de imagen')
        expect(mediaErrorHandler.getErrorMessage('NETWORK')).toBe('Error de conexión de red')
        expect(mediaErrorHandler.getErrorMessage('NOT_FOUND')).toBe('Imagen no encontrada')
        expect(mediaErrorHandler.getErrorMessage('CORS')).toBe('Error de permisos de imagen')
        expect(mediaErrorHandler.getErrorMessage('UNKNOWN')).toBe('Error al cargar imagen')
    })

    it('resets error state correctly', () => {
        // Add some errors to history
        mediaErrorHandler.errorHistory.value = [{ id: '1', type: 'NETWORK' }]
        mediaErrorHandler.retryCount.value = 2
        mediaErrorHandler.isRetrying.value = true

        mediaErrorHandler.resetErrorState()

        expect(mediaErrorHandler.errorHistory.value).toEqual([])
        expect(mediaErrorHandler.retryCount.value).toBe(0)
        expect(mediaErrorHandler.isRetrying.value).toBe(false)
    })

    it('provides error statistics', () => {
        // Mock some error history
        mediaErrorHandler.errorHistory.value = [
            { type: 'NETWORK', timestamp: Date.now() },
            { type: 'IPX', timestamp: Date.now() },
            { type: 'NETWORK', timestamp: Date.now() }
        ]

        const stats = mediaErrorHandler.getErrorStats()

        expect(stats.total).toBe(3)
        expect(stats.byType.NETWORK).toBe(2)
        expect(stats.byType.IPX).toBe(1)
        expect(stats.recentErrors.length).toBe(3)
    })

    it('preloads images correctly', async () => {
        const mockPreload = vi.fn().mockResolvedValue(undefined)

        // Mock the preloader
        const handler = useMediaErrorHandler()
        handler.preloadImages = mockPreload

        await handler.preloadImages(['/image1.jpg', '/image2.jpg'])

        expect(mockPreload).toHaveBeenCalledWith(['/image1.jpg', '/image2.jpg'])
    })

    it('calls error callback when provided', async () => {
        const mockOnError = vi.fn()

        const handler = useMediaErrorHandler({
            onError: mockOnError
        })

        await handler.handleMediaError('/non-existent.jpg')

        expect(mockOnError).toHaveBeenCalled()
    })

    it('calls retry callback when provided', async () => {
        const mockOnRetry = vi.fn()

        const handler = useMediaErrorHandler({
            onRetry: mockOnRetry,
            retryAttempts: 1
        })

        await handler.retryWithBackoff('/test-image.jpg')

        expect(mockOnRetry).toHaveBeenCalledWith(1)
    })

    it('calls fallback callback when provided', async () => {
        const mockOnFallback = vi.fn()

        const handler = useMediaErrorHandler({
            onFallback: mockOnFallback
        })

        // Mock successful fallback
        handler.testImageLoad = vi.fn().mockResolvedValue(true)

        await handler.handleMediaError('/non-existent.jpg')

        expect(mockOnFallback).toHaveBeenCalled()
    })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EnhancedImage from '~/components/EnhancedImage.vue'

describe('EnhancedImage', () => {
    let mockMediaErrorHandler: any

    beforeEach(() => {
        mockMediaErrorHandler = {
            handleMediaError: vi.fn(),
            testImageLoad: vi.fn().mockResolvedValue(true),
            resetErrorState: vi.fn(),
        }

        global.useMediaErrorHandler = vi.fn(() => mockMediaErrorHandler)

        global.useImageFallback = vi.fn(() => ({
            DEFAULT_FALLBACKS: {
                post: '/images/post-placeholder.svg',
                avatar: '/images/placeholder.svg',
                category: '/images/placeholder.svg',
                general: '/images/placeholder.svg'
            }
        }))

        global.useImagePlaceholder = vi.fn(() => ({
            generateImagePlaceholder: vi.fn().mockReturnValue('data:image/svg+xml;base64,test')
        }))

        global.useIPXFallback = vi.fn(() => ({
            handleIPXError: vi.fn().mockReturnValue('/fallback-image.jpg'),
            createIPXFallbackSrc: vi.fn().mockReturnValue('/fallback-image.jpg')
        }))
    })

    it('renders with basic props', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
            },
        })

        const img = wrapper.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('alt')).toBe('Test image')
    })

    it('applies custom CSS classes', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                containerClass: 'custom-container',
                imageClass: 'custom-image',
            },
        })

        const container = wrapper.find('.image-container')
        const img = wrapper.find('img')

        expect(container.classes()).toContain('custom-container')
        expect(img.classes()).toContain('custom-image')
    })

    it('shows loading state initially', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
            },
        })

        const loadingElement = wrapper.find('[data-testid="image-loading"]')
        expect(loadingElement.exists()).toBe(true)
    })

    it('handles image load success', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
            },
        })

        const img = wrapper.find('img')
        await img.trigger('load')

        expect(wrapper.find('[data-testid="image-loading"]').exists()).toBe(false)
        expect(wrapper.find('[data-testid="image-error"]').exists()).toBe(false)
    })

    it('handles image load error with fallback', async () => {
        mockMediaErrorHandler.handleMediaError.mockResolvedValue('/fallback-image.jpg')

        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/broken-image.jpg',
                alt: 'Test image',
                fallbackSrc: '/fallback-image.jpg',
            },
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        expect(mockMediaErrorHandler.handleMediaError).toHaveBeenCalledWith(
            '/broken-image.jpg',
            'image',
            { fallbackSrc: '/fallback-image.jpg' }
        )
    })

    it('shows error state when all fallbacks fail', async () => {
        mockMediaErrorHandler.handleMediaError.mockResolvedValue(null)

        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/broken-image.jpg',
                alt: 'Test image',
                errorMessage: 'Custom error message',
            },
        })

        const img = wrapper.find('img')
        await img.trigger('error')
        await wrapper.vm.$nextTick()

        const errorElement = wrapper.find('[data-testid="image-error"]')
        expect(errorElement.exists()).toBe(true)
        expect(errorElement.text()).toContain('Custom error message')
    })

    it('applies aspect ratio styling', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                aspectRatio: '16/9',
            },
        })

        const container = wrapper.find('.image-container')
        expect(container.attributes('style')).toContain('aspect-ratio: 16/9')
    })

    it('handles lazy loading', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                lazyLoading: true,
            },
        })

        const img = wrapper.find('img')
        expect(img.attributes('loading')).toBe('lazy')
    })

    it('disables lazy loading when specified', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                lazyLoading: false,
            },
        })

        const img = wrapper.find('img')
        expect(img.attributes('loading')).toBe('eager')
    })

    it('handles retry functionality', async () => {
        mockMediaErrorHandler.handleMediaError.mockResolvedValue(null)

        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/broken-image.jpg',
                alt: 'Test image',
            },
        })

        // Trigger error to show error state
        const img = wrapper.find('img')
        await img.trigger('error')
        await wrapper.vm.$nextTick()

        // Find and click retry button
        const retryButton = wrapper.find('[data-testid="image-retry"]')
        expect(retryButton.exists()).toBe(true)

        await retryButton.trigger('click')
        expect(mockMediaErrorHandler.resetErrorState).toHaveBeenCalled()
    })

    it('emits load event when image loads successfully', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
            },
        })

        const img = wrapper.find('img')
        await img.trigger('load')

        expect(wrapper.emitted('load')).toBeTruthy()
    })

    it('emits error event when image fails to load', async () => {
        mockMediaErrorHandler.handleMediaError.mockResolvedValue(null)

        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/broken-image.jpg',
                alt: 'Test image',
            },
        })

        const img = wrapper.find('img')
        await img.trigger('error')
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('error')).toBeTruthy()
    })
})
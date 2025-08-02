import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EnhancedImage from '~/components/EnhancedImage.vue'

// Mock useIntersectionObserver
const mockStop = vi.fn()
vi.mock('@vueuse/core', () => ({
    useIntersectionObserver: vi.fn(() => ({ stop: mockStop }))
}))

describe('EnhancedImage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders with default props', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image'
            }
        })

        expect(wrapper.exists()).toBe(true)
        expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows loading state initially', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image'
            }
        })

        expect(wrapper.find('.loading-spinner').exists()).toBe(true)
        expect(wrapper.find('img').exists()).toBe(false)
    })

    it('shows image after loading', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image'
            }
        })

        const img = wrapper.find('img')
        await img.trigger('load')

        expect(wrapper.find('.loading-spinner').exists()).toBe(false)
        expect(img.exists()).toBe(true)
    })

    it('shows error state when image fails to load', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Test Image'
            }
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        expect(wrapper.find('.error-content').exists()).toBe(true)
        expect(wrapper.find('.loading-spinner').exists()).toBe(false)
    })

    it('tries fallback image when main image fails', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Test Image',
                fallbackSrc: '/fallback-image.jpg'
            }
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        // Should switch to fallback image
        expect(img.attributes('src')).toBe('/fallback-image.jpg')
    })

    it('shows retry button when showRetryButton is true', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Test Image',
                showRetryButton: true,
                retryAttempts: 0 // No retries, go straight to error
            }
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        expect(wrapper.find('button').exists()).toBe(true)
        expect(wrapper.find('button').text()).toBe('Reintentar')
    })

    it('retries loading when retry button is clicked', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Test Image',
                showRetryButton: true,
                retryAttempts: 0
            }
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        const retryButton = wrapper.find('button')
        await retryButton.trigger('click')

        // Should reset to loading state
        expect(wrapper.find('.loading-spinner').exists()).toBe(true)
        expect(wrapper.find('.error-content').exists()).toBe(false)
    })

    it('emits load event when image loads', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image'
            }
        })

        const img = wrapper.find('img')
        const loadEvent = new Event('load')
        await img.trigger('load')

        expect(wrapper.emitted('load')).toBeTruthy()
        expect(wrapper.emitted('load')).toHaveLength(1)
    })

    it('emits error event when image fails to load', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Test Image',
                retryAttempts: 0
            }
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        expect(wrapper.emitted('error')).toBeTruthy()
        expect(wrapper.emitted('error')).toHaveLength(1)
    })

    it('emits click event when image is clicked', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image'
            }
        })

        // First load the image
        const img = wrapper.find('img')
        await img.trigger('load')

        // Then click it
        await img.trigger('click')

        expect(wrapper.emitted('click')).toBeTruthy()
        expect(wrapper.emitted('click')).toHaveLength(1)
    })

    it('applies custom classes correctly', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image',
                containerClass: 'custom-container',
                imageClass: 'custom-image'
            }
        })

        expect(wrapper.find('.enhanced-image-container').classes()).toContain('custom-container')
        expect(wrapper.find('img').classes()).toContain('custom-image')
    })

    it('sets aspect ratio correctly', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image',
                aspectRatio: '16/9'
            }
        })

        const placeholder = wrapper.find('.image-placeholder')
        expect(placeholder.attributes('style')).toContain('aspect-ratio: 16/9')
    })

    it('sets width and height styles correctly', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image',
                width: 300,
                height: '200px'
            }
        })

        const img = wrapper.find('img')
        const style = img.attributes('style')
        expect(style).toContain('width: 300px')
        expect(style).toContain('height: 200px')
    })

    it('sets loading attribute based on lazyLoading prop', () => {
        const eagerWrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image',
                lazyLoading: false
            }
        })

        const lazyWrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image',
                lazyLoading: true
            }
        })

        expect(eagerWrapper.find('img').attributes('loading')).toBe('eager')
        expect(lazyWrapper.find('img').attributes('loading')).toBe('lazy')
    })

    it('updates src when prop changes', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image-1.jpg',
                alt: 'Test Image'
            }
        })

        await wrapper.setProps({ src: '/test-image-2.jpg' })

        expect(wrapper.find('img').attributes('src')).toBe('/test-image-2.jpg')
    })

    it('renders overlay slot content', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image'
            },
            slots: {
                overlay: '<div class="custom-overlay">Overlay Content</div>'
            }
        })

        expect(wrapper.find('.image-overlay').exists()).toBe(true)
        expect(wrapper.find('.custom-overlay').exists()).toBe(true)
        expect(wrapper.find('.custom-overlay').text()).toBe('Overlay Content')
    })

    it('shows custom error message', async () => {
        const customErrorMessage = 'Custom error message'
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Test Image',
                errorMessage: customErrorMessage,
                retryAttempts: 0
            }
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        expect(wrapper.find('.error-content p').text()).toBe(customErrorMessage)
    })

    it('cleans up intersection observer on unmount', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test Image'
            }
        })

        wrapper.unmount()

        expect(mockStop).toHaveBeenCalled()
    })
})
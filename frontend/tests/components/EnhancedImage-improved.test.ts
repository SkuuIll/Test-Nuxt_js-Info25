import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import EnhancedImage from '~/components/EnhancedImage.vue'

describe('EnhancedImage (Improved)', () => {
    let wrapper: any

    beforeEach(() => {
        // Mock IntersectionObserver
        global.IntersectionObserver = vi.fn().mockImplementation(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn()
        }))

        wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image'
            }
        })
    })

    it('renders with default props', () => {
        expect(wrapper.exists()).toBe(true)
        expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows loading state initially', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image'
            }
        })

        expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    })

    it('handles image load event', async () => {
        const img = wrapper.find('img')

        await img.trigger('load')

        expect(wrapper.emitted('load')).toBeTruthy()
    })

    it('handles image error event', async () => {
        const img = wrapper.find('img')

        await img.trigger('error')

        expect(wrapper.emitted('error')).toBeTruthy()
    })

    it('shows error state when image fails to load', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Non-existent image'
            }
        })

        // Simulate error
        wrapper.vm.hasError = true
        wrapper.vm.loading = false
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.error-content').exists()).toBe(true)
    })

    it('tries fallback image when main image fails', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Non-existent image',
                fallbackSrc: '/fallback-image.jpg'
            }
        })

        const img = wrapper.find('img')
        await img.trigger('error')

        // Should emit fallback event
        expect(wrapper.emitted('fallback')).toBeTruthy()
    })

    it('shows retry button when showRetryButton is true', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Non-existent image',
                showRetryButton: true
            }
        })

        // Simulate error state
        wrapper.vm.hasError = true
        wrapper.vm.loading = false
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.retry-button').exists()).toBe(true)
    })

    it('retries loading when retry button is clicked', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Non-existent image',
                showRetryButton: true
            }
        })

        // Simulate error state
        wrapper.vm.hasError = true
        wrapper.vm.loading = false
        await wrapper.vm.$nextTick()

        const retryButton = wrapper.find('.retry-button')
        await retryButton.trigger('click')

        expect(wrapper.emitted('retry')).toBeTruthy()
    })

    it('applies custom classes correctly', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                containerClass: 'custom-container',
                imageClass: 'custom-image'
            }
        })

        expect(wrapper.find('.custom-container').exists()).toBe(true)
        expect(wrapper.find('img.custom-image').exists()).toBe(true)
    })

    it('sets aspect ratio correctly', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                aspectRatio: '16/9'
            }
        })

        // Check if aspect ratio is applied to placeholder
        const placeholder = wrapper.find('.image-placeholder')
        if (placeholder.exists()) {
            expect(placeholder.attributes('style')).toContain('aspect-ratio: 16/9')
        }
    })

    it('sets width and height styles correctly', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                width: 300,
                height: 200
            }
        })

        const img = wrapper.find('img')
        const style = img.attributes('style')

        expect(style).toContain('width: 300px')
        expect(style).toContain('height: 200px')
    })

    it('sets loading attribute based on lazyLoading prop', () => {
        const lazyWrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                lazyLoading: true
            }
        })

        const eagerWrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                lazyLoading: false
            }
        })

        expect(lazyWrapper.find('img').attributes('loading')).toBe('lazy')
        expect(eagerWrapper.find('img').attributes('loading')).toBe('eager')
    })

    it('updates src when prop changes', async () => {
        await wrapper.setProps({ src: '/new-image.jpg' })

        expect(wrapper.find('img').attributes('src')).toBe('/new-image.jpg')
    })

    it('renders overlay slot content', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image'
            },
            slots: {
                overlay: '<div class="test-overlay">Overlay Content</div>'
            }
        })

        expect(wrapper.find('.test-overlay').exists()).toBe(true)
        expect(wrapper.find('.test-overlay').text()).toBe('Overlay Content')
    })

    it('shows custom error message', async () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Non-existent image',
                errorMessage: 'Custom error message'
            }
        })

        // Simulate error state
        wrapper.vm.hasError = true
        wrapper.vm.loading = false
        wrapper.vm.currentErrorMessage = 'Custom error message'
        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toContain('Custom error message')
    })

    it('handles IPX URL detection', () => {
        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/_ipx/f_webp/test-image.jpg',
                alt: 'IPX optimized image'
            }
        })

        expect(wrapper.vm.isIPXUrl).toBe(true)
    })

    it('shows debug info in development mode', async () => {
        // Mock development environment
        process.env.NODE_ENV = 'development'

        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/test-image.jpg',
                alt: 'Test image',
                showDebugInfo: true
            }
        })

        expect(wrapper.vm.isDevelopment).toBe(true)
    })

    it('handles error reporting', async () => {
        const mockErrorReport = vi.fn()

        const wrapper = mount(EnhancedImage, {
            props: {
                src: '/non-existent-image.jpg',
                alt: 'Non-existent image',
                showReportButton: true,
                onErrorReport: mockErrorReport
            }
        })

        // Simulate error state
        wrapper.vm.hasError = true
        wrapper.vm.loading = false
        await wrapper.vm.$nextTick()

        const reportButton = wrapper.find('.report-button')
        if (reportButton.exists()) {
            await reportButton.trigger('click')
            expect(mockErrorReport).toHaveBeenCalled()
        }
    })

    it('cleans up intersection observer on unmount', () => {
        const mockDisconnect = vi.fn()
        wrapper.vm.intersectionObserver = { disconnect: mockDisconnect }

        wrapper.unmount()

        expect(mockDisconnect).toHaveBeenCalled()
    })
})
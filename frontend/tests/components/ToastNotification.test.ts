import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastNotification from '~/components/ToastNotification.vue'
import type { Toast } from '~/types/toast'

describe('ToastNotification', () => {
    const createToast = (overrides: Partial<Toast> = {}): Toast => ({
        id: 'test-toast',
        type: 'info',
        title: 'Test Toast',
        message: 'This is a test message',
        duration: 5000,
        timestamp: Date.now(),
        ...overrides,
    })

    beforeEach(() => {
        vi.clearAllTimers()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders toast with correct content', () => {
        const toast = createToast({
            title: 'Success Message',
            message: 'Operation completed successfully',
            type: 'success',
        })

        const wrapper = mount(ToastNotification, {
            props: { toast },
        })

        expect(wrapper.find('[data-testid="toast-title"]').text()).toBe('Success Message')
        expect(wrapper.find('[data-testid="toast-message"]').text()).toBe('Operation completed successfully')
    })

    it('applies correct styling for different toast types', () => {
        const types: Array<Toast['type']> = ['success', 'error', 'warning', 'info']

        types.forEach((type) => {
            const toast = createToast({ type })
            const wrapper = mount(ToastNotification, {
                props: { toast },
            })

            const toastElement = wrapper.find('[data-testid="toast-notification"]')
            expect(toastElement.classes()).toContain(`toast-${type}`)
        })
    })

    it('shows close button and handles click', async () => {
        const toast = createToast()
        const wrapper = mount(ToastNotification, {
            props: { toast },
        })

        const closeButton = wrapper.find('[data-testid="toast-close"]')
        expect(closeButton.exists()).toBe(true)

        await closeButton.trigger('click')

        expect(wrapper.emitted('remove')).toBeTruthy()
        expect(wrapper.emitted('remove')?.[0]).toEqual([toast.id])
    })

    it('auto-removes toast after duration', async () => {
        const toast = createToast({ duration: 3000 })
        const wrapper = mount(ToastNotification, {
            props: { toast },
        })

        // Fast-forward time
        vi.advanceTimersByTime(3000)
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('remove')).toBeTruthy()
        expect(wrapper.emitted('remove')?.[0]).toEqual([toast.id])
    })

    it('does not auto-remove persistent toasts', async () => {
        const toast = createToast({ duration: 0 }) // Persistent toast
        const wrapper = mount(ToastNotification, {
            props: { toast },
        })

        // Fast-forward time significantly
        vi.advanceTimersByTime(10000)
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('remove')).toBeFalsy()
    })

    it('pauses auto-removal on hover', async () => {
        const toast = createToast({ duration: 3000 })
        const wrapper = mount(ToastNotification, {
            props: { toast },
        })

        const toastElement = wrapper.find('[data-testid="toast-notification"]')

        // Hover over toast
        await toastElement.trigger('mouseenter')

        // Fast-forward time
        vi.advanceTimersByTime(3000)
        await wrapper.vm.$nextTick()

        // Should not be removed while hovering
        expect(wrapper.emitted('remove')).toBeFalsy()

        // Stop hovering
        await toastElement.trigger('mouseleave')

        // Fast-forward time again
        vi.advanceTimersByTime(3000)
        await wrapper.vm.$nextTick()

        // Should now be removed
        expect(wrapper.emitted('remove')).toBeTruthy()
    })

    it('displays action button when provided', async () => {
        const toast = createToast({
            action: {
                label: 'Retry',
                handler: vi.fn(),
            },
        })

        const wrapper = mount(ToastNotification, {
            props: { toast },
        })

        const actionButton = wrapper.find('[data-testid="toast-action"]')
        expect(actionButton.exists()).toBe(true)
        expect(actionButton.text()).toBe('Retry')

        await actionButton.trigger('click')
        expect(toast.action?.handler).toHaveBeenCalled()
    })

    it('handles toast without title gracefully', () => {
        const toast = createToast({ title: undefined })
        const wrapper = mount(ToastNotification, {
            props: { toast },
        })

        const titleElement = wrapper.find('[data-testid="toast-title"]')
        expect(titleElement.exists()).toBe(false)

        const messageElement = wrapper.find('[data-testid="toast-message"]')
        expect(messageElement.exists()).toBe(true)
    })

    it('applies correct icon for each toast type', () => {
        const typeIconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'exclamation-triangle',
            info: 'information-circle',
        }

        Object.entries(typeIconMap).forEach(([type, expectedIcon]) => {
            const toast = createToast({ type: type as Toast['type'] })
            const wrapper = mount(ToastNotification, {
                props: { toast },
            })

            const icon = wrapper.find('[data-testid="toast-icon"]')
            expect(icon.exists()).toBe(true)
            expect(icon.attributes('name')).toBe(expectedIcon)
        })
    })
})
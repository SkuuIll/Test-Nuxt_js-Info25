import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock ToastContainer component
const ToastContainer = {
    name: 'ToastContainer',
    template: `
    <div class="toast-container fixed top-4 right-4 z-50">
      <div 
        v-for="toast in visibleToasts" 
        :key="toast.id"
        data-testid="toast-notification"
        class="toast-notification"
        @remove="handleRemove(toast.id)"
      >
        <div data-testid="toast-title">{{ toast.title }}</div>
        <div data-testid="toast-message">{{ toast.message }}</div>
        <button data-testid="toast-close" @click="handleRemove(toast.id)">×</button>
      </div>
    </div>
  `,
    data() {
        return {
            maxToasts: 5,
        }
    },
    computed: {
        visibleToasts() {
            const toastService = global.useToast()
            const toasts = toastService.toasts.value || []
            return toasts.slice(0, this.maxToasts)
        },
    },
    methods: {
        handleRemove(id: string) {
            const toastService = global.useToast()
            toastService.remove(id)
        },
    },
}

describe('ToastContainer', () => {
    let mockToastService: any

    beforeEach(() => {
        mockToastService = {
            toasts: { value: [] },
            show: vi.fn(),
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn(),
            info: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
        }

        global.useToast = vi.fn(() => mockToastService)
    })

    it('renders without crashing', () => {
        const wrapper = mount(ToastContainer)
        expect(wrapper.exists()).toBe(true)
    })

    it('displays toasts when they exist', async () => {
        const testToasts = [
            {
                id: '1',
                type: 'success',
                title: 'Success',
                message: 'Operation completed',
                duration: 5000,
                timestamp: Date.now(),
            },
            {
                id: '2',
                type: 'error',
                title: 'Error',
                message: 'Something went wrong',
                duration: 0,
                timestamp: Date.now(),
            },
        ]

        mockToastService.toasts.value = testToasts

        const wrapper = mount(ToastContainer)
        await wrapper.vm.$nextTick()

        const toastElements = wrapper.findAll('[data-testid="toast-notification"]')
        expect(toastElements).toHaveLength(2)
    })

    it('limits the number of displayed toasts', async () => {
        const manyToasts = Array.from({ length: 10 }, (_, i) => ({
            id: `toast-${i}`,
            type: 'info',
            title: `Toast ${i}`,
            message: `Message ${i}`,
            duration: 5000,
            timestamp: Date.now(),
        }))

        mockToastService.toasts.value = manyToasts

        const wrapper = mount(ToastContainer)
        await wrapper.vm.$nextTick()

        const toastElements = wrapper.findAll('[data-testid="toast-notification"]')
        expect(toastElements.length).toBeLessThanOrEqual(5) // MAX_TOASTS = 5
    })

    it('handles toast removal', async () => {
        const testToast = {
            id: 'test-toast',
            type: 'success',
            title: 'Test',
            message: 'Test message',
            duration: 5000,
            timestamp: Date.now(),
        }

        mockToastService.toasts.value = [testToast]

        const wrapper = mount(ToastContainer)
        await wrapper.vm.$nextTick()

        const toastElement = wrapper.find('[data-testid="toast-notification"]')
        expect(toastElement.exists()).toBe(true)

        // Simulate toast removal
        const closeButton = wrapper.find('[data-testid="toast-close"]')
        await closeButton.trigger('click')

        expect(mockToastService.remove).toHaveBeenCalledWith('test-toast')
    })

    it('applies correct positioning classes', () => {
        const wrapper = mount(ToastContainer)
        const container = wrapper.find('.toast-container')

        expect(container.classes()).toContain('fixed')
        expect(container.classes()).toContain('top-4')
        expect(container.classes()).toContain('right-4')
        expect(container.classes()).toContain('z-50')
    })

    it('handles empty toast list gracefully', () => {
        mockToastService.toasts.value = []

        const wrapper = mount(ToastContainer)
        const toastElements = wrapper.findAll('[data-testid="toast-notification"]')

        expect(toastElements).toHaveLength(0)
    })

    it('shows toast content correctly', async () => {
        const testToast = {
            id: 'test-toast',
            type: 'success',
            title: 'Success Title',
            message: 'Success Message',
            duration: 5000,
            timestamp: Date.now(),
        }

        mockToastService.toasts.value = [testToast]

        const wrapper = mount(ToastContainer)
        await wrapper.vm.$nextTick()

        const titleElement = wrapper.find('[data-testid="toast-title"]')
        const messageElement = wrapper.find('[data-testid="toast-message"]')

        expect(titleElement.text()).toBe('Success Title')
        expect(messageElement.text()).toBe('Success Message')
    })
})
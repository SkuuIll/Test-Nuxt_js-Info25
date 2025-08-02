import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastContainer from '~/components/ToastContainer.vue'
import type { ToastNotification } from '~/types/notifications'

// Mock Nuxt composables
const mockNuxtApp = {
    provide: vi.fn(),
    $bus: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn()
    }
}

vi.mock('#app', () => ({
    useNuxtApp: () => mockNuxtApp
}))

describe('ToastContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders without errors', () => {
        const wrapper = mount(ToastContainer)
        expect(wrapper.exists()).toBe(true)
    })

    it('provides toast service globally', () => {
        mount(ToastContainer)

        expect(mockNuxtApp.provide).toHaveBeenCalledWith('toast', expect.objectContaining({
            show: expect.any(Function),
            success: expect.any(Function),
            error: expect.any(Function),
            warning: expect.any(Function),
            info: expect.any(Function),
            remove: expect.any(Function),
            clear: expect.any(Function)
        }))
    })

    it('sets up event listeners on mount', () => {
        mount(ToastContainer)

        expect(mockNuxtApp.$bus.on).toHaveBeenCalledWith('show-toast', expect.any(Function))
        expect(mockNuxtApp.$bus.on).toHaveBeenCalledWith('remove-toast', expect.any(Function))
        expect(mockNuxtApp.$bus.on).toHaveBeenCalledWith('clear-toasts', expect.any(Function))
    })

    it('adds toast to the list when show is called', async () => {
        const wrapper = mount(ToastContainer)
        const vm = wrapper.vm as any

        const mockToast: Omit<ToastNotification, 'id'> = {
            type: 'success',
            title: 'Test Toast',
            message: 'This is a test message',
            priority: 'normal'
        }

        // Access the addToast method through the component instance
        vm.addToast(mockToast)

        await wrapper.vm.$nextTick()

        expect(vm.toasts).toHaveLength(1)
        expect(vm.toasts[0]).toMatchObject(mockToast)
        expect(vm.toasts[0].id).toBeDefined()
    })

    it('removes toast when removeToast is called', async () => {
        const wrapper = mount(ToastContainer)
        const vm = wrapper.vm as any

        // Add a toast first
        const mockToast: Omit<ToastNotification, 'id'> = {
            type: 'info',
            title: 'Test Toast',
            message: 'This is a test message',
            priority: 'normal'
        }

        vm.addToast(mockToast)
        await wrapper.vm.$nextTick()

        const toastId = vm.toasts[0].id

        // Remove the toast
        vm.removeToast(toastId)
        await wrapper.vm.$nextTick()

        expect(vm.toasts).toHaveLength(0)
    })

    it('limits the number of toasts to 5', async () => {
        const wrapper = mount(ToastContainer)
        const vm = wrapper.vm as any

        // Add 7 toasts
        for (let i = 0; i < 7; i++) {
            vm.addToast({
                type: 'info',
                title: `Toast ${i}`,
                message: `Message ${i}`,
                priority: 'normal'
            })
        }

        await wrapper.vm.$nextTick()

        expect(vm.toasts).toHaveLength(5)
        // Should keep the last 5 toasts
        expect(vm.toasts[0].title).toBe('Toast 2')
        expect(vm.toasts[4].title).toBe('Toast 6')
    })

    it('clears all toasts when clearAllToasts is called', async () => {
        const wrapper = mount(ToastContainer)
        const vm = wrapper.vm as any

        // Add multiple toasts
        for (let i = 0; i < 3; i++) {
            vm.addToast({
                type: 'info',
                title: `Toast ${i}`,
                message: `Message ${i}`,
                priority: 'normal'
            })
        }

        await wrapper.vm.$nextTick()
        expect(vm.toasts).toHaveLength(3)

        // Clear all toasts
        vm.clearAllToasts()
        await wrapper.vm.$nextTick()

        expect(vm.toasts).toHaveLength(0)
    })

    it('generates unique IDs for toasts', () => {
        const wrapper = mount(ToastContainer)
        const vm = wrapper.vm as any

        const id1 = vm.generateToastId()
        const id2 = vm.generateToastId()

        expect(id1).not.toBe(id2)
        expect(id1).toMatch(/^toast-\d+-[a-z0-9]+$/)
        expect(id2).toMatch(/^toast-\d+-[a-z0-9]+$/)
    })

    it('provides convenience methods for different toast types', () => {
        const wrapper = mount(ToastContainer)
        const vm = wrapper.vm as any

        // Test success method
        vm.showSuccess('Success message', 'Success Title')
        expect(vm.toasts).toHaveLength(1)
        expect(vm.toasts[0].type).toBe('success')
        expect(vm.toasts[0].title).toBe('Success Title')
        expect(vm.toasts[0].message).toBe('Success message')
        expect(vm.toasts[0].duration).toBe(5000)

        // Test error method
        vm.showError('Error message', 'Error Title')
        expect(vm.toasts).toHaveLength(2)
        expect(vm.toasts[1].type).toBe('error')
        expect(vm.toasts[1].title).toBe('Error Title')
        expect(vm.toasts[1].message).toBe('Error message')
        expect(vm.toasts[1].duration).toBe(7000)

        // Test warning method
        vm.showWarning('Warning message')
        expect(vm.toasts).toHaveLength(3)
        expect(vm.toasts[2].type).toBe('warning')
        expect(vm.toasts[2].title).toBe('Advertencia')
        expect(vm.toasts[2].message).toBe('Warning message')
        expect(vm.toasts[2].duration).toBe(6000)

        // Test info method
        vm.showInfo('Info message')
        expect(vm.toasts).toHaveLength(4)
        expect(vm.toasts[3].type).toBe('info')
        expect(vm.toasts[3].title).toBe('Información')
        expect(vm.toasts[3].message).toBe('Info message')
        expect(vm.toasts[3].duration).toBe(5000)
    })
})
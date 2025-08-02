import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ToastContainer from '~/components/ToastContainer.vue'

// Mock the toast types
vi.mock('~/types/toast', () => ({
    ToastNotification: {},
    ToastService: {},
    ToastOptions: {}
}))

describe('ToastContainer (Improved)', () => {
    let wrapper: any
    let mockNuxtApp: any

    beforeEach(() => {
        mockNuxtApp = {
            provide: vi.fn(),
            $toast: null
        }

        global.useNuxtApp = vi.fn(() => mockNuxtApp)

        wrapper = mount(ToastContainer)
    })

    it('renders without errors', () => {
        expect(wrapper.exists()).toBe(true)
    })

    it('provides toast service globally', () => {
        // The component should attempt to provide the toast service
        expect(mockNuxtApp.provide).toHaveBeenCalled()
    })

    it('handles toast addition correctly', async () => {
        const vm = wrapper.vm

        // Add a toast
        const toastId = vm.addToast({
            type: 'success',
            title: 'Test Toast',
            message: 'This is a test message'
        })

        expect(toastId).toBeDefined()
        expect(typeof toastId).toBe('string')
    })

    it('limits the number of toasts to maximum', async () => {
        const vm = wrapper.vm

        // Add more than the maximum number of toasts
        for (let i = 0; i < 7; i++) {
            vm.addToast({
                type: 'info',
                title: `Toast ${i}`,
                message: `Message ${i}`
            })
        }

        await wrapper.vm.$nextTick()

        // Should be limited to 5 toasts
        expect(vm.toasts.value.length).toBeLessThanOrEqual(5)
    })

    it('removes toast correctly', async () => {
        const vm = wrapper.vm

        // Add a toast
        const toastId = vm.addToast({
            type: 'info',
            title: 'Test Toast',
            message: 'Test message'
        })

        expect(vm.toasts.value.length).toBe(1)

        // Remove the toast
        vm.removeToast(toastId)

        expect(vm.toasts.value.length).toBe(0)
    })

    it('clears all toasts', async () => {
        const vm = wrapper.vm

        // Add multiple toasts
        vm.addToast({ type: 'success', message: 'Toast 1' })
        vm.addToast({ type: 'error', message: 'Toast 2' })
        vm.addToast({ type: 'warning', message: 'Toast 3' })

        expect(vm.toasts.value.length).toBe(3)

        // Clear all toasts
        vm.clearToasts()

        expect(vm.toasts.value.length).toBe(0)
    })

    it('provides convenience methods for different toast types', async () => {
        const vm = wrapper.vm

        // Test success method
        const successId = vm.showSuccess('Success message', 'Success Title')
        expect(successId).toBeDefined()
        expect(vm.toasts.value[0].type).toBe('success')

        // Test error method
        const errorId = vm.showError('Error message', 'Error Title')
        expect(errorId).toBeDefined()
        expect(vm.toasts.value[1].type).toBe('error')

        // Test warning method
        const warningId = vm.showWarning('Warning message', 'Warning Title')
        expect(warningId).toBeDefined()
        expect(vm.toasts.value[2].type).toBe('warning')

        // Test info method
        const infoId = vm.showInfo('Info message', 'Info Title')
        expect(infoId).toBeDefined()
        expect(vm.toasts.value[3].type).toBe('info')
    })

    it('handles persistent toasts correctly', async () => {
        const vm = wrapper.vm

        // Add a persistent toast
        const toastId = vm.addToast({
            type: 'error',
            title: 'Persistent Error',
            message: 'This should not auto-remove',
            persistent: true
        })

        expect(vm.toasts.value[0].persistent).toBe(true)

        // Wait a bit to ensure it doesn't auto-remove
        await new Promise(resolve => setTimeout(resolve, 100))

        expect(vm.toasts.value.length).toBe(1)
    })

    it('handles toast actions correctly', async () => {
        const vm = wrapper.vm
        const mockAction = vi.fn()

        // Add a toast with actions
        vm.addToast({
            type: 'info',
            title: 'Action Toast',
            message: 'Toast with actions',
            actions: [
                {
                    label: 'Test Action',
                    action: mockAction
                }
            ]
        })

        expect(vm.toasts.value[0].actions).toBeDefined()
        expect(vm.toasts.value[0].actions.length).toBe(1)
        expect(vm.toasts.value[0].actions[0].label).toBe('Test Action')
    })

    it('generates unique IDs for toasts', async () => {
        const vm = wrapper.vm

        const id1 = vm.addToast({ type: 'info', message: 'Toast 1' })
        const id2 = vm.addToast({ type: 'info', message: 'Toast 2' })

        expect(id1).not.toBe(id2)
        expect(vm.toasts.value[0].id).toBe(id1)
        expect(vm.toasts.value[1].id).toBe(id2)
    })

    it('handles event bus communication', async () => {
        const mockEventListener = vi.fn()
        window.addEventListener = mockEventListener

        mount(ToastContainer)

        // Should set up event listener for toast events
        expect(mockEventListener).toHaveBeenCalledWith('show-toast', expect.any(Function))
    })
})
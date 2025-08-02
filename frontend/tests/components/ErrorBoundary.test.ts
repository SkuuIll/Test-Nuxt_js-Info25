import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ErrorBoundary from '~/components/ErrorBoundary.vue'

describe('ErrorBoundary', () => {
    let wrapper: any

    beforeEach(() => {
        // Mock $fetch for feedback
        global.$fetch = vi.fn().mockResolvedValue({})

        wrapper = mount(ErrorBoundary, {
            props: {
                enableFeedback: true,
                showDetails: true,
                autoRecover: true,
                maxRetries: 3
            },
            slots: {
                default: '<div class="test-content">Test Content</div>'
            }
        })
    })

    it('renders slot content when no error', () => {
        expect(wrapper.find('.test-content').exists()).toBe(true)
        expect(wrapper.find('.error-boundary').exists()).toBe(false)
    })

    it('shows error boundary when error is captured', async () => {
        const testError = new Error('Test error')

        // Simulate error capture
        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.error-boundary').exists()).toBe(true)
        expect(wrapper.find('.test-content').exists()).toBe(false)
    })

    it('displays error title and message', async () => {
        const testError = new Error('Test error message')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.error-title').exists()).toBe(true)
        expect(wrapper.find('.error-message').exists()).toBe(true)
    })

    it('shows error details in development mode', async () => {
        // Mock development environment
        process.env.NODE_ENV = 'development'

        const testError = new Error('Test error')
        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        if (wrapper.vm.isDevelopment) {
            expect(wrapper.find('.error-details').exists()).toBe(true)
        }
    })

    it('displays recovery actions', async () => {
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.error-actions').exists()).toBe(true)
        expect(wrapper.findAll('.error-action-button').length).toBeGreaterThan(0)
    })

    it('shows feedback section when enabled', async () => {
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.error-feedback').exists()).toBe(true)
        expect(wrapper.find('.feedback-options').exists()).toBe(true)
    })

    it('handles positive feedback', async () => {
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        const positiveButton = wrapper.find('.feedback-button.positive')
        await positiveButton.trigger('click')

        expect(global.$fetch).toHaveBeenCalledWith('/api/v1/error-feedback', {
            method: 'POST',
            body: expect.objectContaining({
                feedback: 'helpful'
            })
        })
    })

    it('handles negative feedback', async () => {
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        const negativeButton = wrapper.find('.feedback-button.negative')
        await negativeButton.trigger('click')

        expect(global.$fetch).toHaveBeenCalledWith('/api/v1/error-feedback', {
            method: 'POST',
            body: expect.objectContaining({
                feedback: 'not-helpful'
            })
        })
    })

    it('shows feedback thanks message after submission', async () => {
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        const positiveButton = wrapper.find('.feedback-button.positive')
        await positiveButton.trigger('click')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.feedback-thanks').exists()).toBe(true)
    })

    it('executes recovery actions', async () => {
        const mockAction = vi.fn()
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        // Mock recovery action
        wrapper.vm.recoveryActions.value = [{
            label: 'Test Action',
            action: mockAction,
            type: 'primary'
        }]
        await wrapper.vm.$nextTick()

        const actionButton = wrapper.find('.error-action-button')
        await actionButton.trigger('click')

        expect(mockAction).toHaveBeenCalled()
    })

    it('handles action execution errors', async () => {
        const mockAction = vi.fn().mockRejectedValue(new Error('Action failed'))
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        // Mock recovery action that fails
        wrapper.vm.recoveryActions.value = [{
            label: 'Failing Action',
            action: mockAction,
            type: 'primary'
        }]
        await wrapper.vm.$nextTick()

        const actionButton = wrapper.find('.error-action-button')
        await actionButton.trigger('click')

        expect(mockAction).toHaveBeenCalled()
        // Should handle the error gracefully
    })

    it('clears error state', async () => {
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.error-boundary').exists()).toBe(true)

        wrapper.vm.clearError()
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.error-boundary').exists()).toBe(false)
        expect(wrapper.find('.test-content').exists()).toBe(true)
    })

    it('formats timestamps correctly', () => {
        const timestamp = Date.now()
        const formatted = wrapper.vm.formatTimestamp(timestamp)

        expect(typeof formatted).toBe('string')
        expect(formatted.length).toBeGreaterThan(0)
    })

    it('formats error objects correctly', () => {
        const error = new Error('Test error')
        error.stack = 'Error stack trace'

        const formatted = wrapper.vm.formatError(error)

        expect(formatted).toContain('Error stack trace')
    })

    it('formats non-error objects correctly', () => {
        const errorObj = { message: 'Test error', code: 500 }

        const formatted = wrapper.vm.formatError(errorObj)

        expect(formatted).toContain('Test error')
        expect(formatted).toContain('500')
    })

    it('exposes methods for parent components', () => {
        expect(typeof wrapper.vm.captureError).toBe('function')
        expect(typeof wrapper.vm.clearError).toBe('function')
        expect(typeof wrapper.vm.retry).toBe('function')
    })

    it('handles retry functionality', async () => {
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        await wrapper.vm.$nextTick()

        // Mock retry count
        wrapper.vm.retryCount = 1

        await wrapper.vm.retry()

        expect(wrapper.vm.retryCount).toBe(2)
    })

    it('respects max retry limit', async () => {
        const testError = new Error('Test error')

        wrapper.vm.captureError(testError, 'Test context')
        wrapper.vm.retryCount = 3 // At max retries

        await wrapper.vm.retry()

        // Should not increment beyond max
        expect(wrapper.vm.retryCount).toBe(3)
    })

    it('captures errors using onErrorCaptured', () => {
        // This tests that onErrorCaptured is set up correctly
        expect(wrapper.vm.$options.errorCaptured).toBeDefined()
    })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('useErrorRecovery', () => {
    let mockErrorRecovery: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockErrorRecovery = {
            hasError: { value: false },
            errorMessage: { value: '' },
            retryCount: { value: 0 },
            isRecovering: { value: false },
            recoveryActions: { value: [] },
            handleError: vi.fn(),
            clearError: vi.fn(),
            getErrorStats: vi.fn().mockReturnValue({
                total: 0,
                byType: {},
                bySeverity: {},
                recent: []
            })
        }
        global.useErrorRecovery = vi.fn(() => mockErrorRecovery)
    })

    it('initializes with default state', () => {
        const errorRecovery = global.useErrorRecovery()

        expect(errorRecovery.hasError.value).toBe(false)
        expect(errorRecovery.errorMessage.value).toBe('')
        expect(errorRecovery.retryCount.value).toBe(0)
        expect(errorRecovery.isRecovering.value).toBe(false)
        expect(errorRecovery.recoveryActions.value).toEqual([])
    })

    it('handles network errors correctly', async () => {
        const errorRecovery = global.useErrorRecovery()
        const networkError = new Error('Network Error')
        networkError.name = 'NetworkError'

        await errorRecovery.handleError(networkError, 'network')

        expect(errorRecovery.handleError).toHaveBeenCalledWith(networkError, 'network')
    })

    it('handles authentication errors correctly', async () => {
        const errorRecovery = global.useErrorRecovery()
        const authError = new Error('Unauthorized')
        authError.name = 'AuthenticationError'

        await errorRecovery.handleError(authError, 'auth')

        expect(errorRecovery.handleError).toHaveBeenCalledWith(authError, 'auth')
    })

    it('handles validation errors correctly', async () => {
        const errorRecovery = global.useErrorRecovery()
        const validationError = new Error('Validation failed')
        validationError.name = 'ValidationError'

        await errorRecovery.handleError(validationError, 'validation')

        expect(errorRecovery.handleError).toHaveBeenCalledWith(validationError, 'validation')
    })

    it('handles server errors correctly', async () => {
        const errorRecovery = global.useErrorRecovery()
        const serverError = new Error('Internal Server Error')
        serverError.name = 'ServerError'

        await errorRecovery.handleError(serverError, 'server')

        expect(errorRecovery.handleError).toHaveBeenCalledWith(serverError, 'server')
    })

    it('clears error state', () => {
        const errorRecovery = global.useErrorRecovery()

        errorRecovery.clearError()

        expect(errorRecovery.clearError).toHaveBeenCalled()
    })

    it('provides error statistics', () => {
        const errorRecovery = global.useErrorRecovery()

        const stats = errorRecovery.getErrorStats()

        expect(errorRecovery.getErrorStats).toHaveBeenCalled()
        expect(stats).toHaveProperty('total')
        expect(stats).toHaveProperty('byType')
        expect(stats).toHaveProperty('bySeverity')
        expect(stats).toHaveProperty('recent')
    })

    it('handles unknown error types gracefully', async () => {
        const errorRecovery = global.useErrorRecovery()
        const unknownError = new Error('Unknown error')

        await errorRecovery.handleError(unknownError, 'unknown' as any)

        expect(errorRecovery.handleError).toHaveBeenCalledWith(unknownError, 'unknown')
    })

    it('provides contextual recovery actions', async () => {
        const errorRecovery = global.useErrorRecovery()
        const context = { page: 'login', action: 'submit' }

        await errorRecovery.handleError(new Error('Network Error'), 'network', context)

        expect(errorRecovery.handleError).toHaveBeenCalledWith(
            expect.any(Error),
            'network',
            context
        )
    })

    it('handles error recovery process', async () => {
        const errorRecovery = global.useErrorRecovery()
        const mockRecoveryFn = vi.fn().mockResolvedValue(true)

        await errorRecovery.handleError(new Error('Test error'), 'network', undefined, mockRecoveryFn)

        expect(errorRecovery.handleError).toHaveBeenCalledWith(
            expect.any(Error),
            'network',
            undefined,
            mockRecoveryFn
        )
    })
})
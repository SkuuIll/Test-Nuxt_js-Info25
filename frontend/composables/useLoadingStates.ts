/**
 * Enhanced Loading States Composable
 * Provides comprehensive loading state management with skeleton loading and transitions
 */

interface LoadingState {
    isLoading: boolean
    progress?: number
    message?: string
    startTime?: number
    estimatedDuration?: number
}

interface LoadingOptions {
    key?: string
    message?: string
    showProgress?: boolean
    estimatedDuration?: number
    minDuration?: number
    maxDuration?: number
    showSkeleton?: boolean
    skeletonType?: 'text' | 'card' | 'list' | 'table' | 'custom'
    priority?: 'low' | 'normal' | 'high'
}

interface SkeletonConfig {
    type: 'text' | 'card' | 'list' | 'table' | 'custom'
    count?: number
    height?: string
    width?: string
    className?: string
    animated?: boolean
}

export const useLoadingStates = () => {
    // Global loading states
    const loadingStates = ref<Map<string, LoadingState>>(new Map())
    const globalLoading = ref(false)
    const loadingQueue = ref<string[]>([])
    const loadingHistory = ref<Array<{
        key: string
        startTime: number
        endTime?: number
        duration?: number
        success: boolean
    }>>([])

    // Skeleton loading states
    const skeletonStates = ref<Map<string, SkeletonConfig>>(new Map())
    const showSkeletons = ref<Map<string, boolean>>(new Map())

    // Progress tracking
    const progressStates = ref<Map<string, number>>(new Map())
    const progressMessages = ref<Map<string, string>>(new Map())

    /**
     * Start loading state
     */
    const startLoading = (options: LoadingOptions = {}) => {
        const key = options.key || 'default'
        const startTime = Date.now()

        // Create loading state
        const loadingState: LoadingState = {
            isLoading: true,
            progress: options.showProgress ? 0 : undefined,
            message: options.message,
            startTime,
            estimatedDuration: options.estimatedDuration
        }

        loadingStates.value.set(key, loadingState)

        // Add to queue based on priority
        if (options.priority === 'high') {
            loadingQueue.value.unshift(key)
        } else {
            loadingQueue.value.push(key)
        }

        // Update global loading state
        updateGlobalLoading()

        // Set up skeleton loading if requested
        if (options.showSkeleton) {
            setupSkeletonLoading(key, {
                type: options.skeletonType || 'text',
                animated: true
            })
        }

        // Set up progress simulation if estimated duration is provided
        if (options.estimatedDuration && options.showProgress) {
            simulateProgress(key, options.estimatedDuration)
        }

        // Set up automatic timeout if max duration is provided
        if (options.maxDuration) {
            setTimeout(() => {
                if (isLoading(key)) {
                    console.warn(`⚠️ Loading timeout for ${key} after ${options.maxDuration}ms`)
                    stopLoading(key, false)
                }
            }, options.maxDuration)
        }

        console.log(`🔄 Loading started: ${key}`, options)
        return key
    }

    /**
     * Stop loading state
     */
    const stopLoading = (key: string = 'default', success: boolean = true) => {
        const loadingState = loadingStates.value.get(key)
        if (!loadingState) return

        const endTime = Date.now()
        const duration = endTime - (loadingState.startTime || endTime)

        // Add to history
        loadingHistory.value.unshift({
            key,
            startTime: loadingState.startTime || endTime,
            endTime,
            duration,
            success
        })

        // Keep only last 50 entries
        if (loadingHistory.value.length > 50) {
            loadingHistory.value = loadingHistory.value.slice(0, 50)
        }

        // Remove from states
        loadingStates.value.delete(key)
        progressStates.value.delete(key)
        progressMessages.value.delete(key)

        // Remove from queue
        const queueIndex = loadingQueue.value.indexOf(key)
        if (queueIndex > -1) {
            loadingQueue.value.splice(queueIndex, 1)
        }

        // Handle skeleton loading
        if (showSkeletons.value.has(key)) {
            // Add a small delay before hiding skeleton for smooth transition
            setTimeout(() => {
                showSkeletons.value.delete(key)
                skeletonStates.value.delete(key)
            }, 150)
        }

        // Update global loading state
        updateGlobalLoading()

        console.log(`✅ Loading stopped: ${key} (${duration}ms, success: ${success})`)
    }

    /**
     * Update progress for a loading state
     */
    const updateProgress = (key: string, progress: number, message?: string) => {
        const loadingState = loadingStates.value.get(key)
        if (!loadingState) return

        // Clamp progress between 0 and 100
        const clampedProgress = Math.max(0, Math.min(100, progress))

        progressStates.value.set(key, clampedProgress)

        if (message) {
            progressMessages.value.set(key, message)
        }

        // Update loading state
        loadingState.progress = clampedProgress
        if (message) {
            loadingState.message = message
        }

        loadingStates.value.set(key, loadingState)
    }

    /**
     * Simulate progress based on estimated duration
     */
    const simulateProgress = (key: string, estimatedDuration: number) => {
        const startTime = Date.now()
        const interval = 100 // Update every 100ms

        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(95, (elapsed / estimatedDuration) * 100) // Cap at 95% until actually done

            updateProgress(key, progress)

            // Stop simulation when loading is complete or progress reaches 95%
            if (!isLoading(key) || progress >= 95) {
                clearInterval(progressInterval)
            }
        }, interval)

        // Clean up interval after estimated duration + buffer
        setTimeout(() => {
            clearInterval(progressInterval)
        }, estimatedDuration + 5000)
    }

    /**
     * Set up skeleton loading
     */
    const setupSkeletonLoading = (key: string, config: SkeletonConfig) => {
        skeletonStates.value.set(key, config)
        showSkeletons.value.set(key, true)
    }

    /**
     * Update global loading state
     */
    const updateGlobalLoading = () => {
        globalLoading.value = loadingStates.value.size > 0
    }

    /**
     * Check if a specific key is loading
     */
    const isLoading = (key: string = 'default'): boolean => {
        return loadingStates.value.has(key)
    }

    /**
     * Get loading state for a key
     */
    const getLoadingState = (key: string = 'default'): LoadingState | null => {
        return loadingStates.value.get(key) || null
    }

    /**
     * Get progress for a key
     */
    const getProgress = (key: string): number => {
        return progressStates.value.get(key) || 0
    }

    /**
     * Get progress message for a key
     */
    const getProgressMessage = (key: string): string => {
        return progressMessages.value.get(key) || ''
    }

    /**
     * Check if skeleton should be shown
     */
    const shouldShowSkeleton = (key: string): boolean => {
        return showSkeletons.value.get(key) || false
    }

    /**
     * Get skeleton configuration
     */
    const getSkeletonConfig = (key: string): SkeletonConfig | null => {
        return skeletonStates.value.get(key) || null
    }

    /**
     * Wrapper function to handle loading for async operations
     */
    const withLoading = async <T>(
        operation: () => Promise<T>,
        options: LoadingOptions = {}
    ): Promise<T> => {
        const key = startLoading(options)

        try {
            // Ensure minimum loading duration if specified
            const minDuration = options.minDuration || 0
            const startTime = Date.now()

            const result = await operation()

            // Wait for minimum duration if needed
            if (minDuration > 0) {
                const elapsed = Date.now() - startTime
                if (elapsed < minDuration) {
                    await new Promise(resolve => setTimeout(resolve, minDuration - elapsed))
                }
            }

            // Complete progress if it was being tracked
            if (options.showProgress) {
                updateProgress(key, 100, 'Complete')
                // Small delay to show 100% before hiding
                await new Promise(resolve => setTimeout(resolve, 200))
            }

            stopLoading(key, true)
            return result
        } catch (error) {
            stopLoading(key, false)
            throw error
        }
    }

    /**
     * Batch loading operations
     */
    const withBatchLoading = async <T>(
        operations: Array<{
            operation: () => Promise<T>
            key?: string
            weight?: number
        }>,
        options: LoadingOptions = {}
    ): Promise<T[]> => {
        const batchKey = options.key || 'batch'
        startLoading({ ...options, key: batchKey, showProgress: true })

        const totalWeight = operations.reduce((sum, op) => sum + (op.weight || 1), 0)
        let completedWeight = 0

        try {
            const results = await Promise.all(
                operations.map(async (op, index) => {
                    const result = await op.operation()

                    completedWeight += op.weight || 1
                    const progress = (completedWeight / totalWeight) * 100
                    updateProgress(batchKey, progress, `Completed ${index + 1}/${operations.length}`)

                    return result
                })
            )

            updateProgress(batchKey, 100, 'All operations complete')
            await new Promise(resolve => setTimeout(resolve, 200))

            stopLoading(batchKey, true)
            return results
        } catch (error) {
            stopLoading(batchKey, false)
            throw error
        }
    }

    /**
     * Clear all loading states
     */
    const clearAllLoading = () => {
        loadingStates.value.clear()
        progressStates.value.clear()
        progressMessages.value.clear()
        showSkeletons.value.clear()
        skeletonStates.value.clear()
        loadingQueue.value = []
        updateGlobalLoading()
    }

    /**
     * Get loading statistics
     */
    const getLoadingStats = () => {
        const activeLoading = loadingStates.value.size
        const queueLength = loadingQueue.value.length
        const recentHistory = loadingHistory.value.slice(0, 10)

        const avgDuration = recentHistory.length > 0
            ? recentHistory.reduce((sum, entry) => sum + (entry.duration || 0), 0) / recentHistory.length
            : 0

        const successRate = recentHistory.length > 0
            ? (recentHistory.filter(entry => entry.success).length / recentHistory.length) * 100
            : 100

        return {
            activeLoading,
            queueLength,
            avgDuration: Math.round(avgDuration),
            successRate: Math.round(successRate),
            recentHistory,
            totalHistoryEntries: loadingHistory.value.length
        }
    }

    /**
     * Create loading manager for a specific component
     */
    const createLoadingManager = (componentName: string) => {
        const componentKey = `component_${componentName}`

        return {
            start: (options: Omit<LoadingOptions, 'key'> = {}) =>
                startLoading({ ...options, key: componentKey }),

            stop: (success: boolean = true) =>
                stopLoading(componentKey, success),

            updateProgress: (progress: number, message?: string) =>
                updateProgress(componentKey, progress, message),

            isLoading: () =>
                isLoading(componentKey),

            getState: () =>
                getLoadingState(componentKey),

            withLoading: <T>(operation: () => Promise<T>, options: Omit<LoadingOptions, 'key'> = {}) =>
                withLoading(operation, { ...options, key: componentKey })
        }
    }

    // Computed properties
    const hasActiveLoading = computed(() => globalLoading.value)
    const activeLoadingCount = computed(() => loadingStates.value.size)
    const currentLoadingKeys = computed(() => Array.from(loadingStates.value.keys()))
    const highestPriorityLoading = computed(() => {
        if (loadingQueue.value.length === 0) return null
        return loadingQueue.value[0]
    })

    return {
        // State
        globalLoading: readonly(globalLoading),
        loadingStates: readonly(loadingStates),
        loadingQueue: readonly(loadingQueue),
        loadingHistory: readonly(loadingHistory),

        // Computed
        hasActiveLoading,
        activeLoadingCount,
        currentLoadingKeys,
        highestPriorityLoading,

        // Core functions
        startLoading,
        stopLoading,
        isLoading,
        getLoadingState,

        // Progress functions
        updateProgress,
        getProgress,
        getProgressMessage,

        // Skeleton functions
        shouldShowSkeleton,
        getSkeletonConfig,
        setupSkeletonLoading,

        // Wrapper functions
        withLoading,
        withBatchLoading,

        // Utilities
        clearAllLoading,
        getLoadingStats,
        createLoadingManager
    }
}
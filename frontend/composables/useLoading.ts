interface LoadingState {
  [key: string]: LoadingInfo
}

interface LoadingInfo {
  active: boolean
  startTime: number
  duration?: number
  message?: string
  progress?: number
  type: 'default' | 'skeleton' | 'spinner' | 'progress' | 'pulse' | 'shimmer'
  priority: 'low' | 'medium' | 'high' | 'critical'
  cancellable?: boolean
  timeout?: number
  context?: string
  metadata?: Record<string, any>
}

interface LoadingOptions {
  key?: string
  timeout?: number
  showGlobalIndicator?: boolean
  message?: string
  type?: LoadingInfo['type']
  priority?: LoadingInfo['priority']
  cancellable?: boolean
  context?: string
  metadata?: Record<string, any>
  onTimeout?: () => void
  onCancel?: () => void
}

interface LoadingTransition {
  from: string
  to: string
  duration: number
  easing?: string
}

interface LoadingMetrics {
  totalLoadingTime: number
  averageLoadingTime: number
  loadingCount: number
  longestLoading: number
  shortestLoading: number
  loadingsByType: Record<string, number>
  loadingsByPriority: Record<string, number>
}

export const useLoading = () => {
  // Enhanced loading states
  const loadingStates = ref<LoadingState>({})
  const globalLoading = ref(false)
  const loadingCount = ref(0)
  const loadingQueue = ref<string[]>([])
  const loadingMetrics = ref<LoadingMetrics>({
    totalLoadingTime: 0,
    averageLoadingTime: 0,
    loadingCount: 0,
    longestLoading: 0,
    shortestLoading: Infinity,
    loadingsByType: {},
    loadingsByPriority: {}
  })
  const loadingTransitions = ref<LoadingTransition[]>([])
  const timeouts = ref<Map<string, NodeJS.Timeout>>(new Map())
  const cancelCallbacks = ref<Map<string, () => void>>(new Map())

  // Enhanced loading state management
  const setLoading = (loading: boolean, options: LoadingOptions = {}) => {
    const key = options.key || 'default'
    const now = Date.now()

    if (loading) {
      // Clear any existing timeout for this key
      if (timeouts.value.has(key)) {
        clearTimeout(timeouts.value.get(key)!)
        timeouts.value.delete(key)
      }

      // Create loading info
      const loadingInfo: LoadingInfo = {
        active: true,
        startTime: now,
        message: options.message,
        type: options.type || 'default',
        priority: options.priority || 'medium',
        cancellable: options.cancellable || false,
        timeout: options.timeout,
        context: options.context,
        metadata: options.metadata
      }

      loadingStates.value[key] = loadingInfo
      loadingCount.value++

      // Add to queue based on priority
      addToLoadingQueue(key, loadingInfo.priority)

      // Update global loading state
      if (options.showGlobalIndicator !== false) {
        globalLoading.value = true
      }

      // Set timeout if specified
      if (options.timeout) {
        const timeoutId = setTimeout(() => {
          console.warn(`Loading timeout reached for key: ${key}`)
          if (options.onTimeout) {
            options.onTimeout()
          }
          setLoading(false, { key })
        }, options.timeout)

        timeouts.value.set(key, timeoutId)
      }

      // Store cancel callback if provided
      if (options.onCancel && options.cancellable) {
        cancelCallbacks.value.set(key, options.onCancel)
      }

      // Update metrics
      updateLoadingMetrics(loadingInfo, 'start')

    } else {
      const existingLoading = loadingStates.value[key]

      if (existingLoading) {
        // Calculate duration
        const duration = now - existingLoading.startTime
        existingLoading.duration = duration

        // Update metrics
        updateLoadingMetrics(existingLoading, 'end')

        // Clean up
        delete loadingStates.value[key]
        loadingCount.value = Math.max(0, loadingCount.value - 1)
        removeFromLoadingQueue(key)

        // Clear timeout if exists
        if (timeouts.value.has(key)) {
          clearTimeout(timeouts.value.get(key)!)
          timeouts.value.delete(key)
        }

        // Clear cancel callback
        cancelCallbacks.value.delete(key)
      }

      // Update global loading state
      if (loadingCount.value === 0) {
        globalLoading.value = false
      }
    }
  }

  // Add to loading queue with priority
  const addToLoadingQueue = (key: string, priority: LoadingInfo['priority']) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const insertIndex = loadingQueue.value.findIndex(queueKey => {
      const queuePriority = loadingStates.value[queueKey]?.priority || 'medium'
      return priorityOrder[priority] < priorityOrder[queuePriority]
    })

    if (insertIndex === -1) {
      loadingQueue.value.push(key)
    } else {
      loadingQueue.value.splice(insertIndex, 0, key)
    }
  }

  // Remove from loading queue
  const removeFromLoadingQueue = (key: string) => {
    const index = loadingQueue.value.indexOf(key)
    if (index > -1) {
      loadingQueue.value.splice(index, 1)
    }
  }

  // Update loading metrics
  const updateLoadingMetrics = (loadingInfo: LoadingInfo, phase: 'start' | 'end') => {
    if (phase === 'start') {
      loadingMetrics.value.loadingsByType[loadingInfo.type] =
        (loadingMetrics.value.loadingsByType[loadingInfo.type] || 0) + 1

      loadingMetrics.value.loadingsByPriority[loadingInfo.priority] =
        (loadingMetrics.value.loadingsByPriority[loadingInfo.priority] || 0) + 1
    } else if (phase === 'end' && loadingInfo.duration) {
      loadingMetrics.value.totalLoadingTime += loadingInfo.duration
      loadingMetrics.value.loadingCount++
      loadingMetrics.value.averageLoadingTime =
        loadingMetrics.value.totalLoadingTime / loadingMetrics.value.loadingCount

      if (loadingInfo.duration > loadingMetrics.value.longestLoading) {
        loadingMetrics.value.longestLoading = loadingInfo.duration
      }

      if (loadingInfo.duration < loadingMetrics.value.shortestLoading) {
        loadingMetrics.value.shortestLoading = loadingInfo.duration
      }
    }
  }

  // Enhanced loading state checks
  const isLoading = (key: string = 'default'): boolean => {
    return loadingStates.value[key]?.active || false
  }

  // Check if any loading is active
  const isAnyLoading = (): boolean => {
    return loadingCount.value > 0
  }

  // Check loading by type
  const isLoadingByType = (type: LoadingInfo['type']): boolean => {
    return Object.values(loadingStates.value).some(loading =>
      loading.active && loading.type === type
    )
  }

  // Check loading by priority
  const isLoadingByPriority = (priority: LoadingInfo['priority']): boolean => {
    return Object.values(loadingStates.value).some(loading =>
      loading.active && loading.priority === priority
    )
  }

  // Get loading info for a specific key
  const getLoadingInfo = (key: string): LoadingInfo | null => {
    return loadingStates.value[key] || null
  }

  // Get all active loading keys
  const getActiveLoadingKeys = (): string[] => {
    return Object.keys(loadingStates.value).filter(key =>
      loadingStates.value[key].active
    )
  }

  // Get loading keys by type
  const getLoadingKeysByType = (type: LoadingInfo['type']): string[] => {
    return Object.keys(loadingStates.value).filter(key =>
      loadingStates.value[key].active && loadingStates.value[key].type === type
    )
  }

  // Get loading keys by priority
  const getLoadingKeysByPriority = (priority: LoadingInfo['priority']): string[] => {
    return Object.keys(loadingStates.value).filter(key =>
      loadingStates.value[key].active && loadingStates.value[key].priority === priority
    )
  }

  // Get highest priority loading
  const getHighestPriorityLoading = (): { key: string; info: LoadingInfo } | null => {
    if (loadingQueue.value.length === 0) return null

    const key = loadingQueue.value[0]
    const info = loadingStates.value[key]

    return info ? { key, info } : null
  }

  // Update loading progress
  const updateLoadingProgress = (key: string, progress: number, message?: string) => {
    const loadingInfo = loadingStates.value[key]
    if (loadingInfo && loadingInfo.active) {
      loadingInfo.progress = Math.max(0, Math.min(100, progress))
      if (message) {
        loadingInfo.message = message
      }
    }
  }

  // Cancel loading
  const cancelLoading = (key: string) => {
    const loadingInfo = loadingStates.value[key]
    if (loadingInfo && loadingInfo.active && loadingInfo.cancellable) {
      const cancelCallback = cancelCallbacks.value.get(key)
      if (cancelCallback) {
        cancelCallback()
      }
      setLoading(false, { key })
      return true
    }
    return false
  }

  // Clear all loading states
  const clearAllLoading = () => {
    // Clear all timeouts
    timeouts.value.forEach(timeout => clearTimeout(timeout))
    timeouts.value.clear()

    // Clear cancel callbacks
    cancelCallbacks.value.clear()

    // Reset state
    loadingStates.value = {}
    loadingCount.value = 0
    globalLoading.value = false
    loadingQueue.value = []
  }

  // Clear specific loading state
  const clearLoading = (key: string) => {
    setLoading(false, { key })
  }

  // Clear loading by type
  const clearLoadingByType = (type: LoadingInfo['type']) => {
    const keysToClean = getLoadingKeysByType(type)
    keysToClean.forEach(key => clearLoading(key))
  }

  // Clear loading by priority
  const clearLoadingByPriority = (priority: LoadingInfo['priority']) => {
    const keysToClean = getLoadingKeysByPriority(priority)
    keysToClean.forEach(key => clearLoading(key))
  }

  // Enhanced wrapper function for async operations
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T> => {
    const key = options.key || 'default'
    let progressInterval: NodeJS.Timeout | null = null

    try {
      setLoading(true, options)

      // Set up progress simulation if no manual progress updates
      if (options.type === 'progress' && !options.metadata?.manualProgress) {
        let progress = 0
        progressInterval = setInterval(() => {
          progress += Math.random() * 10
          if (progress < 90) {
            updateLoadingProgress(key, progress)
          }
        }, 200)
      }

      const result = await asyncFn()

      // Complete progress if it was being tracked
      if (progressInterval) {
        updateLoadingProgress(key, 100, 'Completado')
        await new Promise(resolve => setTimeout(resolve, 200)) // Brief delay to show completion
      }

      return result
    } catch (error) {
      // Handle error state
      const loadingInfo = loadingStates.value[key]
      if (loadingInfo) {
        loadingInfo.metadata = {
          ...loadingInfo.metadata,
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      throw error
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setLoading(false, { key })
    }
  }

  // Wrapper with retry logic
  const withLoadingRetry = async <T>(
    asyncFn: () => Promise<T>,
    options: LoadingOptions & { maxRetries?: number; retryDelay?: number } = {}
  ): Promise<T> => {
    const { maxRetries = 3, retryDelay = 1000, ...loadingOptions } = options
    const key = loadingOptions.key || 'default'

    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const retryOptions = {
          ...loadingOptions,
          message: attempt > 0 ? `${loadingOptions.message} (Intento ${attempt + 1}/${maxRetries + 1})` : loadingOptions.message
        }

        return await withLoading(asyncFn, retryOptions)
      } catch (error) {
        lastError = error

        if (attempt < maxRetries) {
          // Update loading message for retry
          const loadingInfo = loadingStates.value[key]
          if (loadingInfo) {
            loadingInfo.message = `Error, reintentando en ${retryDelay / 1000}s...`
          }

          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }

    throw lastError
  }

  // Batch loading operations
  const withBatchLoading = async <T>(
    operations: Array<{
      fn: () => Promise<T>
      key: string
      options?: LoadingOptions
    }>,
    globalOptions: LoadingOptions = {}
  ): Promise<T[]> => {
    const batchKey = globalOptions.key || 'batch'

    try {
      setLoading(true, { ...globalOptions, key: batchKey })

      // Start all operations
      const promises = operations.map(({ fn, key, options = {} }) =>
        withLoading(fn, { ...options, key, showGlobalIndicator: false })
      )

      // Track batch progress
      if (globalOptions.type === 'progress') {
        const progressInterval = setInterval(() => {
          const completedCount = operations.filter(({ key }) => !isLoading(key)).length
          const progress = (completedCount / operations.length) * 100
          updateLoadingProgress(batchKey, progress, `${completedCount}/${operations.length} completadas`)
        }, 100)

        try {
          const results = await Promise.all(promises)
          updateLoadingProgress(batchKey, 100, 'Todas las operaciones completadas')
          return results
        } finally {
          clearInterval(progressInterval)
        }
      } else {
        return await Promise.all(promises)
      }
    } finally {
      setLoading(false, { key: batchKey })
    }
  }

  // Sequential loading operations
  const withSequentialLoading = async <T>(
    operations: Array<{
      fn: () => Promise<T>
      key: string
      options?: LoadingOptions
    }>,
    globalOptions: LoadingOptions = {}
  ): Promise<T[]> => {
    const batchKey = globalOptions.key || 'sequential'
    const results: T[] = []

    try {
      setLoading(true, { ...globalOptions, key: batchKey })

      for (let i = 0; i < operations.length; i++) {
        const { fn, key, options = {} } = operations[i]

        // Update batch progress
        if (globalOptions.type === 'progress') {
          const progress = (i / operations.length) * 100
          updateLoadingProgress(batchKey, progress, `Operación ${i + 1}/${operations.length}`)
        }

        const result = await withLoading(fn, { ...options, key, showGlobalIndicator: false })
        results.push(result)
      }

      // Complete progress
      if (globalOptions.type === 'progress') {
        updateLoadingProgress(batchKey, 100, 'Todas las operaciones completadas')
      }

      return results
    } finally {
      setLoading(false, { key: batchKey })
    }
  }

  // Enhanced loading wrapper creation
  const createLoadingWrapper = (
    key: string,
    defaultOptions: Partial<LoadingOptions> = {}
  ) => {
    const mergedOptions = {
      showGlobalIndicator: true,
      type: 'default' as LoadingInfo['type'],
      priority: 'medium' as LoadingInfo['priority'],
      ...defaultOptions
    }

    return {
      loading: computed(() => isLoading(key)),
      loadingInfo: computed(() => getLoadingInfo(key)),
      progress: computed(() => getLoadingInfo(key)?.progress || 0),
      message: computed(() => getLoadingInfo(key)?.message || ''),

      setLoading: (loading: boolean, options: Partial<LoadingOptions> = {}) =>
        setLoading(loading, { key, ...mergedOptions, ...options }),

      withLoading: <T>(asyncFn: () => Promise<T>, options: Partial<LoadingOptions> = {}) =>
        withLoading(asyncFn, { key, ...mergedOptions, ...options }),

      withLoadingRetry: <T>(
        asyncFn: () => Promise<T>,
        options: Partial<LoadingOptions & { maxRetries?: number; retryDelay?: number }> = {}
      ) =>
        withLoadingRetry(asyncFn, { key, ...mergedOptions, ...options }),

      updateProgress: (progress: number, message?: string) =>
        updateLoadingProgress(key, progress, message),

      cancel: () => cancelLoading(key),

      clear: () => clearLoading(key)
    }
  }

  // Create skeleton loading wrapper
  const createSkeletonWrapper = (key: string, options: Partial<LoadingOptions> = {}) => {
    return createLoadingWrapper(key, {
      type: 'skeleton',
      priority: 'low',
      showGlobalIndicator: false,
      ...options
    })
  }

  // Create progress loading wrapper
  const createProgressWrapper = (key: string, options: Partial<LoadingOptions> = {}) => {
    return createLoadingWrapper(key, {
      type: 'progress',
      priority: 'medium',
      ...options
    })
  }

  // Predefined loading wrappers for common operations
  const apiLoading = createLoadingWrapper('api', {
    type: 'spinner',
    priority: 'medium',
    timeout: 30000,
    context: 'API Request'
  })

  const authLoading = createLoadingWrapper('auth', {
    type: 'spinner',
    priority: 'high',
    timeout: 15000,
    context: 'Authentication'
  })

  const uploadLoading = createProgressWrapper('upload', {
    priority: 'medium',
    cancellable: true,
    context: 'File Upload'
  })

  const dashboardLoading = createLoadingWrapper('dashboard', {
    type: 'spinner',
    priority: 'medium',
    context: 'Dashboard Operation'
  })

  const skeletonLoading = createSkeletonWrapper('skeleton', {
    context: 'Content Loading'
  })

  const criticalLoading = createLoadingWrapper('critical', {
    type: 'spinner',
    priority: 'critical',
    timeout: 60000,
    context: 'Critical Operation'
  })

  // Computed properties for different loading states
  const hasSkeletonLoading = computed(() => isLoadingByType('skeleton'))
  const hasProgressLoading = computed(() => isLoadingByType('progress'))
  const hasSpinnerLoading = computed(() => isLoadingByType('spinner'))
  const hasCriticalLoading = computed(() => isLoadingByPriority('critical'))
  const hasHighPriorityLoading = computed(() => isLoadingByPriority('high'))

  // Get loading summary
  const getLoadingSummary = () => {
    return {
      total: loadingCount.value,
      byType: Object.entries(loadingStates.value).reduce((acc, [key, info]) => {
        if (info.active) {
          acc[info.type] = (acc[info.type] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      byPriority: Object.entries(loadingStates.value).reduce((acc, [key, info]) => {
        if (info.active) {
          acc[info.priority] = (acc[info.priority] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>),
      queue: loadingQueue.value,
      metrics: loadingMetrics.value
    }
  }

  // Reset loading metrics
  const resetLoadingMetrics = () => {
    loadingMetrics.value = {
      totalLoadingTime: 0,
      averageLoadingTime: 0,
      loadingCount: 0,
      longestLoading: 0,
      shortestLoading: Infinity,
      loadingsByType: {},
      loadingsByPriority: {}
    }
  }

  // Cleanup function
  const cleanup = () => {
    clearAllLoading()
    resetLoadingMetrics()
  }

  return {
    // Enhanced State
    loadingStates: readonly(loadingStates),
    globalLoading: readonly(globalLoading),
    loadingCount: readonly(loadingCount),
    loadingQueue: readonly(loadingQueue),
    loadingMetrics: readonly(loadingMetrics),

    // Computed States
    hasSkeletonLoading,
    hasProgressLoading,
    hasSpinnerLoading,
    hasCriticalLoading,
    hasHighPriorityLoading,

    // Core Methods
    setLoading,
    isLoading,
    isAnyLoading,
    isLoadingByType,
    isLoadingByPriority,

    // Information Methods
    getLoadingInfo,
    getActiveLoadingKeys,
    getLoadingKeysByType,
    getLoadingKeysByPriority,
    getHighestPriorityLoading,
    getLoadingSummary,

    // Progress and Control
    updateLoadingProgress,
    cancelLoading,

    // Cleanup Methods
    clearAllLoading,
    clearLoading,
    clearLoadingByType,
    clearLoadingByPriority,

    // Async Wrappers
    withLoading,
    withLoadingRetry,
    withBatchLoading,
    withSequentialLoading,

    // Wrapper Creation
    createLoadingWrapper,
    createSkeletonWrapper,
    createProgressWrapper,

    // Predefined Wrappers
    apiLoading,
    authLoading,
    uploadLoading,
    dashboardLoading,
    skeletonLoading,
    criticalLoading,

    // Metrics and Utilities
    resetLoadingMetrics,
    cleanup
  }
}
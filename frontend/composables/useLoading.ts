interface LoadingState {
  [key: string]: boolean
}

interface LoadingOptions {
  key?: string
  timeout?: number
  showGlobalIndicator?: boolean
}

export const useLoading = () => {
  // Global loading states
  const loadingStates = ref<LoadingState>({})
  const globalLoading = ref(false)
  const loadingCount = ref(0)

  // Set loading state for a specific key
  const setLoading = (loading: boolean, options: LoadingOptions = {}) => {
    const key = options.key || 'default'

    if (loading) {
      loadingStates.value[key] = true
      loadingCount.value++

      if (options.showGlobalIndicator !== false) {
        globalLoading.value = true
      }

      // Set timeout if specified
      if (options.timeout) {
        setTimeout(() => {
          setLoading(false, { key })
        }, options.timeout)
      }
    } else {
      if (loadingStates.value[key]) {
        delete loadingStates.value[key]
        loadingCount.value = Math.max(0, loadingCount.value - 1)
      }

      // Update global loading state
      if (loadingCount.value === 0) {
        globalLoading.value = false
      }
    }
  }

  // Check if a specific key is loading
  const isLoading = (key: string = 'default'): boolean => {
    return loadingStates.value[key] || false
  }

  // Check if any loading is active
  const isAnyLoading = (): boolean => {
    return loadingCount.value > 0
  }

  // Get all active loading keys
  const getActiveLoadingKeys = (): string[] => {
    return Object.keys(loadingStates.value)
  }

  // Clear all loading states
  const clearAllLoading = () => {
    loadingStates.value = {}
    loadingCount.value = 0
    globalLoading.value = false
  }

  // Clear specific loading state
  const clearLoading = (key: string) => {
    setLoading(false, { key })
  }

  // Wrapper function to handle loading for async operations
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    options: LoadingOptions = {}
  ): Promise<T> => {
    const key = options.key || 'default'

    try {
      setLoading(true, options)
      const result = await asyncFn()
      return result
    } finally {
      setLoading(false, { key })
    }
  }

  // Create a loading wrapper for a specific key
  const createLoadingWrapper = (key: string, showGlobalIndicator: boolean = true) => {
    return {
      loading: computed(() => isLoading(key)),
      setLoading: (loading: boolean) => setLoading(loading, { key, showGlobalIndicator }),
      withLoading: <T>(asyncFn: () => Promise<T>) =>
        withLoading(asyncFn, { key, showGlobalIndicator })
    }
  }

  // Predefined loading wrappers for common operations
  const apiLoading = createLoadingWrapper('api')
  const authLoading = createLoadingWrapper('auth')
  const uploadLoading = createLoadingWrapper('upload')
  const dashboardLoading = createLoadingWrapper('dashboard')

  return {
    // State
    loadingStates: readonly(loadingStates),
    globalLoading: readonly(globalLoading),
    loadingCount: readonly(loadingCount),

    // Methods
    setLoading,
    isLoading,
    isAnyLoading,
    getActiveLoadingKeys,
    clearAllLoading,
    clearLoading,
    withLoading,
    createLoadingWrapper,

    // Predefined wrappers
    apiLoading,
    authLoading,
    uploadLoading,
    dashboardLoading
  }
}
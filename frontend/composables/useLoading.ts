/**
 * Loading state management composable
 * Provides centralized loading state management for different operations
 */

interface LoadingState {
  loading: Ref<boolean>
  error: Ref<string | null>
}

export const useLoading = () => {
  // Global loading states for different operations
  const authLoading = ref(false)
  const apiLoading = ref(false)
  const pageLoading = ref(false)

  // Error states
  const authError = ref<string | null>(null)
  const apiError = ref<string | null>(null)
  const pageError = ref<string | null>(null)

  // Generic loading wrapper
  const withLoading = async <T>(
    operation: () => Promise<T>,
    loadingRef: Ref<boolean>,
    errorRef: Ref<string | null>
  ): Promise<T> => {
    try {
      loadingRef.value = true
      errorRef.value = null

      const result = await operation()
      return result
    } catch (error: any) {
      const errorMessage = error?.message || 'An error occurred'
      errorRef.value = errorMessage
      throw error
    } finally {
      loadingRef.value = false
    }
  }

  // Specific loading wrappers
  const authLoadingWrapper = {
    loading: readonly(authLoading),
    error: readonly(authError),
    withLoading: <T>(operation: () => Promise<T>) =>
      withLoading(operation, authLoading, authError),
    clearError: () => { authError.value = null },
    setLoading: (value: boolean) => { authLoading.value = value }
  }

  const apiLoadingWrapper = {
    loading: readonly(apiLoading),
    error: readonly(apiError),
    withLoading: <T>(operation: () => Promise<T>) =>
      withLoading(operation, apiLoading, apiError),
    clearError: () => { apiError.value = null },
    setLoading: (value: boolean) => { apiLoading.value = value }
  }

  const pageLoadingWrapper = {
    loading: readonly(pageLoading),
    error: readonly(pageError),
    withLoading: <T>(operation: () => Promise<T>) =>
      withLoading(operation, pageLoading, pageError),
    clearError: () => { pageError.value = null },
    setLoading: (value: boolean) => { pageLoading.value = value }
  }

  // Global loading state management
  const globalLoading = ref(false)
  const loadingKeys = ref(new Set<string>())

  // Global loading state (true if any operation is loading)
  const isLoading = computed(() =>
    authLoading.value || apiLoading.value || pageLoading.value || globalLoading.value
  )

  // Global error state
  const hasError = computed(() =>
    !!authError.value || !!apiError.value || !!pageError.value
  )

  const clearAllErrors = () => {
    authError.value = null
    apiError.value = null
    pageError.value = null
  }

  const setAllLoading = (value: boolean) => {
    authLoading.value = value
    apiLoading.value = value
    pageLoading.value = value
  }

  // Global loading controls for plugins
  const setLoading = (loading: boolean, options?: { key?: string; showGlobalIndicator?: boolean }) => {
    const key = options?.key || 'default'

    if (loading) {
      loadingKeys.value.add(key)
    } else {
      loadingKeys.value.delete(key)
    }

    // Update global loading state
    globalLoading.value = loadingKeys.value.size > 0

    // If showGlobalIndicator is explicitly set, override global loading
    if (options?.showGlobalIndicator !== undefined) {
      globalLoading.value = loading && options.showGlobalIndicator
    }
  }

  return {
    // Specific loading wrappers
    authLoading: authLoadingWrapper,
    apiLoading: apiLoadingWrapper,
    pageLoading: pageLoadingWrapper,

    // Global states
    isLoading,
    hasError,
    globalLoading: readonly(globalLoading),

    // Global controls
    clearAllErrors,
    setAllLoading,
    setLoading,

    // Generic wrapper
    withLoading
  }
}
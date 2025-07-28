export const useLoading = () => {
  const uiStore = useUIStore()

  const startLoading = (key?: string) => {
    uiStore.setLoading(true)
  }

  const stopLoading = (key?: string) => {
    uiStore.setLoading(false)
  }

  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    key?: string
  ): Promise<T> => {
    try {
      startLoading(key)
      return await asyncFn()
    } finally {
      stopLoading(key)
    }
  }

  return {
    isLoading: uiStore.loading,
    startLoading,
    stopLoading,
    withLoading
  }
}
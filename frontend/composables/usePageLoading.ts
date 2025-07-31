/**
 * Page Loading Composable
 * Manages loading states for entire pages and page sections
 */

interface PageLoadingState {
    isInitialLoading: boolean
    isRefreshing: boolean
    isLoadingMore: boolean
    hasError: boolean
    error: any
    lastLoadTime: number
    loadingProgress: number
    sections: Record<string, SectionLoadingState>
}

interface SectionLoadingState {
    loading: boolean
    error: any
    lastLoadTime: number
    retryCount: number
    data: any
}

interface PageLoadingOptions {
    showSkeleton?: boolean
    showProgress?: boolean
    enableRefresh?: boolean
    enableLoadMore?: boolean
    autoRetry?: boolean
    maxRetries?: number
    retryDelay?: number
    cacheTimeout?: number
}

interface LoadMoreOptions {
    threshold?: number
    pageSize?: number
    resetOnRefresh?: boolean
}

export const usePageLoading = (
    pageKey: string,
    options: PageLoadingOptions = {}
) => {
    const {
        showSkeleton = true,
        showProgress = false,
        enableRefresh = true,
        enableLoadMore = false,
        autoRetry = true,
        maxRetries = 3,
        retryDelay = 1000,
        cacheTimeout = 5 * 60 * 1000 // 5 minutes
    } = options

    const { withLoading, withLoadingRetry } = useLoading()

    // Page loading state
    const pageState = ref<PageLoadingState>({
        isInitialLoading: false,
        isRefreshing: false,
        isLoadingMore: false,
        hasError: false,
        error: null,
        lastLoadTime: 0,
        loadingProgress: 0,
        sections: {}
    })

    // Data storage
    const pageData = ref<any>(null)
    const loadMoreData = ref<any[]>([])
    const currentPage = ref(1)
    const hasMoreData = ref(true)

    // Computed states
    const isLoading = computed(() =>
        pageState.value.isInitialLoading ||
        pageState.value.isRefreshing ||
        pageState.value.isLoadingMore
    )

    const canRefresh = computed(() =>
        enableRefresh && !isLoading.value
    )

    const canLoadMore = computed(() =>
        enableLoadMore &&
        !isLoading.value &&
        hasMoreData.value
    )

    const shouldShowSkeleton = computed(() =>
        showSkeleton &&
        pageState.value.isInitialLoading &&
        !pageData.value
    )

    const shouldShowProgress = computed(() =>
        showProgress &&
        (pageState.value.isRefreshing || pageState.value.isLoadingMore)
    )

    const isStale = computed(() => {
        if (!pageState.value.lastLoadTime) return true
        return Date.now() - pageState.value.lastLoadTime > cacheTimeout
    })

    // Initial page load
    const loadPage = async <T>(
        loadFn: () => Promise<T>,
        options: { force?: boolean; showLoading?: boolean } = {}
    ): Promise<T | null> => {
        const { force = false, showLoading = true } = options

        // Skip if already loaded and not forced
        if (!force && pageData.value && !isStale.value) {
            return pageData.value
        }

        try {
            pageState.value.isInitialLoading = showLoading
            pageState.value.hasError = false
            pageState.value.error = null
            pageState.value.loadingProgress = 0

            const loadingKey = `page-${pageKey}`

            const result = await withLoadingRetry(
                async () => {
                    // Simulate progress updates
                    if (showProgress) {
                        const progressInterval = setInterval(() => {
                            if (pageState.value.loadingProgress < 90) {
                                pageState.value.loadingProgress += Math.random() * 20
                            }
                        }, 200)

                        try {
                            const data = await loadFn()
                            pageState.value.loadingProgress = 100
                            return data
                        } finally {
                            clearInterval(progressInterval)
                        }
                    } else {
                        return await loadFn()
                    }
                },
                {
                    key: loadingKey,
                    maxRetries: autoRetry ? maxRetries : 0,
                    retryDelay,
                    type: showProgress ? 'progress' : 'spinner',
                    message: 'Cargando página...'
                }
            )

            pageData.value = result
            pageState.value.lastLoadTime = Date.now()
            currentPage.value = 1
            loadMoreData.value = []

            return result
        } catch (error) {
            pageState.value.hasError = true
            pageState.value.error = error
            console.error(`Page load error for ${pageKey}:`, error)
            return null
        } finally {
            pageState.value.isInitialLoading = false
            pageState.value.loadingProgress = 0
        }
    }

    // Refresh page data
    const refreshPage = async <T>(
        loadFn: () => Promise<T>
    ): Promise<T | null> => {
        if (!canRefresh.value) return null

        try {
            pageState.value.isRefreshing = true
            pageState.value.hasError = false
            pageState.value.error = null

            const result = await withLoading(
                loadFn,
                {
                    key: `refresh-${pageKey}`,
                    type: 'spinner',
                    message: 'Actualizando...',
                    showGlobalIndicator: false
                }
            )

            pageData.value = result
            pageState.value.lastLoadTime = Date.now()

            // Reset load more state
            currentPage.value = 1
            loadMoreData.value = []
            hasMoreData.value = true

            return result
        } catch (error) {
            pageState.value.hasError = true
            pageState.value.error = error
            console.error(`Page refresh error for ${pageKey}:`, error)
            return null
        } finally {
            pageState.value.isRefreshing = false
        }
    }

    // Load more data (pagination)
    const loadMore = async <T>(
        loadMoreFn: (page: number) => Promise<T[]>,
        options: LoadMoreOptions = {}
    ): Promise<T[] | null> => {
        const { pageSize = 20, resetOnRefresh = true } = options

        if (!canLoadMore.value) return null

        try {
            pageState.value.isLoadingMore = true
            const nextPage = currentPage.value + 1

            const result = await withLoading(
                () => loadMoreFn(nextPage),
                {
                    key: `load-more-${pageKey}`,
                    type: 'spinner',
                    message: 'Cargando más...',
                    showGlobalIndicator: false
                }
            )

            if (result && result.length > 0) {
                loadMoreData.value.push(...result)
                currentPage.value = nextPage

                // Check if there's more data
                if (result.length < pageSize) {
                    hasMoreData.value = false
                }
            } else {
                hasMoreData.value = false
            }

            return result
        } catch (error) {
            console.error(`Load more error for ${pageKey}:`, error)
            return null
        } finally {
            pageState.value.isLoadingMore = false
        }
    }

    // Load page section
    const loadSection = async <T>(
        sectionKey: string,
        loadFn: () => Promise<T>,
        options: { cache?: boolean; retries?: number } = {}
    ): Promise<T | null> => {
        const { cache = true, retries = maxRetries } = options

        // Initialize section state if not exists
        if (!pageState.value.sections[sectionKey]) {
            pageState.value.sections[sectionKey] = {
                loading: false,
                error: null,
                lastLoadTime: 0,
                retryCount: 0,
                data: null
            }
        }

        const section = pageState.value.sections[sectionKey]

        // Return cached data if available and not stale
        if (cache && section.data &&
            Date.now() - section.lastLoadTime < cacheTimeout) {
            return section.data
        }

        try {
            section.loading = true
            section.error = null

            const result = await withLoadingRetry(
                loadFn,
                {
                    key: `section-${pageKey}-${sectionKey}`,
                    maxRetries: retries,
                    retryDelay,
                    type: 'skeleton',
                    showGlobalIndicator: false
                }
            )

            section.data = result
            section.lastLoadTime = Date.now()
            section.retryCount = 0

            return result
        } catch (error) {
            section.error = error
            section.retryCount++
            console.error(`Section load error for ${pageKey}.${sectionKey}:`, error)
            return null
        } finally {
            section.loading = false
        }
    }

    // Retry failed operations
    const retryPage = async <T>(loadFn: () => Promise<T>): Promise<T | null> => {
        return await loadPage(loadFn, { force: true })
    }

    const retrySection = async <T>(
        sectionKey: string,
        loadFn: () => Promise<T>
    ): Promise<T | null> => {
        const section = pageState.value.sections[sectionKey]
        if (section) {
            section.data = null // Clear cached data to force reload
        }
        return await loadSection(sectionKey, loadFn, { cache: false })
    }

    // Clear page data
    const clearPage = () => {
        pageData.value = null
        loadMoreData.value = []
        pageState.value = {
            isInitialLoading: false,
            isRefreshing: false,
            isLoadingMore: false,
            hasError: false,
            error: null,
            lastLoadTime: 0,
            loadingProgress: 0,
            sections: {}
        }
        currentPage.value = 1
        hasMoreData.value = true
    }

    // Clear section data
    const clearSection = (sectionKey: string) => {
        if (pageState.value.sections[sectionKey]) {
            delete pageState.value.sections[sectionKey]
        }
    }

    // Get section state
    const getSectionState = (sectionKey: string) => {
        return pageState.value.sections[sectionKey] || {
            loading: false,
            error: null,
            lastLoadTime: 0,
            retryCount: 0,
            data: null
        }
    }

    // Check if section is loading
    const isSectionLoading = (sectionKey: string): boolean => {
        return getSectionState(sectionKey).loading
    }

    // Check if section has error
    const hasSectionError = (sectionKey: string): boolean => {
        return !!getSectionState(sectionKey).error
    }

    // Get section data
    const getSectionData = <T>(sectionKey: string): T | null => {
        return getSectionState(sectionKey).data
    }

    // Combined data getter
    const getAllData = computed(() => {
        return {
            main: pageData.value,
            loadMore: loadMoreData.value,
            sections: Object.fromEntries(
                Object.entries(pageState.value.sections).map(([key, section]) => [
                    key,
                    section.data
                ])
            )
        }
    })

    // Auto-refresh functionality
    const setupAutoRefresh = (
        loadFn: () => Promise<any>,
        interval: number = 30000
    ) => {
        if (!import.meta.client) return

        const refreshTimer = setInterval(async () => {
            if (!isLoading.value && !document.hidden) {
                await refreshPage(loadFn)
            }
        }, interval)

        // Cleanup on unmount
        onUnmounted(() => {
            clearInterval(refreshTimer)
        })

        return refreshTimer
    }

    // Infinite scroll setup
    const setupInfiniteScroll = (
        loadMoreFn: (page: number) => Promise<any[]>,
        options: LoadMoreOptions = {}
    ) => {
        const { threshold = 200 } = options

        if (!import.meta.client) return

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement

            if (scrollHeight - scrollTop - clientHeight < threshold && canLoadMore.value) {
                loadMore(loadMoreFn, options)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })

        onUnmounted(() => {
            window.removeEventListener('scroll', handleScroll)
        })
    }

    // Page visibility handling
    const setupVisibilityRefresh = (loadFn: () => Promise<any>) => {
        if (!import.meta.client) return

        const handleVisibilityChange = () => {
            if (!document.hidden && isStale.value && !isLoading.value) {
                refreshPage(loadFn)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        onUnmounted(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        })
    }

    return {
        // State
        pageState: readonly(pageState),
        pageData: readonly(pageData),
        loadMoreData: readonly(loadMoreData),
        currentPage: readonly(currentPage),
        hasMoreData: readonly(hasMoreData),

        // Computed
        isLoading,
        canRefresh,
        canLoadMore,
        shouldShowSkeleton,
        shouldShowProgress,
        isStale,
        getAllData,

        // Core methods
        loadPage,
        refreshPage,
        loadMore,
        retryPage,

        // Section methods
        loadSection,
        retrySection,
        getSectionState,
        isSectionLoading,
        hasSectionError,
        getSectionData,

        // Cleanup methods
        clearPage,
        clearSection,

        // Auto features
        setupAutoRefresh,
        setupInfiniteScroll,
        setupVisibilityRefresh
    }
}
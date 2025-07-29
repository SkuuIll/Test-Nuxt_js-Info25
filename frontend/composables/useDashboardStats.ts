interface DashboardStats {
    total_posts: number
    total_users: number
    total_comments: number
    published_posts: number
    draft_posts: number
    pending_comments: number
    active_users: number
    popular_posts: Array<{
        id: number
        title: string
        comments_count: number
        author: string
        published_date: string
    }>
    recent_activity: Array<{
        id: number
        username: string
        action: string
        action_display: string
        description: string
        timestamp: string
    }>
    monthly_stats: {
        posts_by_month: Array<{ month: string; count: number }>
        users_by_month: Array<{ month: string; count: number }>
        comments_by_month: Array<{ month: string; count: number }>
    }
}

interface DashboardSummary {
    totals: {
        posts: number
        users: number
        comments: number
        categories: number
    }
    today: {
        posts: number
        comments: number
        users: number
    }
    week: {
        posts: number
        comments: number
        users: number
    }
    pending: {
        draft_posts: number
        pending_comments: number
    }
}

export const useDashboardStats = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    const { accessToken } = useDashboardAuth()

    // State
    const stats = ref<DashboardStats | null>(null)
    const summary = ref<DashboardSummary | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Computed
    const pendingCommentsCount = computed(() =>
        summary.value?.pending.pending_comments || 0
    )

    // Fetch dashboard stats
    const fetchStats = async () => {
        if (!accessToken.value) return

        loading.value = true
        error.value = null

        try {
            const response = await $fetch<{ error: boolean; data: DashboardStats }>(`${apiBase}/api/v1/dashboard/stats/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`
                }
            })

            if (!response.error) {
                stats.value = response.data
            } else {
                error.value = 'Error al cargar estadísticas'
            }
        } catch (err: any) {
            console.error('Stats fetch error:', err)
            error.value = err.data?.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Fetch dashboard summary
    const fetchSummary = async () => {
        if (!accessToken.value) return

        try {
            const response = await $fetch<{ error: boolean; data: DashboardSummary }>(`${apiBase}/api/v1/dashboard/stats/summary/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`
                }
            })

            if (!response.error) {
                summary.value = response.data
            }
        } catch (err: any) {
            console.error('Summary fetch error:', err)
        }
    }

    // Fetch growth stats
    const fetchGrowthStats = async () => {
        if (!accessToken.value) return

        try {
            const response = await $fetch(`${apiBase}/api/v1/dashboard/stats/growth/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`
                }
            })

            return response.data
        } catch (err: any) {
            console.error('Growth stats fetch error:', err)
            return null
        }
    }

    // Fetch user stats
    const fetchUserStats = async () => {
        if (!accessToken.value) return

        try {
            const response = await $fetch(`${apiBase}/api/v1/dashboard/stats/users/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`
                }
            })

            return response.data
        } catch (err: any) {
            console.error('User stats fetch error:', err)
            return null
        }
    }

    // Fetch content stats
    const fetchContentStats = async () => {
        if (!accessToken.value) return

        try {
            const response = await $fetch(`${apiBase}/api/v1/dashboard/stats/content/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken.value}`
                }
            })

            return response.data
        } catch (err: any) {
            console.error('Content stats fetch error:', err)
            return null
        }
    }

    // Auto-refresh summary periodically
    let refreshInterval: NodeJS.Timeout | null = null

    const startAutoRefresh = (intervalMs: number = 60000) => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
        }

        refreshInterval = setInterval(() => {
            fetchSummary()
        }, intervalMs)
    }

    const stopAutoRefresh = () => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
        }
    }

    // Cleanup on unmount
    onUnmounted(() => {
        stopAutoRefresh()
    })

    return {
        stats: readonly(stats),
        summary: readonly(summary),
        loading: readonly(loading),
        error: readonly(error),
        pendingCommentsCount,
        fetchStats,
        fetchSummary,
        fetchGrowthStats,
        fetchUserStats,
        fetchContentStats,
        startAutoRefresh,
        stopAutoRefresh
    }
}
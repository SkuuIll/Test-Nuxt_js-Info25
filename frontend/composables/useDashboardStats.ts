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
    const { apiCall, isAuthenticated } = useDashboardAuth()

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
        if (!isAuthenticated()) return

        loading.value = true
        error.value = null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/stats/`)

            if (response) {
                stats.value = response
                console.log('✅ Dashboard stats loaded successfully')
            } else {
                error.value = 'Error al cargar estadísticas'
            }
        } catch (err: any) {
            console.error('Stats fetch error:', err)
            error.value = err.statusMessage || err.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Fetch dashboard summary
    const fetchSummary = async () => {
        if (!isAuthenticated()) return

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/stats/summary/`)

            if (response) {
                summary.value = response
                console.log('✅ Dashboard summary loaded successfully')
            }
        } catch (err: any) {
            console.error('Summary fetch error:', err)
            // Don't set error for summary as it's not critical
        }
    }

    // Fetch growth stats
    const fetchGrowthStats = async () => {
        if (!isAuthenticated()) return null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/stats/growth/`)
            return response || null
        } catch (err: any) {
            console.error('Growth stats fetch error:', err)
            return null
        }
    }

    // Fetch user stats
    const fetchUserStats = async () => {
        if (!isAuthenticated()) return null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/stats/users/`)
            return response || null
        } catch (err: any) {
            console.error('User stats fetch error:', err)
            return null
        }
    }

    // Fetch content stats
    const fetchContentStats = async () => {
        if (!isAuthenticated()) return null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/stats/content/`)
            return response || null
        } catch (err: any) {
            console.error('Content stats fetch error:', err)
            return null
        }
    }

    // Fetch popular posts
    const fetchPopularPosts = async (limit: number = 10) => {
        if (!isAuthenticated()) return null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/stats/popular-posts/?limit=${limit}`)
            return response || null
        } catch (err: any) {
            console.error('Popular posts fetch error:', err)
            return null
        }
    }

    // Fetch recent activity
    const fetchRecentActivity = async (limit: number = 20) => {
        if (!isAuthenticated()) return null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/stats/recent-activity/?limit=${limit}`)
            return response || null
        } catch (err: any) {
            console.error('Recent activity fetch error:', err)
            return null
        }
    }

    // Fetch monthly stats
    const fetchMonthlyStats = async () => {
        if (!isAuthenticated()) return null

        try {
            const response = await apiCall(`${apiBase}/api/v1/dashboard/stats/monthly/`)
            return response || null
        } catch (err: any) {
            console.error('Monthly stats fetch error:', err)
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

    // Load all dashboard data
    const loadDashboardData = async () => {
        if (!isAuthenticated()) return

        loading.value = true
        error.value = null

        try {
            // Load main stats and summary in parallel
            await Promise.all([
                fetchStats(),
                fetchSummary()
            ])

            console.log('✅ Dashboard data loaded successfully')
        } catch (err: any) {
            console.error('Dashboard data load error:', err)
            error.value = 'Error cargando datos del dashboard'
        } finally {
            loading.value = false
        }
    }

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
        fetchPopularPosts,
        fetchRecentActivity,
        fetchMonthlyStats,
        loadDashboardData,
        startAutoRefresh,
        stopAutoRefresh
    }
}
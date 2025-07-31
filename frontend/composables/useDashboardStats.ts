import type { Post, User, Comment } from '~/types'
import { handleApiError } from '~/utils/errorHandling'

interface DashboardOverview {
    total_posts: number
    total_users: number
    total_comments: number
    total_categories: number
    published_posts: number
    draft_posts: number
    archived_posts: number
    pending_comments: number
    approved_comments: number
    rejected_comments: number
    active_users: number
    staff_users: number
    featured_posts: number
}

interface DashboardTrends {
    posts_trend: {
        current: number
        previous: number
        change_percent: number
        trend: 'up' | 'down' | 'stable'
    }
    users_trend: {
        current: number
        previous: number
        change_percent: number
        trend: 'up' | 'down' | 'stable'
    }
    comments_trend: {
        current: number
        previous: number
        change_percent: number
        trend: 'up' | 'down' | 'stable'
    }
}

interface PopularPost {
    id: number
    title: string
    slug: string
    views_count: number
    comments_count: number
    author: {
        id: number
        username: string
        first_name: string
        last_name: string
    }
    published_at: string
    category: {
        id: number
        name: string
    }
}

interface RecentActivity {
    id: number
    user: {
        id: number
        username: string
        first_name: string
        last_name: string
    }
    action_type: 'post_created' | 'post_published' | 'comment_added' | 'user_registered' | 'post_updated'
    action_display: string
    description: string
    target_type: 'post' | 'comment' | 'user'
    target_id: number
    target_title?: string
    timestamp: string
    ip_address?: string
}

interface TimeSeriesData {
    date: string
    posts: number
    users: number
    comments: number
    views: number
}

interface DashboardAnalytics {
    overview: DashboardOverview
    trends: DashboardTrends
    popular_posts: PopularPost[]
    recent_activity: RecentActivity[]
    time_series: TimeSeriesData[]
    top_categories: Array<{
        id: number
        name: string
        posts_count: number
        percentage: number
    }>
    top_authors: Array<{
        id: number
        username: string
        first_name: string
        last_name: string
        posts_count: number
        comments_count: number
    }>
}

interface DashboardSummary {
    today: {
        posts: number
        comments: number
        users: number
        views: number
    }
    week: {
        posts: number
        comments: number
        users: number
        views: number
    }
    month: {
        posts: number
        comments: number
        users: number
        views: number
    }
    pending_moderation: {
        comments: number
        posts: number
    }
}

interface SystemHealth {
    database_status: 'healthy' | 'warning' | 'error'
    cache_status: 'healthy' | 'warning' | 'error'
    storage_usage: {
        used: number
        total: number
        percentage: number
    }
    memory_usage: {
        used: number
        total: number
        percentage: number
    }
    response_time: number
    uptime: number
}

export const useDashboardStats = () => {
    const { dashboardApiCall, requirePermission } = useDashboardAuth()
    // Error handlers imported from utils to avoid circular dependencies
    const { dashboardLoading } = useLoading()

    // State
    const analytics = ref<DashboardAnalytics | null>(null)
    const summary = ref<DashboardSummary | null>(null)
    const systemHealth = ref<SystemHealth | null>(null)
    const loading = computed(() => dashboardLoading.loading.value)
    const error = ref<string | null>(null)
    const lastUpdated = ref<Date | null>(null)
    const autoRefreshEnabled = ref(false)

    // Computed
    const overview = computed(() => analytics.value?.overview || null)
    const trends = computed(() => analytics.value?.trends || null)
    const popularPosts = computed(() => analytics.value?.popular_posts || [])
    const recentActivity = computed(() => analytics.value?.recent_activity || [])
    const timeSeriesData = computed(() => analytics.value?.time_series || [])
    const topCategories = computed(() => analytics.value?.top_categories || [])
    const topAuthors = computed(() => analytics.value?.top_authors || [])

    const pendingModerationCount = computed(() =>
        (summary.value?.pending_moderation.comments || 0) +
        (summary.value?.pending_moderation.posts || 0)
    )

    const isSystemHealthy = computed(() =>
        systemHealth.value?.database_status === 'healthy' &&
        systemHealth.value?.cache_status === 'healthy'
    )

    const storageWarning = computed(() =>
        (systemHealth.value?.storage_usage.percentage || 0) > 80
    )

    const memoryWarning = computed(() =>
        (systemHealth.value?.memory_usage.percentage || 0) > 80
    )

    // Fetch dashboard analytics
    const fetchAnalytics = async () => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📊 Fetching dashboard analytics...')

                // Require permission to view stats
                await requirePermission('can_view_stats')

                const response = await dashboardApiCall<DashboardAnalytics>('/dashboard/analytics/')

                analytics.value = response
                lastUpdated.value = new Date()

                console.log('✅ Dashboard analytics fetched successfully')
                return response
            } catch (err: any) {
                console.error('❌ Dashboard analytics fetch error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Analytics Fetch Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Fetch dashboard summary
    const fetchSummary = async () => {
        try {
            console.log('📋 Fetching dashboard summary...')

            // Require permission to view stats
            await requirePermission('can_view_stats')

            const response = await dashboardApiCall<DashboardSummary>('/dashboard/summary/')

            summary.value = response
            console.log('✅ Dashboard summary fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ Dashboard summary fetch error:', err)
            // Don't throw error for summary as it's not critical
            return null
        }
    }

    // Fetch system health
    const fetchSystemHealth = async () => {
        try {
            console.log('🏥 Fetching system health...')

            // Require permission to view stats
            await requirePermission('can_view_stats')

            const response = await dashboardApiCall<SystemHealth>('/dashboard/system-health/')

            systemHealth.value = response
            console.log('✅ System health fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ System health fetch error:', err)
            // Don't throw error for system health as it's not critical
            return null
        }
    }

    // Fetch time series data for charts
    const fetchTimeSeriesData = async (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => {
        try {
            console.log('📈 Fetching time series data for period:', period)

            // Require permission to view stats
            await requirePermission('can_view_stats')

            const response = await dashboardApiCall<TimeSeriesData[]>('/dashboard/time-series/', {
                params: { period }
            })

            console.log('✅ Time series data fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ Time series data fetch error:', err)

            const errorInfo = handleApiError(err, 'Time Series Data Fetch Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Fetch popular content
    const fetchPopularContent = async (type: 'posts' | 'categories' | 'authors' = 'posts', limit: number = 10) => {
        try {
            console.log('🔥 Fetching popular content:', type, 'limit:', limit)

            // Require permission to view stats
            await requirePermission('can_view_stats')

            const response = await dashboardApiCall(`/dashboard/popular/${type}/`, {
                params: { limit }
            })

            console.log('✅ Popular content fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ Popular content fetch error:', err)

            const errorInfo = handleApiError(err, 'Popular Content Fetch Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Fetch recent activity
    const fetchRecentActivity = async (limit: number = 20, type?: string) => {
        try {
            console.log('🕐 Fetching recent activity, limit:', limit, 'type:', type)

            // Require permission to view stats
            await requirePermission('can_view_stats')

            const params: Record<string, any> = { limit }
            if (type) params.type = type

            const response = await dashboardApiCall<RecentActivity[]>('/dashboard/activity/', {
                params
            })

            console.log('✅ Recent activity fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ Recent activity fetch error:', err)

            const errorInfo = handleApiError(err, 'Recent Activity Fetch Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Fetch dashboard reports
    const fetchReport = async (reportType: 'posts' | 'users' | 'comments' | 'engagement', dateRange?: { from: string, to: string }) => {
        try {
            console.log('📄 Fetching dashboard report:', reportType, dateRange)

            // Require permission to view stats
            await requirePermission('can_view_stats')

            const params: Record<string, any> = {}
            if (dateRange) {
                params.date_from = dateRange.from
                params.date_to = dateRange.to
            }

            const response = await dashboardApiCall(`/dashboard/reports/${reportType}/`, {
                params
            })

            console.log('✅ Dashboard report fetched successfully')
            return response
        } catch (err: any) {
            console.error('❌ Dashboard report fetch error:', err)

            const errorInfo = handleApiError(err, 'Dashboard Report Fetch Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Export dashboard data
    const exportData = async (format: 'csv' | 'json' | 'pdf', type: 'analytics' | 'summary' | 'reports') => {
        try {
            console.log('📤 Exporting dashboard data:', format, type)

            // Require permission to view stats
            await requirePermission('can_view_stats')

            const response = await dashboardApiCall(`/dashboard/export/${type}/`, {
                params: { format },
                responseType: format === 'pdf' ? 'blob' : 'json'
            })

            console.log('✅ Dashboard data exported successfully')
            return response
        } catch (err: any) {
            console.error('❌ Dashboard data export error:', err)

            const errorInfo = handleApiError(err, 'Dashboard Data Export Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Auto-refresh functionality
    let refreshInterval: NodeJS.Timeout | null = null

    const startAutoRefresh = (intervalMs: number = 300000) => { // 5 minutes default
        if (refreshInterval) {
            clearInterval(refreshInterval)
        }

        autoRefreshEnabled.value = true
        console.log('🔄 Starting auto-refresh with interval:', intervalMs, 'ms')

        refreshInterval = setInterval(async () => {
            if (autoRefreshEnabled.value) {
                console.log('🔄 Auto-refreshing dashboard data...')
                try {
                    await Promise.all([
                        fetchSummary(),
                        fetchSystemHealth()
                    ])
                    console.log('✅ Auto-refresh completed successfully')
                } catch (error) {
                    console.warn('⚠️ Auto-refresh failed:', error)
                }
            }
        }, intervalMs)
    }

    const stopAutoRefresh = () => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
            refreshInterval = null
        }
        autoRefreshEnabled.value = false
        console.log('🛑 Auto-refresh stopped')
    }

    const toggleAutoRefresh = (intervalMs: number = 300000) => {
        if (autoRefreshEnabled.value) {
            stopAutoRefresh()
        } else {
            startAutoRefresh(intervalMs)
        }
    }

    // Load all dashboard data
    const loadDashboardData = async (includeSystemHealth: boolean = true) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('🚀 Loading complete dashboard data...')

                // Load core data in parallel
                const promises = [
                    fetchAnalytics(),
                    fetchSummary()
                ]

                if (includeSystemHealth) {
                    promises.push(fetchSystemHealth())
                }

                await Promise.all(promises)

                lastUpdated.value = new Date()
                console.log('✅ Dashboard data loaded successfully')

                return {
                    analytics: analytics.value,
                    summary: summary.value,
                    systemHealth: systemHealth.value
                }
            } catch (err: any) {
                console.error('❌ Dashboard data load error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Data Load Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Refresh specific data sections
    const refreshSection = async (section: 'analytics' | 'summary' | 'health' | 'all') => {
        try {
            console.log('🔄 Refreshing section:', section)

            switch (section) {
                case 'analytics':
                    await fetchAnalytics()
                    break
                case 'summary':
                    await fetchSummary()
                    break
                case 'health':
                    await fetchSystemHealth()
                    break
                case 'all':
                    await loadDashboardData()
                    break
            }

            console.log('✅ Section refreshed successfully:', section)
        } catch (err: any) {
            console.error('❌ Section refresh error:', err)
            throw err
        }
    }

    // Get data freshness info
    const getDataFreshness = () => {
        if (!lastUpdated.value) return null

        const now = new Date()
        const diffMs = now.getTime() - lastUpdated.value.getTime()
        const diffMinutes = Math.floor(diffMs / 60000)

        return {
            lastUpdated: lastUpdated.value,
            minutesAgo: diffMinutes,
            isStale: diffMinutes > 10, // Consider stale after 10 minutes
            isFresh: diffMinutes < 2   // Consider fresh within 2 minutes
        }
    }

    // Format numbers for display
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M'
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K'
        }
        return num.toString()
    }

    // Calculate percentage change
    const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    }

    // Get trend direction
    const getTrendDirection = (current: number, previous: number): 'up' | 'down' | 'stable' => {
        const change = calculatePercentageChange(current, previous)
        if (Math.abs(change) < 1) return 'stable'
        return change > 0 ? 'up' : 'down'
    }

    // Cleanup on unmount
    onUnmounted(() => {
        stopAutoRefresh()
    })

    // Watch for authentication changes
    watch(() => autoRefreshEnabled.value, (enabled) => {
        if (!enabled) {
            stopAutoRefresh()
        }
    })

    return {
        // State
        analytics: readonly(analytics),
        summary: readonly(summary),
        systemHealth: readonly(systemHealth),
        loading: readonly(loading),
        error: readonly(error),
        lastUpdated: readonly(lastUpdated),
        autoRefreshEnabled: readonly(autoRefreshEnabled),

        // Computed
        overview: readonly(overview),
        trends: readonly(trends),
        popularPosts: readonly(popularPosts),
        recentActivity: readonly(recentActivity),
        timeSeriesData: readonly(timeSeriesData),
        topCategories: readonly(topCategories),
        topAuthors: readonly(topAuthors),
        pendingModerationCount: readonly(pendingModerationCount),
        isSystemHealthy: readonly(isSystemHealthy),
        storageWarning: readonly(storageWarning),
        memoryWarning: readonly(memoryWarning),

        // Core Data Fetching
        fetchAnalytics,
        fetchSummary,
        fetchSystemHealth,
        loadDashboardData,

        // Specific Data Fetching
        fetchTimeSeriesData,
        fetchPopularContent,
        fetchRecentActivity,
        fetchReport,

        // Data Management
        refreshSection,
        exportData,

        // Auto-refresh
        startAutoRefresh,
        stopAutoRefresh,
        toggleAutoRefresh,

        // Utilities
        getDataFreshness,
        formatNumber,
        calculatePercentageChange,
        getTrendDirection
    }
}
interface DashboardNotification {
    id: number
    type: 'comment' | 'post' | 'user' | 'system'
    title: string
    message: string
    read: boolean
    created_at: string
    link?: string
    data?: any
}

export const useDashboardNotifications = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    const { accessToken } = useDashboardAuth()

    // State
    const notifications = ref<DashboardNotification[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Mock notifications for now (replace with real API calls later)
    const mockNotifications: DashboardNotification[] = [
        {
            id: 1,
            type: 'comment',
            title: 'Nuevo comentario',
            message: 'Hay un nuevo comentario pendiente de moderación',
            read: false,
            created_at: new Date().toISOString(),
            link: '/dashboard/comments?filter=pending'
        },
        {
            id: 2,
            type: 'post',
            title: 'Post publicado',
            message: 'Se ha publicado un nuevo post exitosamente',
            read: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            link: '/dashboard/posts'
        },
        {
            id: 3,
            type: 'user',
            title: 'Nuevo usuario',
            message: 'Se ha registrado un nuevo usuario en el sistema',
            read: false,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            link: '/dashboard/users'
        }
    ]

    // Initialize with mock data
    onMounted(() => {
        notifications.value = mockNotifications
    })

    // Fetch notifications (placeholder for real implementation)
    const fetchNotifications = async () => {
        if (!accessToken.value) return

        loading.value = true
        error.value = null

        try {
            // TODO: Replace with real API call
            // const response = await $fetch(`${apiBase}/api/v1/dashboard/notifications/`, {
            //   headers: {
            //     'Authorization': `Bearer ${accessToken.value}`
            //   }
            // })

            // For now, use mock data
            await new Promise(resolve => setTimeout(resolve, 500))
            notifications.value = mockNotifications
        } catch (err: any) {
            console.error('Notifications fetch error:', err)
            error.value = err.data?.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Mark notification as read
    const markAsRead = async (notificationId: number) => {
        try {
            // TODO: Replace with real API call
            // await $fetch(`${apiBase}/api/v1/dashboard/notifications/${notificationId}/read/`, {
            //   method: 'POST',
            //   headers: {
            //     'Authorization': `Bearer ${accessToken.value}`
            //   }
            // })

            // For now, update locally
            const notification = notifications.value.find(n => n.id === notificationId)
            if (notification) {
                notification.read = true
            }
        } catch (err: any) {
            console.error('Mark as read error:', err)
        }
    }

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            // TODO: Replace with real API call
            // await $fetch(`${apiBase}/api/v1/dashboard/notifications/mark-all-read/`, {
            //   method: 'POST',
            //   headers: {
            //     'Authorization': `Bearer ${accessToken.value}`
            //   }
            // })

            // For now, update locally
            notifications.value.forEach(notification => {
                notification.read = true
            })
        } catch (err: any) {
            console.error('Mark all as read error:', err)
        }
    }

    // Add new notification (for real-time updates)
    const addNotification = (notification: Omit<DashboardNotification, 'id'>) => {
        const newNotification: DashboardNotification = {
            ...notification,
            id: Date.now() // Simple ID generation
        }

        notifications.value.unshift(newNotification)
    }

    // Remove notification
    const removeNotification = (notificationId: number) => {
        const index = notifications.value.findIndex(n => n.id === notificationId)
        if (index > -1) {
            notifications.value.splice(index, 1)
        }
    }

    // Get unread count
    const unreadCount = computed(() =>
        notifications.value.filter(n => !n.read).length
    )

    // Auto-refresh notifications periodically
    let refreshInterval: NodeJS.Timeout | null = null

    const startAutoRefresh = (intervalMs: number = 30000) => {
        if (refreshInterval) {
            clearInterval(refreshInterval)
        }

        refreshInterval = setInterval(() => {
            fetchNotifications()
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
        notifications: readonly(notifications),
        loading: readonly(loading),
        error: readonly(error),
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
        startAutoRefresh,
        stopAutoRefresh
    }
}
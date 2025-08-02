/**
 * Pinia store for notifications management
 */
import { defineStore } from 'pinia'
import type {
    Notification,
    NotificationPreferences,
    NotificationStats,
    NotificationFilters,
    BulkNotificationAction,
    SystemAnnouncement,
    WebSocketMessage,
    NotificationError
} from '~/types/notifications'

export const useNotificationStore = defineStore('notifications', () => {
    // State
    const notifications = ref<Notification[]>([])
    const unreadCount = ref(0)
    const totalCount = ref(0)
    const preferences = ref<NotificationPreferences | null>(null)
    const stats = ref<NotificationStats | null>(null)
    const loading = ref(false)
    const error = ref<NotificationError | null>(null)

    // WebSocket connection state
    const isConnected = ref(false)
    const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
    const reconnectAttempts = ref(0)
    const maxReconnectAttempts = 5

    // Pagination state
    const currentPage = ref(1)
    const pageSize = ref(20)
    const hasNext = ref(false)
    const hasPrevious = ref(false)

    // Filters state
    const filters = ref<NotificationFilters>({
        include_read: true,
        include_dismissed: false,
        page: 1,
        page_size: 20
    })

    // WebSocket connection
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    // Composables
    const { $fetch } = useNuxtApp()
    const { isAuthenticated, user } = useAuthStore()
    const config = useRuntimeConfig()

    // Getters
    const unreadNotifications = computed(() =>
        notifications.value.filter(n => !n.is_read && !n.is_dismissed)
    )

    const recentNotifications = computed(() =>
        notifications.value.slice(0, 5)
    )

    const notificationsByType = computed(() => {
        const grouped: Record<string, Notification[]> = {}
        notifications.value.forEach(notification => {
            if (!grouped[notification.notification_type]) {
                grouped[notification.notification_type] = []
            }
            grouped[notification.notification_type].push(notification)
        })
        return grouped
    })

    const hasUnreadNotifications = computed(() => unreadCount.value > 0)

    // Actions
    const fetchNotifications = async (options: NotificationFilters = {}) => {
        try {
            loading.value = true
            error.value = null

            const mergedFilters = { ...filters.value, ...options }
            const searchParams = new URLSearchParams()

            Object.entries(mergedFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    searchParams.append(key, String(value))
                }
            })

            const response = await $fetch<any>(`/api/v1/notifications/?${searchParams.toString()}`)

            if (response.results) {
                if (options.page === 1 || !options.page) {
                    notifications.value = response.results
                } else {
                    notifications.value.push(...response.results)
                }

                totalCount.value = response.count || 0
                unreadCount.value = response.unread_count || 0
                hasNext.value = !!response.next
                hasPrevious.value = !!response.previous
                currentPage.value = options.page || 1
            }

            console.log(`✅ Fetched ${response.results?.length || 0} notifications`)

        } catch (err: any) {
            console.error('❌ Error fetching notifications:', err)
            error.value = {
                message: err.message || 'Error fetching notifications',
                code: err.statusCode || err.status,
                details: err
            }
        } finally {
            loading.value = false
        }
    }

    const fetchNotificationById = async (id: number): Promise<Notification | null> => {
        try {
            const notification = await $fetch<Notification>(`/api/v1/notifications/${id}/`)

            // Update the notification in the list if it exists
            const index = notifications.value.findIndex(n => n.id === id)
            if (index !== -1) {
                notifications.value[index] = notification
            }

            return notification
        } catch (err: any) {
            console.error(`❌ Error fetching notification ${id}:`, err)
            return null
        }
    }

    const markAsRead = async (notificationId: number): Promise<boolean> => {
        try {
            const response = await $fetch<any>(`/api/v1/notifications/${notificationId}/read/`, {
                method: 'POST'
            })

            if (response.success) {
                // Update local state
                const notification = notifications.value.find(n => n.id === notificationId)
                if (notification && !notification.is_read) {
                    notification.is_read = true
                    notification.read_at = new Date().toISOString()
                    unreadCount.value = Math.max(0, unreadCount.value - 1)
                }

                console.log(`✅ Marked notification ${notificationId} as read`)
                return true
            }

            return false
        } catch (err: any) {
            console.error(`❌ Error marking notification ${notificationId} as read:`, err)
            return false
        }
    }

    const markAllAsRead = async (): Promise<boolean> => {
        try {
            const response = await $fetch<any>('/api/v1/notifications/mark-all-read/', {
                method: 'POST'
            })

            if (response.success) {
                // Update local state
                notifications.value.forEach(notification => {
                    if (!notification.is_read) {
                        notification.is_read = true
                        notification.read_at = new Date().toISOString()
                    }
                })

                unreadCount.value = 0
                console.log(`✅ Marked ${response.count} notifications as read`)
                return true
            }

            return false
        } catch (err: any) {
            console.error('❌ Error marking all notifications as read:', err)
            return false
        }
    }

    const dismissNotification = async (notificationId: number): Promise<boolean> => {
        try {
            const response = await $fetch<any>(`/api/v1/notifications/${notificationId}/dismiss/`, {
                method: 'POST'
            })

            if (response.success) {
                // Remove from local state
                const index = notifications.value.findIndex(n => n.id === notificationId)
                if (index !== -1) {
                    const notification = notifications.value[index]
                    if (!notification.is_read) {
                        unreadCount.value = Math.max(0, unreadCount.value - 1)
                    }
                    notifications.value.splice(index, 1)
                    totalCount.value = Math.max(0, totalCount.value - 1)
                }

                console.log(`✅ Dismissed notification ${notificationId}`)
                return true
            }

            return false
        } catch (err: any) {
            console.error(`❌ Error dismissing notification ${notificationId}:`, err)
            return false
        }
    }

    const bulkAction = async (action: BulkNotificationAction): Promise<boolean> => {
        try {
            const response = await $fetch<any>('/api/v1/notifications/bulk-action/', {
                method: 'POST',
                body: action
            })

            if (response.success) {
                // Update local state based on action
                action.notification_ids.forEach(id => {
                    const notification = notifications.value.find(n => n.id === id)
                    if (notification) {
                        switch (action.action) {
                            case 'mark_read':
                                if (!notification.is_read) {
                                    notification.is_read = true
                                    notification.read_at = new Date().toISOString()
                                }
                                break
                            case 'mark_unread':
                                if (notification.is_read) {
                                    notification.is_read = false
                                    notification.read_at = undefined
                                }
                                break
                            case 'dismiss':
                                const index = notifications.value.findIndex(n => n.id === id)
                                if (index !== -1) {
                                    notifications.value.splice(index, 1)
                                }
                                break
                        }
                    }
                })

                unreadCount.value = response.unread_count || 0
                console.log(`✅ Bulk action ${action.action} completed for ${action.notification_ids.length} notifications`)
                return true
            }

            return false
        } catch (err: any) {
            console.error('❌ Error performing bulk action:', err)
            return false
        }
    }

    const fetchPreferences = async (): Promise<NotificationPreferences | null> => {
        try {
            const prefs = await $fetch<NotificationPreferences>('/api/v1/notifications/preferences/')
            preferences.value = prefs
            console.log('✅ Fetched notification preferences')
            return prefs
        } catch (err: any) {
            console.error('❌ Error fetching notification preferences:', err)
            return null
        }
    }

    const updatePreferences = async (updates: Partial<NotificationPreferences>): Promise<boolean> => {
        try {
            const updatedPrefs = await $fetch<NotificationPreferences>('/api/v1/notifications/preferences/', {
                method: 'PATCH',
                body: updates
            })

            preferences.value = updatedPrefs
            console.log('✅ Updated notification preferences')
            return true
        } catch (err: any) {
            console.error('❌ Error updating notification preferences:', err)
            return false
        }
    }

    const fetchStats = async (): Promise<NotificationStats | null> => {
        try {
            const statistics = await $fetch<NotificationStats>('/api/v1/notifications/stats/')
            stats.value = statistics
            console.log('✅ Fetched notification statistics')
            return statistics
        } catch (err: any) {
            console.error('❌ Error fetching notification statistics:', err)
            return null
        }
    }

    const fetchAdminStats = async (): Promise<any> => {
        try {
            const adminStats = await $fetch<any>('/api/v1/notifications/admin/stats/')
            console.log('✅ Fetched admin notification statistics')
            return adminStats
        } catch (err: any) {
            console.error('❌ Error fetching admin notification statistics:', err)
            return null
        }
    }

    const fetchUnreadCount = async (): Promise<number> => {
        try {
            const response = await $fetch<{ unread_count: number }>('/api/v1/notifications/unread-count/')
            unreadCount.value = response.unread_count
            return response.unread_count
        } catch (err: any) {
            console.error('❌ Error fetching unread count:', err)
            return 0
        }
    }

    const createSystemAnnouncement = async (announcement: SystemAnnouncement): Promise<boolean> => {
        try {
            const response = await $fetch<any>('/api/v1/notifications/announcements/create/', {
                method: 'POST',
                body: announcement
            })

            if (response.success) {
                console.log(`✅ Created system announcement: ${announcement.title}`)
                return true
            }

            return false
        } catch (err: any) {
            console.error('❌ Error creating system announcement:', err)
            return false
        }
    }

    // WebSocket methods
    const connectToNotifications = async (): Promise<void> => {
        if (!isAuthenticated.value || !user.value) {
            console.warn('⚠️ Cannot connect to notifications: User not authenticated')
            return
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log('🔌 Already connected to notifications WebSocket')
            return
        }

        try {
            connectionStatus.value = 'connecting'
            console.log('🔌 Connecting to notifications WebSocket...')

            // Get access token for WebSocket authentication
            const { tokenUtils } = useApi()
            const tokens = tokenUtils.getTokens()

            if (!tokens.access) {
                throw new Error('No access token available')
            }

            // Build WebSocket URL
            const wsUrl = config.public.wsBase || config.public.apiBase.replace('http', 'ws')
            const wsEndpoint = `${wsUrl}/ws/notifications/?token=${tokens.access}`

            ws = new WebSocket(wsEndpoint)

            ws.onopen = () => {
                console.log('✅ Connected to notifications WebSocket')
                connectionStatus.value = 'connected'
                isConnected.value = true
                reconnectAttempts.value = 0

                // Clear any existing reconnect timeout
                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout)
                    reconnectTimeout = null
                }
            }

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data)
                    handleWebSocketMessage(message)
                } catch (err) {
                    console.error('❌ Error parsing WebSocket message:', err)
                }
            }

            ws.onclose = (event) => {
                console.log('🔌 Notifications WebSocket disconnected:', event.code, event.reason)
                connectionStatus.value = 'disconnected'
                isConnected.value = false

                // Attempt to reconnect if not manually closed
                if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
                    scheduleReconnect()
                }
            }

            ws.onerror = (event) => {
                console.error('❌ Notifications WebSocket error:', event)
                connectionStatus.value = 'error'
                error.value = {
                    message: 'WebSocket connection error',
                    code: 'WEBSOCKET_ERROR'
                }
            }

        } catch (err: any) {
            console.error('❌ Failed to connect to notifications WebSocket:', err)
            connectionStatus.value = 'error'
            error.value = {
                message: err.message || 'Failed to connect to notifications',
                code: 'CONNECTION_FAILED'
            }
        }
    }

    const disconnectFromNotifications = (): void => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
        }

        if (ws) {
            ws.close(1000, 'Manual disconnect')
            ws = null
        }

        connectionStatus.value = 'disconnected'
        isConnected.value = false
        reconnectAttempts.value = 0
        console.log('🔌 Disconnected from notifications WebSocket')
    }

    const scheduleReconnect = (): void => {
        if (reconnectAttempts.value >= maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached')
            return
        }

        reconnectAttempts.value++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000) // Exponential backoff

        console.log(`🔄 Scheduling reconnect attempt ${reconnectAttempts.value}/${maxReconnectAttempts} in ${delay}ms`)

        reconnectTimeout = setTimeout(() => {
            connectToNotifications()
        }, delay)
    }

    const handleWebSocketMessage = (message: WebSocketMessage): void => {
        switch (message.type) {
            case 'connection_established':
                console.log('🔌 WebSocket connection established')
                break

            case 'notification':
                if (message.notification) {
                    handleNewNotification(message.notification)
                }
                break

            case 'notification_update':
                if (message.update) {
                    handleNotificationUpdate(message.update)
                }
                break

            case 'system_announcement':
                if (message.announcement) {
                    handleSystemAnnouncement(message.announcement)
                }
                break

            case 'pong':
                // Handle pong response
                break

            default:
                console.warn('⚠️ Unknown WebSocket message type:', message.type)
        }
    }

    const handleNewNotification = (notification: Notification): void => {
        // Add to the beginning of the list
        notifications.value.unshift(notification)

        // Update unread count
        if (!notification.is_read) {
            unreadCount.value++
        }

        // Update total count
        totalCount.value++

        console.log(`📬 Received new notification: ${notification.title}`)

        // Emit event for toast notifications
        const nuxtApp = useNuxtApp()
        nuxtApp.$bus?.emit('new-notification', notification)
    }

    const handleNotificationUpdate = (update: any): void => {
        switch (update.type) {
            case 'marked_read':
                if (update.notification_id) {
                    const notification = notifications.value.find(n => n.id === update.notification_id)
                    if (notification && !notification.is_read) {
                        notification.is_read = true
                        notification.read_at = new Date().toISOString()
                    }
                }
                if (update.unread_count !== undefined) {
                    unreadCount.value = update.unread_count
                }
                break

            case 'marked_all_read':
                notifications.value.forEach(notification => {
                    if (!notification.is_read) {
                        notification.is_read = true
                        notification.read_at = new Date().toISOString()
                    }
                })
                unreadCount.value = update.unread_count || 0
                break

            case 'dismissed':
                if (update.notification_id) {
                    const index = notifications.value.findIndex(n => n.id === update.notification_id)
                    if (index !== -1) {
                        notifications.value.splice(index, 1)
                        totalCount.value = Math.max(0, totalCount.value - 1)
                    }
                }
                break
        }

        console.log(`🔄 Notification update: ${update.type}`)
    }

    const handleSystemAnnouncement = (announcement: Notification): void => {
        // Add system announcement to the top
        notifications.value.unshift(announcement)

        if (!announcement.is_read) {
            unreadCount.value++
        }

        totalCount.value++

        console.log(`📢 System announcement: ${announcement.title}`)

        // Emit event for prominent display
        const nuxtApp = useNuxtApp()
        nuxtApp.$bus?.emit('system-announcement', announcement)
    }

    const sendPing = (): void => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'ping',
                timestamp: Date.now()
            }))
        }
    }

    // Utility methods
    const clearError = (): void => {
        error.value = null
    }

    const updateFilters = (newFilters: Partial<NotificationFilters>): void => {
        filters.value = { ...filters.value, ...newFilters }
    }

    const resetState = (): void => {
        notifications.value = []
        unreadCount.value = 0
        totalCount.value = 0
        preferences.value = null
        stats.value = null
        loading.value = false
        error.value = null
        currentPage.value = 1
        hasNext.value = false
        hasPrevious.value = false
        filters.value = {
            include_read: true,
            include_dismissed: false,
            page: 1,
            page_size: 20
        }
    }

    // Initialize notifications when store is created
    const initializeNotifications = async (): Promise<void> => {
        if (!isAuthenticated.value) {
            console.log('ℹ️ User not authenticated, skipping notification initialization')
            return
        }

        try {
            console.log('🔄 Initializing notifications...')

            // Fetch initial data
            await Promise.all([
                fetchNotifications(),
                fetchPreferences(),
                fetchUnreadCount()
            ])

            // Connect to WebSocket
            await connectToNotifications()

            console.log('✅ Notifications initialized successfully')
        } catch (err) {
            console.error('❌ Error initializing notifications:', err)
        }
    }

    return {
        // State
        notifications,
        unreadCount,
        totalCount,
        preferences,
        stats,
        loading,
        error,
        isConnected,
        connectionStatus,
        currentPage,
        pageSize,
        hasNext,
        hasPrevious,
        filters,

        // Getters
        unreadNotifications,
        recentNotifications,
        notificationsByType,
        hasUnreadNotifications,

        // Actions
        fetchNotifications,
        fetchNotificationById,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        bulkAction,
        fetchPreferences,
        updatePreferences,
        fetchStats,
        fetchAdminStats,
        fetchUnreadCount,
        createSystemAnnouncement,

        // WebSocket
        connectToNotifications,
        disconnectFromNotifications,
        sendPing,

        // Utilities
        clearError,
        updateFilters,
        resetState,
        initializeNotifications
    }
})
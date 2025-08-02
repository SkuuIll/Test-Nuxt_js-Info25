/**
 * Composable for notifications management
 */
import type {
    Notification,
    NotificationPreferences,
    NotificationFilters,
    BulkNotificationAction,
    SystemAnnouncement
} from '~/types/notifications'

export const useNotifications = () => {
    const notificationStore = useNotificationStore()
    const { showToast } = useToast()

    // Store state
    const {
        notifications,
        unreadCount,
        totalCount,
        preferences,
        stats,
        loading,
        error,
        isConnected,
        connectionStatus,
        unreadNotifications,
        recentNotifications,
        hasUnreadNotifications
    } = storeToRefs(notificationStore)

    // Initialize notifications
    const initializeNotifications = async () => {
        try {
            await notificationStore.initializeNotifications()
        } catch (error) {
            console.error('Error initializing notifications:', error)
            showToast({
                title: 'Error',
                message: 'No se pudieron cargar las notificaciones',
                type: 'error'
            })
        }
    }

    // Fetch notifications with filters
    const fetchNotifications = async (filters?: NotificationFilters) => {
        try {
            await notificationStore.fetchNotifications(filters)
        } catch (error) {
            console.error('Error fetching notifications:', error)
            showToast({
                title: 'Error',
                message: 'No se pudieron cargar las notificaciones',
                type: 'error'
            })
        }
    }

    // Load more notifications (pagination)
    const loadMoreNotifications = async () => {
        if (!notificationStore.hasNext || loading.value) return

        try {
            await notificationStore.fetchNotifications({
                page: notificationStore.currentPage + 1,
                page_size: notificationStore.pageSize
            })
        } catch (error) {
            console.error('Error loading more notifications:', error)
            showToast({
                title: 'Error',
                message: 'No se pudieron cargar más notificaciones',
                type: 'error'
            })
        }
    }

    // Mark notification as read
    const markAsRead = async (notificationId: number) => {
        try {
            const success = await notificationStore.markAsRead(notificationId)
            if (!success) {
                throw new Error('Failed to mark as read')
            }
        } catch (error) {
            console.error('Error marking notification as read:', error)
            showToast({
                title: 'Error',
                message: 'No se pudo marcar la notificación como leída',
                type: 'error'
            })
        }
    }

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const success = await notificationStore.markAllAsRead()
            if (success) {
                showToast({
                    title: 'Éxito',
                    message: 'Todas las notificaciones han sido marcadas como leídas',
                    type: 'success'
                })
            } else {
                throw new Error('Failed to mark all as read')
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
            showToast({
                title: 'Error',
                message: 'No se pudieron marcar las notificaciones como leídas',
                type: 'error'
            })
        }
    }

    // Dismiss notification
    const dismissNotification = async (notificationId: number) => {
        try {
            const success = await notificationStore.dismissNotification(notificationId)
            if (success) {
                showToast({
                    title: 'Notificación eliminada',
                    message: 'La notificación ha sido eliminada',
                    type: 'info'
                })
            } else {
                throw new Error('Failed to dismiss notification')
            }
        } catch (error) {
            console.error('Error dismissing notification:', error)
            showToast({
                title: 'Error',
                message: 'No se pudo eliminar la notificación',
                type: 'error'
            })
        }
    }

    // Bulk actions on notifications
    const performBulkAction = async (action: BulkNotificationAction) => {
        try {
            const success = await notificationStore.bulkAction(action)
            if (success) {
                const actionText = {
                    mark_read: 'marcadas como leídas',
                    mark_unread: 'marcadas como no leídas',
                    dismiss: 'eliminadas'
                }[action.action]

                showToast({
                    title: 'Éxito',
                    message: `${action.notification_ids.length} notificaciones ${actionText}`,
                    type: 'success'
                })
            } else {
                throw new Error('Failed to perform bulk action')
            }
        } catch (error) {
            console.error('Error performing bulk action:', error)
            showToast({
                title: 'Error',
                message: 'No se pudo realizar la acción en las notificaciones',
                type: 'error'
            })
        }
    }

    // Fetch and update preferences
    const fetchPreferences = async () => {
        try {
            await notificationStore.fetchPreferences()
        } catch (error) {
            console.error('Error fetching preferences:', error)
            showToast({
                title: 'Error',
                message: 'No se pudieron cargar las preferencias',
                type: 'error'
            })
        }
    }

    // Update notification preferences
    const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
        try {
            const success = await notificationStore.updatePreferences(updates)
            if (success) {
                showToast({
                    title: 'Preferencias actualizadas',
                    message: 'Tus preferencias de notificación han sido guardadas',
                    type: 'success'
                })
            } else {
                throw new Error('Failed to update preferences')
            }
        } catch (error) {
            console.error('Error updating preferences:', error)
            showToast({
                title: 'Error',
                message: 'No se pudieron actualizar las preferencias',
                type: 'error'
            })
        }
    }

    // Fetch notification statistics
    const fetchStats = async () => {
        try {
            return await notificationStore.fetchStats()
        } catch (error) {
            console.error('Error fetching notification statistics:', error)
            showToast({
                title: 'Error',
                message: 'No se pudieron cargar las estadísticas',
                type: 'error'
            })
            return null
        }
    }

    // Fetch admin notification statistics
    const fetchAdminStats = async () => {
        try {
            return await notificationStore.fetchAdminStats()
        } catch (error) {
            console.error('Error fetching admin notification statistics:', error)
            showToast({
                title: 'Error',
                message: 'No se pudieron cargar las estadísticas de administración',
                type: 'error'
            })
            return null
        }
    }

    // Create system announcement (admin only)
    const createSystemAnnouncement = async (announcement: SystemAnnouncement) => {
        try {
            const success = await notificationStore.createSystemAnnouncement(announcement)
            if (success) {
                showToast({
                    title: 'Anuncio creado',
                    message: 'El anuncio del sistema ha sido enviado',
                    type: 'success'
                })
            } else {
                throw new Error('Failed to create announcement')
            }
        } catch (error) {
            console.error('Error creating system announcement:', error)
            showToast({
                title: 'Error',
                message: 'No se pudo crear el anuncio del sistema',
                type: 'error'
            })
        }
    }

    // Handle notification click
    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already read
        if (!notification.is_read) {
            await markAsRead(notification.id)
        }

        // Navigate to action URL if available
        if (notification.action_url) {
            await navigateTo(notification.action_url)
        }
    }

    // Show notification as toast
    const showNotificationToast = (notification: Notification) => {
        const toastType = (() => {
            switch (notification.priority) {
                case 'urgent':
                    return 'error'
                case 'high':
                    return 'warning'
                case 'low':
                    return 'info'
                default:
                    return 'info'
            }
        })()

        showToast({
            title: notification.title,
            message: notification.message,
            type: toastType,
            duration: notification.priority === 'urgent' ? 0 : 5000,
            action: notification.action_url ? {
                label: 'Ver',
                handler: () => handleNotificationClick(notification)
            } : undefined
        })
    }

    // Filter notifications by type
    const filterNotificationsByType = (type: string) => {
        return notifications.value.filter(n => n.notification_type === type)
    }

    // Filter notifications by priority
    const filterNotificationsByPriority = (priority: string) => {
        return notifications.value.filter(n => n.priority === priority)
    }

    // Get notifications from last N days
    const getRecentNotifications = (days: number = 7) => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)

        return notifications.value.filter(n =>
            new Date(n.created_at) >= cutoffDate
        )
    }

    // Check if notification is expiring soon
    const isNotificationExpiringSoon = (notification: Notification, hoursThreshold: number = 24) => {
        if (!notification.expires_at) return false

        const expiration = new Date(notification.expires_at)
        const now = new Date()
        const diffInHours = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60)

        return diffInHours > 0 && diffInHours <= hoursThreshold
    }

    // Format notification timestamp
    const formatNotificationTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) {
            return 'Ahora'
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60)
            return `${minutes} min`
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600)
            return `${hours} h`
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400)
            return `${days} días`
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            })
        }
    }

    // WebSocket connection management
    const connectToNotifications = async () => {
        try {
            await notificationStore.connectToNotifications()
        } catch (error) {
            console.error('Error connecting to notifications:', error)
            showToast({
                title: 'Error de conexión',
                message: 'No se pudo conectar a las notificaciones en tiempo real',
                type: 'warning'
            })
        }
    }

    const disconnectFromNotifications = () => {
        notificationStore.disconnectFromNotifications()
    }

    // Cleanup
    const cleanup = () => {
        disconnectFromNotifications()
        notificationStore.resetState()
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
        unreadNotifications,
        recentNotifications,
        hasUnreadNotifications,

        // Actions
        initializeNotifications,
        fetchNotifications,
        loadMoreNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        performBulkAction,
        fetchPreferences,
        updatePreferences,
        fetchStats,
        fetchAdminStats,
        createSystemAnnouncement,
        handleNotificationClick,
        showNotificationToast,

        // Utilities
        filterNotificationsByType,
        filterNotificationsByPriority,
        getRecentNotifications,
        isNotificationExpiringSoon,
        formatNotificationTime,

        // WebSocket
        connectToNotifications,
        disconnectFromNotifications,

        // Cleanup
        cleanup
    }
}
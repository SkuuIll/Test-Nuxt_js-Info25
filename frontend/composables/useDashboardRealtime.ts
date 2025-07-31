/**
 * Dashboard real-time data management composable
 * Handles WebSocket connections, live updates, and real-time notifications
 */

interface RealtimeEvent {
    type: 'post_created' | 'post_published' | 'comment_added' | 'user_registered' | 'system_alert'
    data: any
    timestamp: string
    user?: {
        id: number
        username: string
    }
}

interface RealtimeStats {
    active_users: number
    online_staff: number
    pending_comments: number
    draft_posts: number
    system_load: number
    memory_usage: number
}

interface SystemAlert {
    id: string
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: string
    dismissed: boolean
    action?: {
        label: string
        url: string
    }
}

export const useDashboardRealtime = () => {
    const { requirePermission } = useDashboardAuth()
    const { handleApiError } = useErrorHandler()
    const config = useRuntimeConfig()

    // State
    const isConnected = ref(false)
    const connectionStatus = ref<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
    const realtimeStats = ref<RealtimeStats | null>(null)
    const recentEvents = ref<RealtimeEvent[]>([])
    const systemAlerts = ref<SystemAlert[]>([])
    const error = ref<string | null>(null)

    // WebSocket connection
    let ws: WebSocket | null = null
    let reconnectAttempts = 0
    let maxReconnectAttempts = 5
    let reconnectTimeout: NodeJS.Timeout | null = null

    // Computed
    const hasSystemAlerts = computed(() => systemAlerts.value.some(alert => !alert.dismissed))
    const criticalAlerts = computed(() => systemAlerts.value.filter(alert => alert.type === 'error' && !alert.dismissed))
    const warningAlerts = computed(() => systemAlerts.value.filter(alert => alert.type === 'warning' && !alert.dismissed))

    // Connect to WebSocket
    const connect = async () => {
        try {
            // Require permission to view real-time data
            await requirePermission('can_view_stats')

            if (ws && ws.readyState === WebSocket.OPEN) {
                console.log('🔌 WebSocket already connected')
                return
            }

            connectionStatus.value = 'connecting'
            console.log('🔌 Connecting to dashboard WebSocket...')

            // Get WebSocket URL from config
            const wsUrl = config.public.wsBase || config.public.apiBase.replace('http', 'ws')
            const wsEndpoint = `${wsUrl}/ws/dashboard/`

            ws = new WebSocket(wsEndpoint)

            ws.onopen = () => {
                console.log('✅ Dashboard WebSocket connected')
                connectionStatus.value = 'connected'
                isConnected.value = true
                reconnectAttempts = 0
                error.value = null
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    handleRealtimeMessage(data)
                } catch (err) {
                    console.error('❌ Error parsing WebSocket message:', err)
                }
            }

            ws.onclose = (event) => {
                console.log('🔌 Dashboard WebSocket disconnected:', event.code, event.reason)
                connectionStatus.value = 'disconnected'
                isConnected.value = false

                // Attempt to reconnect if not a normal closure
                if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
                    scheduleReconnect()
                }
            }

            ws.onerror = (event) => {
                console.error('❌ Dashboard WebSocket error:', event)
                connectionStatus.value = 'error'
                error.value = 'WebSocket connection error'
            }

        } catch (err: any) {
            console.error('❌ WebSocket connection failed:', err)
            connectionStatus.value = 'error'
            error.value = err.message
        }
    }

    // Disconnect WebSocket
    const disconnect = () => {
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
        console.log('🔌 Dashboard WebSocket disconnected manually')
    }

    // Schedule reconnection
    const scheduleReconnect = () => {
        if (reconnectTimeout) return

        reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // Exponential backoff, max 30s

        console.log(`🔄 Scheduling WebSocket reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`)

        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null
            connect()
        }, delay)
    }

    // Handle real-time messages
    const handleRealtimeMessage = (data: any) => {
        switch (data.type) {
            case 'stats_update':
                realtimeStats.value = data.stats
                break

            case 'event':
                const event: RealtimeEvent = {
                    type: data.event_type,
                    data: data.event_data,
                    timestamp: data.timestamp,
                    user: data.user
                }

                // Add to recent events (keep last 50)
                recentEvents.value.unshift(event)
                if (recentEvents.value.length > 50) {
                    recentEvents.value = recentEvents.value.slice(0, 50)
                }
                break

            case 'system_alert':
                const alert: SystemAlert = {
                    id: data.alert_id,
                    type: data.alert_type,
                    title: data.title,
                    message: data.message,
                    timestamp: data.timestamp,
                    dismissed: false,
                    action: data.action
                }

                systemAlerts.value.unshift(alert)
                break

            case 'ping':
                // Respond to ping to keep connection alive
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'pong' }))
                }
                break

            default:
                console.log('📨 Unknown real-time message type:', data.type)
        }
    }

    // Send message to WebSocket
    const sendMessage = (message: any) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message))
        } else {
            console.warn('⚠️ Cannot send message: WebSocket not connected')
        }
    }

    // Subscribe to specific events
    const subscribe = (eventTypes: string[]) => {
        sendMessage({
            type: 'subscribe',
            events: eventTypes
        })
    }

    // Unsubscribe from events
    const unsubscribe = (eventTypes: string[]) => {
        sendMessage({
            type: 'unsubscribe',
            events: eventTypes
        })
    }

    // Dismiss system alert
    const dismissAlert = (alertId: string) => {
        const alert = systemAlerts.value.find(a => a.id === alertId)
        if (alert) {
            alert.dismissed = true
        }

        // Send dismiss message to server
        sendMessage({
            type: 'dismiss_alert',
            alert_id: alertId
        })
    }

    // Clear all dismissed alerts
    const clearDismissedAlerts = () => {
        systemAlerts.value = systemAlerts.value.filter(alert => !alert.dismissed)
    }

    // Get connection info
    const getConnectionInfo = () => {
        return {
            isConnected: isConnected.value,
            status: connectionStatus.value,
            reconnectAttempts,
            maxReconnectAttempts,
            hasError: !!error.value,
            error: error.value
        }
    }

    // Format event for display
    const formatEvent = (event: RealtimeEvent): string => {
        switch (event.type) {
            case 'post_created':
                return `New post created: "${event.data.title}"`
            case 'post_published':
                return `Post published: "${event.data.title}"`
            case 'comment_added':
                return `New comment on "${event.data.post_title}"`
            case 'user_registered':
                return `New user registered: ${event.data.username}`
            case 'system_alert':
                return `System alert: ${event.data.message}`
            default:
                return `Unknown event: ${event.type}`
        }
    }

    // Get event icon
    const getEventIcon = (event: RealtimeEvent): string => {
        switch (event.type) {
            case 'post_created':
                return '📝'
            case 'post_published':
                return '📢'
            case 'comment_added':
                return '💬'
            case 'user_registered':
                return '👤'
            case 'system_alert':
                return '⚠️'
            default:
                return '📨'
        }
    }

    // Auto-connect on mount if in browser
    onMounted(() => {
        if (import.meta.client) {
            connect()
        }
    })

    // Cleanup on unmount
    onUnmounted(() => {
        disconnect()
    })

    // Watch for authentication changes
    const { isAuthenticated } = useDashboardAuth()
    watch(isAuthenticated, (authenticated) => {
        if (authenticated && !isConnected.value) {
            connect()
        } else if (!authenticated && isConnected.value) {
            disconnect()
        }
    })

    return {
        // State
        isConnected: readonly(isConnected),
        connectionStatus: readonly(connectionStatus),
        realtimeStats: readonly(realtimeStats),
        recentEvents: readonly(recentEvents),
        systemAlerts: readonly(systemAlerts),
        error: readonly(error),

        // Computed
        hasSystemAlerts: readonly(hasSystemAlerts),
        criticalAlerts: readonly(criticalAlerts),
        warningAlerts: readonly(warningAlerts),

        // Connection Management
        connect,
        disconnect,
        getConnectionInfo,

        // Event Management
        subscribe,
        unsubscribe,
        sendMessage,

        // Alert Management
        dismissAlert,
        clearDismissedAlerts,

        // Utilities
        formatEvent,
        getEventIcon
    }
}
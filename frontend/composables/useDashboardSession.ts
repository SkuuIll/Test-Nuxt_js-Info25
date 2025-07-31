/**
 * Dashboard session management composable
 * Handles session monitoring, automatic refresh, and session warnings
 */
export const useDashboardSession = () => {
    const {
        getDashboardTokens,
        refreshDashboardTokens,
        logout,
        isAuthenticated
    } = useDashboardAuth()

    const api = useApi()

    // Session state
    const sessionWarning = ref(false)
    const sessionExpiring = ref(false)
    const sessionTimeRemaining = ref(0)

    // Session monitoring interval
    let sessionInterval: NodeJS.Timeout | null = null
    let warningTimeout: NodeJS.Timeout | null = null

    // Calculate time remaining until token expires
    const calculateTimeRemaining = (): number => {
        const tokens = getDashboardTokens()
        if (!tokens?.access) return 0

        const expiryTime = api.tokenUtils.getTokenExpiryTime(tokens.access)
        const currentTime = Date.now()
        const timeRemaining = Math.max(0, expiryTime - currentTime)

        return Math.floor(timeRemaining / 1000) // Return in seconds
    }

    // Update session time remaining
    const updateSessionTime = () => {
        if (!isAuthenticated.value) {
            sessionTimeRemaining.value = 0
            return
        }

        const timeRemaining = calculateTimeRemaining()
        sessionTimeRemaining.value = timeRemaining

        // Show warning if less than 5 minutes remaining
        const fiveMinutes = 5 * 60
        if (timeRemaining <= fiveMinutes && timeRemaining > 0) {
            if (!sessionWarning.value) {
                sessionWarning.value = true
                sessionExpiring.value = true
                console.log('⚠️ Dashboard session expiring soon:', timeRemaining, 'seconds remaining')
            }
        } else {
            sessionWarning.value = false
            sessionExpiring.value = false
        }

        // Auto-logout if session expired
        if (timeRemaining <= 0 && isAuthenticated.value) {
            console.log('⏰ Dashboard session expired, logging out')
            handleSessionExpiry()
        }
    }

    // Handle session expiry
    const handleSessionExpiry = async () => {
        try {
            await logout('/dashboard/login?reason=session_expired')
        } catch (error) {
            console.error('Error during session expiry logout:', error)
        }
    }

    // Extend session by refreshing token
    const extendSession = async (): Promise<boolean> => {
        try {
            console.log('🔄 Extending dashboard session...')
            const refreshed = await refreshDashboardTokens()

            if (refreshed) {
                sessionWarning.value = false
                sessionExpiring.value = false
                console.log('✅ Dashboard session extended successfully')
                return true
            } else {
                console.log('❌ Failed to extend dashboard session')
                return false
            }
        } catch (error) {
            console.error('Error extending dashboard session:', error)
            return false
        }
    }

    // Start session monitoring
    const startSessionMonitoring = () => {
        if (!import.meta.client || sessionInterval) return

        console.log('🔍 Starting dashboard session monitoring')

        // Update immediately
        updateSessionTime()

        // Update every 30 seconds
        sessionInterval = setInterval(() => {
            updateSessionTime()
        }, 30000)

        // Set up proactive refresh (refresh 2 minutes before expiry)
        const scheduleProactiveRefresh = () => {
            const tokens = getDashboardTokens()
            if (!tokens?.access) return

            const expiryTime = api.tokenUtils.getTokenExpiryTime(tokens.access)
            const currentTime = Date.now()
            const timeUntilExpiry = expiryTime - currentTime
            const twoMinutes = 2 * 60 * 1000

            const refreshTime = Math.max(timeUntilExpiry - twoMinutes, 30000) // At least 30 seconds

            if (refreshTime > 0 && refreshTime < timeUntilExpiry) {
                warningTimeout = setTimeout(async () => {
                    if (isAuthenticated.value) {
                        console.log('🔄 Proactively refreshing dashboard session...')
                        await extendSession()
                        // Schedule next refresh
                        scheduleProactiveRefresh()
                    }
                }, refreshTime)
            }
        }

        scheduleProactiveRefresh()
    }

    // Stop session monitoring
    const stopSessionMonitoring = () => {
        console.log('🛑 Stopping dashboard session monitoring')

        if (sessionInterval) {
            clearInterval(sessionInterval)
            sessionInterval = null
        }

        if (warningTimeout) {
            clearTimeout(warningTimeout)
            warningTimeout = null
        }

        sessionWarning.value = false
        sessionExpiring.value = false
        sessionTimeRemaining.value = 0
    }

    // Format time remaining for display
    const formatTimeRemaining = (seconds: number): string => {
        if (seconds <= 0) return '0:00'

        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60

        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    // Get session status
    const getSessionStatus = () => {
        const tokens = getDashboardTokens()
        const timeRemaining = calculateTimeRemaining()

        return {
            isActive: isAuthenticated.value && timeRemaining > 0,
            timeRemaining,
            formattedTimeRemaining: formatTimeRemaining(timeRemaining),
            isExpiring: sessionExpiring.value,
            showWarning: sessionWarning.value,
            expiryTime: tokens?.access ? api.tokenUtils.getTokenExpiryTime(tokens.access) : 0
        }
    }

    // Cleanup on unmount
    onUnmounted(() => {
        stopSessionMonitoring()
    })

    // Watch authentication state
    watch(isAuthenticated, (newValue) => {
        if (newValue) {
            startSessionMonitoring()
        } else {
            stopSessionMonitoring()
        }
    }, { immediate: true })

    return {
        // State
        sessionWarning: readonly(sessionWarning),
        sessionExpiring: readonly(sessionExpiring),
        sessionTimeRemaining: readonly(sessionTimeRemaining),

        // Methods
        startSessionMonitoring,
        stopSessionMonitoring,
        extendSession,
        handleSessionExpiry,
        getSessionStatus,
        formatTimeRemaining,
        calculateTimeRemaining
    }
}
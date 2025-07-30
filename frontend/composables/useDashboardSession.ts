export const useDashboardSession = () => {
    const { logout, refreshAccessToken, isAuthenticated } = useDashboardAuth()

    // Session timeout (30 minutes)
    const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
    const WARNING_TIME = 5 * 60 * 1000 // 5 minutes warning

    let sessionTimer: NodeJS.Timeout | null = null
    let warningTimer: NodeJS.Timeout | null = null
    let lastActivity = Date.now()

    const showWarning = ref(false)
    const timeLeft = ref(0)

    // Update last activity time
    const updateActivity = () => {
        lastActivity = Date.now()
        resetTimers()
    }

    // Reset session timers
    const resetTimers = () => {
        if (!isAuthenticated()) return

        // Clear existing timers
        if (sessionTimer) clearTimeout(sessionTimer)
        if (warningTimer) clearTimeout(warningTimer)

        showWarning.value = false

        // Set warning timer
        warningTimer = setTimeout(() => {
            showWarning.value = true
            startCountdown()
        }, SESSION_TIMEOUT - WARNING_TIME)

        // Set session timeout
        sessionTimer = setTimeout(async () => {
            await logout()
            await navigateTo('/dashboard/login?reason=timeout')
        }, SESSION_TIMEOUT)
    }

    // Start countdown for warning
    const startCountdown = () => {
        timeLeft.value = WARNING_TIME / 1000 // Convert to seconds

        const countdown = setInterval(() => {
            timeLeft.value--

            if (timeLeft.value <= 0) {
                clearInterval(countdown)
            }
        }, 1000)
    }

    // Extend session
    const extendSession = async () => {
        try {
            await refreshAccessToken()
            showWarning.value = false
            updateActivity()
        } catch (error) {
            console.error('Failed to extend session:', error)
            await logout()
            await navigateTo('/dashboard/login')
        }
    }

    // Initialize session management
    const initializeSession = () => {
        if (!process.client || !isAuthenticated()) return

        // Set up activity listeners
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

        const activityHandler = () => {
            updateActivity()
        }

        events.forEach(event => {
            document.addEventListener(event, activityHandler, true)
        })

        // Start timers
        resetTimers()

        // Cleanup function
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, activityHandler, true)
            })

            if (sessionTimer) clearTimeout(sessionTimer)
            if (warningTimer) clearTimeout(warningTimer)
        }
    }

    // Format time for display
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return {
        showWarning: readonly(showWarning),
        timeLeft: readonly(timeLeft),
        extendSession,
        initializeSession,
        updateActivity,
        formatTime
    }
}
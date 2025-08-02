/**
 * Simplified Dashboard Auth composable for testing
 */
export const useDashboardAuthSimple = () => {
    const DASHBOARD_TOKEN_KEY = 'dashboard_auth_tokens'

    const getDashboardTokens = () => {
        if (!import.meta.client) return null

        try {
            const stored = localStorage.getItem(DASHBOARD_TOKEN_KEY)
            if (stored) {
                const tokens = JSON.parse(stored)
                if (tokens.access && tokens.refresh) {
                    return tokens
                }
            }
        } catch (error) {
            console.error('Error parsing dashboard tokens:', error)
        }

        return null
    }

    const setDashboardTokens = (tokens: any) => {
        if (!import.meta.client) return

        try {
            localStorage.setItem(DASHBOARD_TOKEN_KEY, JSON.stringify(tokens))
        } catch (error) {
            console.error('Error storing dashboard tokens:', error)
        }
    }

    const clearDashboardTokens = () => {
        if (!import.meta.client) return

        try {
            localStorage.removeItem(DASHBOARD_TOKEN_KEY)
        } catch (error) {
            console.error('Error clearing dashboard tokens:', error)
        }
    }

    // For testing, let's use regular auth tokens if dashboard tokens don't exist
    const getAuthTokens = () => {
        if (!import.meta.client) return null

        try {
            const stored = localStorage.getItem('auth_tokens')
            if (stored) {
                const tokens = JSON.parse(stored)
                if (tokens.access && tokens.refresh) {
                    return tokens
                }
            }
        } catch (error) {
            console.error('Error parsing auth tokens:', error)
        }

        return null
    }

    const getTokens = () => {
        return getDashboardTokens() || getAuthTokens()
    }

    return {
        getDashboardTokens: getTokens,
        setDashboardTokens,
        clearDashboardTokens
    }
}
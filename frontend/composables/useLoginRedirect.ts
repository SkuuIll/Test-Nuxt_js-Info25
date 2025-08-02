/**
 * Composable específico para manejar redirección después del login
 */

export const useLoginRedirect = () => {
    const router = useRouter()
    const route = useRoute()

    const redirectAfterLogin = async (user?: any) => {
        try {
            console.log('🔄 Starting post-login redirect...')
            console.log('👤 User data:', user)
            console.log('📍 Current route:', route.path)
            console.log('🔗 Query redirect:', route.query.redirect)

            // Determine redirect URL
            let redirectUrl = '/'

            // Check for redirect in query params
            if (route.query.redirect && typeof route.query.redirect === 'string') {
                redirectUrl = route.query.redirect
                console.log('📋 Using redirect from query:', redirectUrl)
            }

            console.log('🎯 Final redirect URL:', redirectUrl)

            // Use multiple methods to ensure redirect works

            // Method 1: Try navigateTo with replace
            try {
                await navigateTo(redirectUrl, { replace: true })
                console.log('✅ navigateTo successful')
            } catch (navError) {
                console.warn('⚠️ navigateTo failed:', navError)

                // Method 2: Try router.replace
                try {
                    await router.replace(redirectUrl)
                    console.log('✅ router.replace successful')
                } catch (routerError) {
                    console.warn('⚠️ router.replace failed:', routerError)

                    // Method 3: Force window location change
                    if (process.client) {
                        console.log('🔧 Using window.location as fallback')
                        window.location.href = redirectUrl
                    }
                }
            }

        } catch (error) {
            console.error('❌ Error in post-login redirect:', error)

            // Fallback: force redirect to home
            if (process.client) {
                console.log('🆘 Emergency fallback redirect')
                window.location.href = '/'
            }
        }
    }

    const handleSuccessfulLogin = async (result: any) => {
        try {
            console.log('🎉 Handling successful login...')

            // Show success message
            const { authSuccess } = useToast()
            const username = result?.user?.username || 'Usuario'

            if (result?.user?.is_staff) {
                authSuccess(`¡Bienvenido ${username}! Tienes acceso al dashboard.`)
            } else {
                authSuccess(`¡Bienvenido ${username}!`)
            }

            // Wait a moment for the toast to show
            await new Promise(resolve => setTimeout(resolve, 300))

            // Perform redirect
            await redirectAfterLogin(result?.user)

        } catch (error) {
            console.error('❌ Error handling successful login:', error)
        }
    }

    const forceRedirectToHome = () => {
        console.log('🏠 Forcing redirect to home page...')

        if (process.client) {
            // Clear any existing navigation state
            history.replaceState(null, '', '/')

            // Force reload to ensure clean state
            window.location.href = '/'
        }
    }

    return {
        redirectAfterLogin,
        handleSuccessfulLogin,
        forceRedirectToHome
    }
}
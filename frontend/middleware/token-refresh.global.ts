export default defineNuxtRouteMiddleware(async (to) => {
    // Solo ejecutar en el cliente y para rutas del dashboard
    if (process.server || !to.path.startsWith('/dashboard')) return

    const { isAuthenticated, refreshAccessToken, accessToken } = useDashboardAuth()

    // Si está autenticado, verificar si el token está próximo a expirar
    if (isAuthenticated() && accessToken.value) {
        try {
            // Decodificar el token JWT para verificar la expiración
            const tokenPayload = JSON.parse(atob(accessToken.value.split('.')[1]))
            const currentTime = Math.floor(Date.now() / 1000)
            const timeUntilExpiry = tokenPayload.exp - currentTime

            // Si el token expira en menos de 5 minutos, refrescarlo
            if (timeUntilExpiry < 300) {
                console.log('Token próximo a expirar, refrescando...')
                await refreshAccessToken()
            }
        } catch (error) {
            console.error('Error al verificar expiración del token:', error)
        }
    }
})
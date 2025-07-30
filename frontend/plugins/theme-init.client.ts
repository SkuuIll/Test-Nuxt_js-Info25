/**
 * Plugin para inicializar el tema antes de la hidratación
 * Previene el parpadeo (FOUC) entre temas
 */
export default defineNuxtPlugin(() => {
    // Solo ejecutar en el cliente
    if (process.server) return

    // Función para aplicar el tema inmediatamente
    const applyTheme = () => {
        try {
            // Obtener el tema guardado o usar 'system' por defecto
            const savedTheme = localStorage.getItem('theme') || 'system'
            let isDark = false

            if (savedTheme === 'system') {
                // Detectar preferencia del sistema
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            } else {
                isDark = savedTheme === 'dark'
            }

            // Aplicar la clase inmediatamente al documento
            if (isDark) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }

            // Habilitar transiciones después de la carga inicial
            setTimeout(() => {
                document.body.classList.add('transitions-enabled')
                document.documentElement.classList.remove('preload')
            }, 100)

        } catch (error) {
            console.warn('Error al inicializar el tema:', error)
            // Fallback: aplicar tema claro por defecto
            document.documentElement.classList.remove('dark')

            // Log error if logger is available
            try {
                const { $logger } = useNuxtApp()
                $logger.error('Error al inicializar el tema', error)
            } catch (e) {
                // Logger not available yet
            }
        }
    }

    // Aplicar el tema inmediatamente
    applyTheme()

    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'system' || !savedTheme) {
            applyTheme()
        }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // Cleanup al destruir la aplicación
    return {
        provide: {
            cleanupTheme: () => {
                mediaQuery.removeEventListener('change', handleSystemThemeChange)
            }
        }
    }
})
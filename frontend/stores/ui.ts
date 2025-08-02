import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', () => {
    // State - usando valores por defecto seguros para SSR
    const theme = ref<'light' | 'dark' | 'system'>('system')
    const isDark = ref(false)
    const sidebarOpen = ref(false)
    const mobileMenuOpen = ref(false)
    const searchOpen = ref(false)
    const loading = ref(false)
    const notifications = ref<Array<{
        id: string
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
        duration?: number
    }>>([])

    // Responsive state
    const windowWidth = ref(1024) // Default safe value
    const windowHeight = ref(768) // Default safe value
    const scrollY = ref(0)

    // Getters
    const currentTheme = computed(() => {
        if (theme.value === 'system') {
            return isDark.value ? 'dark' : 'light'
        }
        return theme.value
    })

    const breakpoints = {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536
    }

    const isMobile = computed(() => windowWidth.value < breakpoints.md)
    const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
    const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)
    const isScrolled = computed(() => scrollY.value > 50)

    // Safe client-side operations
    const safeClientOperation = (operation: () => void) => {
        if (process.client) {
            try {
                operation()
            } catch (e) {
                console.warn('Client operation failed:', e)
            }
        }
    }

    // Actions
    const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
        const oldTheme = theme.value
        theme.value = newTheme

        safeClientOperation(() => {
            localStorage.setItem('theme', newTheme)
            updateDarkMode()

            // Log theme change
            console.log('Theme changed:', oldTheme, '→', newTheme)
        })
    }

    const toggleTheme = () => {
        if (theme.value === 'light') {
            setTheme('dark')
        } else if (theme.value === 'dark') {
            setTheme('system')
        } else {
            setTheme('light')
        }
    }

    const updateDarkMode = () => {
        safeClientOperation(() => {
            if (theme.value === 'system') {
                isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
            } else {
                isDark.value = theme.value === 'dark'
            }

            // Update document class
            if (isDark.value) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
        })
    }

    const initializeTheme = () => {
        safeClientOperation(() => {
            // Get saved theme or default to system
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
            theme.value = savedTheme

            // Listen for system theme changes
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            const handleChange = () => updateDarkMode()
            mediaQuery.addEventListener('change', handleChange)

            // Initial update
            updateDarkMode()

            // Cleanup function (though not used in this context)
            return () => {
                mediaQuery.removeEventListener('change', handleChange)
            }
        })
    }

    const toggleSidebar = () => {
        sidebarOpen.value = !sidebarOpen.value
    }

    const closeSidebar = () => {
        sidebarOpen.value = false
    }

    const toggleMobileMenu = () => {
        mobileMenuOpen.value = !mobileMenuOpen.value
    }

    const closeMobileMenu = () => {
        mobileMenuOpen.value = false
    }

    const toggleSearch = () => {
        searchOpen.value = !searchOpen.value
    }

    const closeSearch = () => {
        searchOpen.value = false
    }

    const setLoading = (isLoading: boolean) => {
        loading.value = isLoading
    }

    const addNotification = (notification: {
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
        duration?: number
    }) => {
        const id = Date.now().toString()
        const newNotification = {
            id,
            duration: 5000,
            ...notification
        }

        notifications.value.push(newNotification)

        // Auto remove after duration (only on client)
        if (process.client && newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id)
            }, newNotification.duration)
        }

        return id
    }

    const removeNotification = (id: string) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index > -1) {
            notifications.value.splice(index, 1)
        }
    }

    const clearNotifications = () => {
        notifications.value = []
    }

    const updateWindowSize = () => {
        safeClientOperation(() => {
            windowWidth.value = window.innerWidth
            windowHeight.value = window.innerHeight
        })
    }

    const initializeWindowSize = () => {
        safeClientOperation(() => {
            updateWindowSize()

            const handleResize = () => updateWindowSize()
            window.addEventListener('resize', handleResize)

            // Return cleanup function
            return () => {
                window.removeEventListener('resize', handleResize)
            }
        })
    }

    const updateScrollPosition = () => {
        safeClientOperation(() => {
            scrollY.value = window.scrollY
        })
    }

    const initializeScroll = () => {
        safeClientOperation(() => {
            updateScrollPosition()

            const handleScroll = () => updateScrollPosition()
            window.addEventListener('scroll', handleScroll, { passive: true })

            // Return cleanup function
            return () => {
                window.removeEventListener('scroll', handleScroll)
            }
        })
    }

    const scrollToTop = () => {
        safeClientOperation(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        })
    }

    return {
        // State - usando readonly para prevenir mutaciones externas
        theme: readonly(theme),
        isDark: readonly(isDark),
        sidebarOpen: readonly(sidebarOpen),
        mobileMenuOpen: readonly(mobileMenuOpen),
        searchOpen: readonly(searchOpen),
        loading: readonly(loading),
        notifications: readonly(notifications),
        windowWidth: readonly(windowWidth),
        windowHeight: readonly(windowHeight),
        scrollY: readonly(scrollY),

        // Getters
        currentTheme,
        isMobile,
        isTablet,
        isDesktop,
        isScrolled,

        // Actions
        setTheme,
        toggleTheme,
        updateDarkMode,
        initializeTheme,
        toggleSidebar,
        closeSidebar,
        toggleMobileMenu,
        closeMobileMenu,
        toggleSearch,
        closeSearch,
        setLoading,
        addNotification,
        removeNotification,
        clearNotifications,
        updateWindowSize,
        initializeWindowSize,
        updateScrollPosition,
        initializeScroll,
        scrollToTop
    }
}, {
    persist: {
        key: 'ui-store',
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        pick: ['theme'] // Only persist theme setting
    }
})
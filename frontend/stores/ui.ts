import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', () => {
  // State
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

  // Getters
  const currentTheme = computed(() => {
    if (theme.value === 'system') {
      return isDark.value ? 'dark' : 'light'
    }
    return theme.value
  })

  // Actions
  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const oldTheme = theme.value
    theme.value = newTheme

    if (process.client) {
      localStorage.setItem('theme', newTheme)
      updateDarkMode()

      // Log theme change
      try {
        const { $logger } = useNuxtApp()
        $logger.theme(`${oldTheme} → ${newTheme}`)
      } catch (e) {
        console.log('Theme changed:', oldTheme, '→', newTheme)
      }
    }
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
    if (!process.client) return

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
  }

  const initializeTheme = () => {
    if (!process.client) return

    // Get saved theme or default to system
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
    theme.value = savedTheme

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateDarkMode)

    // Initial update
    updateDarkMode()
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

    // Auto remove after duration
    if (newNotification.duration > 0) {
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

  // Responsive breakpoints
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }

  const windowWidth = ref(0)
  const windowHeight = ref(0)

  const updateWindowSize = () => {
    if (process.client) {
      windowWidth.value = window.innerWidth
      windowHeight.value = window.innerHeight
    }
  }

  const isMobile = computed(() => windowWidth.value < breakpoints.md)
  const isTablet = computed(() => windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isDesktop = computed(() => windowWidth.value >= breakpoints.lg)

  const initializeWindowSize = () => {
    if (!process.client) return

    updateWindowSize()
    window.addEventListener('resize', updateWindowSize)
  }

  // Scroll management
  const scrollY = ref(0)
  const isScrolled = computed(() => scrollY.value > 50)

  const updateScrollPosition = () => {
    if (process.client) {
      scrollY.value = window.scrollY
    }
  }

  const initializeScroll = () => {
    if (!process.client) return

    updateScrollPosition()
    window.addEventListener('scroll', updateScrollPosition, { passive: true })
  }

  const scrollToTop = () => {
    if (process.client) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return {
    // State
    theme,
    isDark,
    sidebarOpen,
    mobileMenuOpen,
    searchOpen,
    loading,
    notifications,
    windowWidth,
    windowHeight,
    scrollY,

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
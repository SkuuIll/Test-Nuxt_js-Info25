export const useTheme = () => {
  const uiStore = useUIStore()
  
  return {
    // State
    isDark: uiStore.isDark,
    theme: uiStore.theme,
    currentTheme: uiStore.currentTheme,
    
    // Actions
    setTheme: uiStore.setTheme,
    toggleTheme: uiStore.toggleTheme,
    updateDarkMode: uiStore.updateDarkMode,
    initializeTheme: uiStore.initializeTheme
  }
}
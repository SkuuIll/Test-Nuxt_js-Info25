export default defineNuxtPlugin(() => {
  const { globalLoading, setLoading } = useLoading()

  // Create global loading indicator
  if (process.client) {
    // Add global loading styles
    const style = document.createElement('style')
    style.textContent = `
      .global-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(2px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.3s ease;
      }

      .dark .global-loading-overlay {
        background-color: rgba(0, 0, 0, 0.8);
      }

      .global-loading-spinner {
        width: 48px;
        height: 48px;
        position: relative;
      }

      .global-loading-ring {
        position: absolute;
        width: 48px;
        height: 48px;
        border: 4px solid transparent;
        border-top-color: #3b82f6;
        border-right-color: #3b82f6;
        border-radius: 50%;
        animation: global-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      }

      .global-loading-ring:nth-child(1) { animation-delay: -0.45s; }
      .global-loading-ring:nth-child(2) { animation-delay: -0.3s; }
      .global-loading-ring:nth-child(3) { animation-delay: -0.15s; }

      @keyframes global-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .global-loading-text {
        margin-top: 1rem;
        color: #374151;
        font-size: 0.875rem;
        font-weight: 500;
      }

      .dark .global-loading-text {
        color: #d1d5db;
      }
    `
    document.head.appendChild(style)

    // Create loading overlay element
    const overlay = document.createElement('div')
    overlay.id = 'global-loading-overlay'
    overlay.className = 'global-loading-overlay'
    overlay.style.display = 'none'

    overlay.innerHTML = `
      <div>
        <div class="global-loading-spinner">
          <div class="global-loading-ring"></div>
          <div class="global-loading-ring"></div>
          <div class="global-loading-ring"></div>
          <div class="global-loading-ring"></div>
        </div>
        <div class="global-loading-text">Cargando...</div>
      </div>
    `

    document.body.appendChild(overlay)

    // Watch global loading state
    watch(globalLoading, (isLoading) => {
      if (isLoading) {
        overlay.style.display = 'flex'
        overlay.style.opacity = '0'
        // Fade in
        requestAnimationFrame(() => {
          overlay.style.opacity = '1'
        })
      } else {
        // Fade out
        overlay.style.opacity = '0'
        setTimeout(() => {
          overlay.style.display = 'none'
        }, 300)
      }
    })

    // Handle page navigation loading
    const router = useRouter()

    router.beforeEach((to, from) => {
      if (to.path !== from.path) {
        setLoading(true, { key: 'navigation', showGlobalIndicator: true })
      }
    })

    router.afterEach(() => {
      // Small delay to prevent flashing
      setTimeout(() => {
        setLoading(false, { key: 'navigation' })
      }, 100)
    })

    // Handle fetch loading states
    const originalFetch = window.fetch
    window.fetch = function (input: RequestInfo | URL, init?: RequestInfo) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

      // Only show loading for API requests
      const config = useRuntimeConfig()
      const isApiRequest = url.startsWith(config.public.apiBase)

      if (isApiRequest) {
        setLoading(true, { key: 'fetch', showGlobalIndicator: false })
      }

      return originalFetch.call(this, input, init).finally(() => {
        if (isApiRequest) {
          setLoading(false, { key: 'fetch' })
        }
      })
    }
  }
})
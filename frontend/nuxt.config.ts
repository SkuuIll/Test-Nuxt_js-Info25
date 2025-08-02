// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: {
    enabled: true,
    timeline: {
      enabled: true
    }
  },
  compatibilityDate: '2025-07-28',

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false // Disable for now to avoid build issues
  },

  // CSS framework
  css: ['~/assets/css/main.css'],

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/image',
    '@vueuse/nuxt'
  ],

  // Tailwind CSS configuration
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
    exposeConfig: false,
    viewer: true,
  },

  // Runtime config
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8000',
      wsBase: process.env.WS_BASE_URL || 'ws://localhost:8000',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      corsEnabled: process.env.CORS_ENABLED !== 'false'
    }
  },

  // App configuration
  app: {
    head: {
      title: 'Blog de Noticias',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Tu fuente confiable de información actualizada y relevante' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ],
      script: [
        {
          innerHTML: `
            (function() {
              try {
                // Prevenir transiciones durante la carga inicial
                document.documentElement.classList.add('preload');
                
                var theme = localStorage.getItem('theme') || 'system';
                var isDark = false;
                
                if (theme === 'system') {
                  isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                } else {
                  isDark = theme === 'dark';
                }
                
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                // Fallback: tema claro por defecto
                document.documentElement.classList.remove('dark');
              }
            })();
          `,
          type: 'text/javascript'
        }
      ]
    }
  },

  // Build configuration
  build: {
    transpile: []
  },

  // Nitro configuration for API routes
  nitro: {
    experimental: {
      wasm: true
    }
  }
})
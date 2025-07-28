declare module '#app' {
  interface NuxtApp {
    $toast: {
      success: (message: string) => void
      error: (message: string) => void
      info: (message: string) => void
      warning: (message: string) => void
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $toast: {
      success: (message: string) => void
      error: (message: string) => void
      info: (message: string) => void
      warning: (message: string) => void
    }
  }
}

export {}
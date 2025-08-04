import type { NavigationGuard } from 'vue-router'
export type MiddlewareKey = "admin-check" | "admin" | "auth" | "guest"
declare module 'nuxt/app' {
  interface PageMeta {
    middleware?: MiddlewareKey | NavigationGuard | Array<MiddlewareKey | NavigationGuard>
  }
}
export type MiddlewareKey = "admin" | "auth" | "dashboard-auth" | "dashboard-permission" | "guest"
declare module 'nitropack' {
  interface NitroRouteConfig {
    appMiddleware?: MiddlewareKey | MiddlewareKey[] | Record<MiddlewareKey, boolean>
  }
}
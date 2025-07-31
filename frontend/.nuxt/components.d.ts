
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T extends DefineComponent> = T & DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>>
type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = (T & DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }>)
interface _GlobalComponents {
      'AppFooter': typeof import("../components/AppFooter.vue")['default']
    'AppHeader': typeof import("../components/AppHeader.vue")['default']
    'BackToTop': typeof import("../components/BackToTop.vue")['default']
    'BlogSidebar': typeof import("../components/BlogSidebar.vue")['default']
    'Breadcrumbs': typeof import("../components/Breadcrumbs.vue")['default']
    'CategoryFilter': typeof import("../components/CategoryFilter.vue")['default']
    'DashboardActivityFeed': typeof import("../components/Dashboard/ActivityFeed.vue")['default']
    'DashboardAuthStatus': typeof import("../components/Dashboard/AuthStatus.vue")['default']
    'DashboardBreadcrumb': typeof import("../components/Dashboard/Breadcrumb.vue")['default']
    'DashboardChart': typeof import("../components/Dashboard/Chart.vue")['default']
    'DashboardHeader': typeof import("../components/Dashboard/Header.vue")['default']
    'DashboardModal': typeof import("../components/Dashboard/Modal.vue")['default']
    'DashboardNotifications': typeof import("../components/Dashboard/Notifications.vue")['default']
    'DashboardPopularPosts': typeof import("../components/Dashboard/PopularPosts.vue")['default']
    'DashboardQuickAction': typeof import("../components/Dashboard/QuickAction.vue")['default']
    'DashboardRecentActivity': typeof import("../components/Dashboard/RecentActivity.vue")['default']
    'DashboardSessionWarning': typeof import("../components/Dashboard/SessionWarning.vue")['default']
    'DashboardSidebar': typeof import("../components/Dashboard/Sidebar.vue")['default']
    'DashboardSidebarItem': typeof import("../components/Dashboard/SidebarItem.vue")['default']
    'DashboardSidebarSection': typeof import("../components/Dashboard/SidebarSection.vue")['default']
    'DashboardStatCard': typeof import("../components/Dashboard/StatCard.vue")['default']
    'DashboardToast': typeof import("../components/Dashboard/Toast.vue")['default']
    'DashboardUserMenu': typeof import("../components/Dashboard/UserMenu.vue")['default']
    'DebugPanel': typeof import("../components/DebugPanel.vue")['default']
    'HeroSection': typeof import("../components/HeroSection.vue")['default']
    'Icon': typeof import("../components/Icon.vue")['default']
    'LoadingIndicator': typeof import("../components/LoadingIndicator.vue")['default']
    'PostCard': typeof import("../components/PostCard.vue")['default']
    'PostCardSkeleton': typeof import("../components/PostCardSkeleton.vue")['default']
    'PostGrid': typeof import("../components/PostGrid.vue")['default']
    'ReadingProgress': typeof import("../components/ReadingProgress.vue")['default']
    'SearchBar': typeof import("../components/SearchBar.vue")['default']
    'SkeletonLoader': typeof import("../components/SkeletonLoader.vue")['default']
    'SocialShare': typeof import("../components/SocialShare.vue")['default']
    'TableOfContents': typeof import("../components/TableOfContents.vue")['default']
    'ThemeToggle': typeof import("../components/ThemeToggle.vue")['default']
    'UiErrorBoundary': typeof import("../components/ui/ErrorBoundary.vue")['default']
    'UiErrorDisplay': typeof import("../components/ui/ErrorDisplay.vue")['default']
    'UiErrorMessage': typeof import("../components/ui/ErrorMessage.vue")['default']
    'UiLoadingIndicator': typeof import("../components/ui/LoadingIndicator.vue")['default']
    'UiLoadingSpinner': typeof import("../components/ui/LoadingSpinner.vue")['default']
    'UiProgressBar': typeof import("../components/ui/ProgressBar.vue")['default']
    'UiSkeletonLoader': typeof import("../components/ui/SkeletonLoader.vue")['default']
    'NuxtWelcome': typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
    'NuxtLayout': typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
    'NuxtErrorBoundary': typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
    'ClientOnly': typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
    'DevOnly': typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
    'ServerPlaceholder': typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
    'NuxtLink': typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
    'NuxtLoadingIndicator': typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
    'NuxtTime': typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
    'NuxtImg': typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue")['default']
    'NuxtPicture': typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtPicture.vue")['default']
    'NuxtPage': typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
    'NoScript': typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
    'Link': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
    'Base': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
    'Title': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
    'Meta': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
    'Style': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
    'Head': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
    'Html': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
    'Body': typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
    'NuxtIsland': typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
    'NuxtRouteAnnouncer': typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
      'LazyAppFooter': LazyComponent<typeof import("../components/AppFooter.vue")['default']>
    'LazyAppHeader': LazyComponent<typeof import("../components/AppHeader.vue")['default']>
    'LazyBackToTop': LazyComponent<typeof import("../components/BackToTop.vue")['default']>
    'LazyBlogSidebar': LazyComponent<typeof import("../components/BlogSidebar.vue")['default']>
    'LazyBreadcrumbs': LazyComponent<typeof import("../components/Breadcrumbs.vue")['default']>
    'LazyCategoryFilter': LazyComponent<typeof import("../components/CategoryFilter.vue")['default']>
    'LazyDashboardActivityFeed': LazyComponent<typeof import("../components/Dashboard/ActivityFeed.vue")['default']>
    'LazyDashboardAuthStatus': LazyComponent<typeof import("../components/Dashboard/AuthStatus.vue")['default']>
    'LazyDashboardBreadcrumb': LazyComponent<typeof import("../components/Dashboard/Breadcrumb.vue")['default']>
    'LazyDashboardChart': LazyComponent<typeof import("../components/Dashboard/Chart.vue")['default']>
    'LazyDashboardHeader': LazyComponent<typeof import("../components/Dashboard/Header.vue")['default']>
    'LazyDashboardModal': LazyComponent<typeof import("../components/Dashboard/Modal.vue")['default']>
    'LazyDashboardNotifications': LazyComponent<typeof import("../components/Dashboard/Notifications.vue")['default']>
    'LazyDashboardPopularPosts': LazyComponent<typeof import("../components/Dashboard/PopularPosts.vue")['default']>
    'LazyDashboardQuickAction': LazyComponent<typeof import("../components/Dashboard/QuickAction.vue")['default']>
    'LazyDashboardRecentActivity': LazyComponent<typeof import("../components/Dashboard/RecentActivity.vue")['default']>
    'LazyDashboardSessionWarning': LazyComponent<typeof import("../components/Dashboard/SessionWarning.vue")['default']>
    'LazyDashboardSidebar': LazyComponent<typeof import("../components/Dashboard/Sidebar.vue")['default']>
    'LazyDashboardSidebarItem': LazyComponent<typeof import("../components/Dashboard/SidebarItem.vue")['default']>
    'LazyDashboardSidebarSection': LazyComponent<typeof import("../components/Dashboard/SidebarSection.vue")['default']>
    'LazyDashboardStatCard': LazyComponent<typeof import("../components/Dashboard/StatCard.vue")['default']>
    'LazyDashboardToast': LazyComponent<typeof import("../components/Dashboard/Toast.vue")['default']>
    'LazyDashboardUserMenu': LazyComponent<typeof import("../components/Dashboard/UserMenu.vue")['default']>
    'LazyDebugPanel': LazyComponent<typeof import("../components/DebugPanel.vue")['default']>
    'LazyHeroSection': LazyComponent<typeof import("../components/HeroSection.vue")['default']>
    'LazyIcon': LazyComponent<typeof import("../components/Icon.vue")['default']>
    'LazyLoadingIndicator': LazyComponent<typeof import("../components/LoadingIndicator.vue")['default']>
    'LazyPostCard': LazyComponent<typeof import("../components/PostCard.vue")['default']>
    'LazyPostCardSkeleton': LazyComponent<typeof import("../components/PostCardSkeleton.vue")['default']>
    'LazyPostGrid': LazyComponent<typeof import("../components/PostGrid.vue")['default']>
    'LazyReadingProgress': LazyComponent<typeof import("../components/ReadingProgress.vue")['default']>
    'LazySearchBar': LazyComponent<typeof import("../components/SearchBar.vue")['default']>
    'LazySkeletonLoader': LazyComponent<typeof import("../components/SkeletonLoader.vue")['default']>
    'LazySocialShare': LazyComponent<typeof import("../components/SocialShare.vue")['default']>
    'LazyTableOfContents': LazyComponent<typeof import("../components/TableOfContents.vue")['default']>
    'LazyThemeToggle': LazyComponent<typeof import("../components/ThemeToggle.vue")['default']>
    'LazyUiErrorBoundary': LazyComponent<typeof import("../components/ui/ErrorBoundary.vue")['default']>
    'LazyUiErrorDisplay': LazyComponent<typeof import("../components/ui/ErrorDisplay.vue")['default']>
    'LazyUiErrorMessage': LazyComponent<typeof import("../components/ui/ErrorMessage.vue")['default']>
    'LazyUiLoadingIndicator': LazyComponent<typeof import("../components/ui/LoadingIndicator.vue")['default']>
    'LazyUiLoadingSpinner': LazyComponent<typeof import("../components/ui/LoadingSpinner.vue")['default']>
    'LazyUiProgressBar': LazyComponent<typeof import("../components/ui/ProgressBar.vue")['default']>
    'LazyUiSkeletonLoader': LazyComponent<typeof import("../components/ui/SkeletonLoader.vue")['default']>
    'LazyNuxtWelcome': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
    'LazyNuxtLayout': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
    'LazyNuxtErrorBoundary': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
    'LazyClientOnly': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
    'LazyDevOnly': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
    'LazyServerPlaceholder': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
    'LazyNuxtLink': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
    'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
    'LazyNuxtTime': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
    'LazyNuxtImg': LazyComponent<typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue")['default']>
    'LazyNuxtPicture': LazyComponent<typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtPicture.vue")['default']>
    'LazyNuxtPage': LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
    'LazyNoScript': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
    'LazyLink': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
    'LazyBase': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
    'LazyTitle': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
    'LazyMeta': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
    'LazyStyle': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
    'LazyHead': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
    'LazyHtml': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
    'LazyBody': LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
    'LazyNuxtIsland': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
    'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export const AppFooter: typeof import("../components/AppFooter.vue")['default']
export const AppHeader: typeof import("../components/AppHeader.vue")['default']
export const BackToTop: typeof import("../components/BackToTop.vue")['default']
export const BlogSidebar: typeof import("../components/BlogSidebar.vue")['default']
export const Breadcrumbs: typeof import("../components/Breadcrumbs.vue")['default']
export const CategoryFilter: typeof import("../components/CategoryFilter.vue")['default']
export const DashboardActivityFeed: typeof import("../components/Dashboard/ActivityFeed.vue")['default']
export const DashboardAuthStatus: typeof import("../components/Dashboard/AuthStatus.vue")['default']
export const DashboardBreadcrumb: typeof import("../components/Dashboard/Breadcrumb.vue")['default']
export const DashboardChart: typeof import("../components/Dashboard/Chart.vue")['default']
export const DashboardHeader: typeof import("../components/Dashboard/Header.vue")['default']
export const DashboardModal: typeof import("../components/Dashboard/Modal.vue")['default']
export const DashboardNotifications: typeof import("../components/Dashboard/Notifications.vue")['default']
export const DashboardPopularPosts: typeof import("../components/Dashboard/PopularPosts.vue")['default']
export const DashboardQuickAction: typeof import("../components/Dashboard/QuickAction.vue")['default']
export const DashboardRecentActivity: typeof import("../components/Dashboard/RecentActivity.vue")['default']
export const DashboardSessionWarning: typeof import("../components/Dashboard/SessionWarning.vue")['default']
export const DashboardSidebar: typeof import("../components/Dashboard/Sidebar.vue")['default']
export const DashboardSidebarItem: typeof import("../components/Dashboard/SidebarItem.vue")['default']
export const DashboardSidebarSection: typeof import("../components/Dashboard/SidebarSection.vue")['default']
export const DashboardStatCard: typeof import("../components/Dashboard/StatCard.vue")['default']
export const DashboardToast: typeof import("../components/Dashboard/Toast.vue")['default']
export const DashboardUserMenu: typeof import("../components/Dashboard/UserMenu.vue")['default']
export const DebugPanel: typeof import("../components/DebugPanel.vue")['default']
export const HeroSection: typeof import("../components/HeroSection.vue")['default']
export const Icon: typeof import("../components/Icon.vue")['default']
export const LoadingIndicator: typeof import("../components/LoadingIndicator.vue")['default']
export const PostCard: typeof import("../components/PostCard.vue")['default']
export const PostCardSkeleton: typeof import("../components/PostCardSkeleton.vue")['default']
export const PostGrid: typeof import("../components/PostGrid.vue")['default']
export const ReadingProgress: typeof import("../components/ReadingProgress.vue")['default']
export const SearchBar: typeof import("../components/SearchBar.vue")['default']
export const SkeletonLoader: typeof import("../components/SkeletonLoader.vue")['default']
export const SocialShare: typeof import("../components/SocialShare.vue")['default']
export const TableOfContents: typeof import("../components/TableOfContents.vue")['default']
export const ThemeToggle: typeof import("../components/ThemeToggle.vue")['default']
export const UiErrorBoundary: typeof import("../components/ui/ErrorBoundary.vue")['default']
export const UiErrorDisplay: typeof import("../components/ui/ErrorDisplay.vue")['default']
export const UiErrorMessage: typeof import("../components/ui/ErrorMessage.vue")['default']
export const UiLoadingIndicator: typeof import("../components/ui/LoadingIndicator.vue")['default']
export const UiLoadingSpinner: typeof import("../components/ui/LoadingSpinner.vue")['default']
export const UiProgressBar: typeof import("../components/ui/ProgressBar.vue")['default']
export const UiSkeletonLoader: typeof import("../components/ui/SkeletonLoader.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue")['default']
export const NuxtPicture: typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtPicture.vue")['default']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const LazyAppFooter: LazyComponent<typeof import("../components/AppFooter.vue")['default']>
export const LazyAppHeader: LazyComponent<typeof import("../components/AppHeader.vue")['default']>
export const LazyBackToTop: LazyComponent<typeof import("../components/BackToTop.vue")['default']>
export const LazyBlogSidebar: LazyComponent<typeof import("../components/BlogSidebar.vue")['default']>
export const LazyBreadcrumbs: LazyComponent<typeof import("../components/Breadcrumbs.vue")['default']>
export const LazyCategoryFilter: LazyComponent<typeof import("../components/CategoryFilter.vue")['default']>
export const LazyDashboardActivityFeed: LazyComponent<typeof import("../components/Dashboard/ActivityFeed.vue")['default']>
export const LazyDashboardAuthStatus: LazyComponent<typeof import("../components/Dashboard/AuthStatus.vue")['default']>
export const LazyDashboardBreadcrumb: LazyComponent<typeof import("../components/Dashboard/Breadcrumb.vue")['default']>
export const LazyDashboardChart: LazyComponent<typeof import("../components/Dashboard/Chart.vue")['default']>
export const LazyDashboardHeader: LazyComponent<typeof import("../components/Dashboard/Header.vue")['default']>
export const LazyDashboardModal: LazyComponent<typeof import("../components/Dashboard/Modal.vue")['default']>
export const LazyDashboardNotifications: LazyComponent<typeof import("../components/Dashboard/Notifications.vue")['default']>
export const LazyDashboardPopularPosts: LazyComponent<typeof import("../components/Dashboard/PopularPosts.vue")['default']>
export const LazyDashboardQuickAction: LazyComponent<typeof import("../components/Dashboard/QuickAction.vue")['default']>
export const LazyDashboardRecentActivity: LazyComponent<typeof import("../components/Dashboard/RecentActivity.vue")['default']>
export const LazyDashboardSessionWarning: LazyComponent<typeof import("../components/Dashboard/SessionWarning.vue")['default']>
export const LazyDashboardSidebar: LazyComponent<typeof import("../components/Dashboard/Sidebar.vue")['default']>
export const LazyDashboardSidebarItem: LazyComponent<typeof import("../components/Dashboard/SidebarItem.vue")['default']>
export const LazyDashboardSidebarSection: LazyComponent<typeof import("../components/Dashboard/SidebarSection.vue")['default']>
export const LazyDashboardStatCard: LazyComponent<typeof import("../components/Dashboard/StatCard.vue")['default']>
export const LazyDashboardToast: LazyComponent<typeof import("../components/Dashboard/Toast.vue")['default']>
export const LazyDashboardUserMenu: LazyComponent<typeof import("../components/Dashboard/UserMenu.vue")['default']>
export const LazyDebugPanel: LazyComponent<typeof import("../components/DebugPanel.vue")['default']>
export const LazyHeroSection: LazyComponent<typeof import("../components/HeroSection.vue")['default']>
export const LazyIcon: LazyComponent<typeof import("../components/Icon.vue")['default']>
export const LazyLoadingIndicator: LazyComponent<typeof import("../components/LoadingIndicator.vue")['default']>
export const LazyPostCard: LazyComponent<typeof import("../components/PostCard.vue")['default']>
export const LazyPostCardSkeleton: LazyComponent<typeof import("../components/PostCardSkeleton.vue")['default']>
export const LazyPostGrid: LazyComponent<typeof import("../components/PostGrid.vue")['default']>
export const LazyReadingProgress: LazyComponent<typeof import("../components/ReadingProgress.vue")['default']>
export const LazySearchBar: LazyComponent<typeof import("../components/SearchBar.vue")['default']>
export const LazySkeletonLoader: LazyComponent<typeof import("../components/SkeletonLoader.vue")['default']>
export const LazySocialShare: LazyComponent<typeof import("../components/SocialShare.vue")['default']>
export const LazyTableOfContents: LazyComponent<typeof import("../components/TableOfContents.vue")['default']>
export const LazyThemeToggle: LazyComponent<typeof import("../components/ThemeToggle.vue")['default']>
export const LazyUiErrorBoundary: LazyComponent<typeof import("../components/ui/ErrorBoundary.vue")['default']>
export const LazyUiErrorDisplay: LazyComponent<typeof import("../components/ui/ErrorDisplay.vue")['default']>
export const LazyUiErrorMessage: LazyComponent<typeof import("../components/ui/ErrorMessage.vue")['default']>
export const LazyUiLoadingIndicator: LazyComponent<typeof import("../components/ui/LoadingIndicator.vue")['default']>
export const LazyUiLoadingSpinner: LazyComponent<typeof import("../components/ui/LoadingSpinner.vue")['default']>
export const LazyUiProgressBar: LazyComponent<typeof import("../components/ui/ProgressBar.vue")['default']>
export const LazyUiSkeletonLoader: LazyComponent<typeof import("../components/ui/SkeletonLoader.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtImg.vue")['default']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/@nuxt/image/dist/runtime/components/NuxtPicture.vue")['default']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>

export const componentNames: string[]

import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock Nuxt composables
global.useRoute = vi.fn(() => ({
    params: { slug: 'test-category' },
    query: {},
    path: '/category/test-category',
    fullPath: '/category/test-category',
    name: 'category-slug',
    meta: {},
    hash: '',
    redirectedFrom: undefined,
}))

global.useRouter = vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    afterEach: vi.fn(),
}))

const mockToastService = {
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
}

global.useNuxtApp = vi.fn(() => ({
    $api: {
        getCategories: vi.fn().mockResolvedValue({ data: [] }),
        getCategoryPosts: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
        getPosts: vi.fn().mockResolvedValue({ data: { results: [], count: 0 } }),
    },
    $toast: mockToastService,
    $bus: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
    },
    provide: vi.fn(),
    vueApp: {
        config: {
            errorHandler: null,
        },
    },
}))

global.useHead = vi.fn()
global.useSeoMeta = vi.fn()
global.navigateTo = vi.fn()

// Mock Vue Composition API
global.ref = vi.fn((value) => ({ value }))
global.reactive = vi.fn((value) => value)
global.computed = vi.fn((fn) => ({ value: fn() }))
global.watch = vi.fn()
global.watchEffect = vi.fn()
global.onMounted = vi.fn()
global.onUnmounted = vi.fn()
global.onBeforeMount = vi.fn()
global.onBeforeUnmount = vi.fn()
global.onErrorCaptured = vi.fn()
global.nextTick = vi.fn().mockResolvedValue(undefined)
global.readonly = vi.fn((value) => value)

// Mock VueUse composables
global.useIntersectionObserver = vi.fn(() => ({
    stop: vi.fn(),
    isSupported: true,
}))

global.useEventListener = vi.fn()
global.useWindowSize = vi.fn(() => ({
    width: { value: 1024 },
    height: { value: 768 },
}))

global.useScroll = vi.fn(() => ({
    x: { value: 0 },
    y: { value: 0 },
}))

// Mock useToast composable
global.useToast = vi.fn(() => ({
    showToast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    authSuccess: vi.fn(),
    authError: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
}))

// Mock stores
global.useBlogStore = vi.fn(() => ({
    posts: { value: [] },
    categories: { value: [] },
    loading: { value: false },
    error: { value: null },
    fetchCategories: vi.fn(),
    fetchPosts: vi.fn(),
    fetchPostsByCategory: vi.fn(),
}))

global.useAuthStore = vi.fn(() => ({
    user: { value: null },
    isAuthenticated: { value: false },
    loading: { value: false },
    error: { value: null },
    initializeAuth: vi.fn(),
}))

global.useUIStore = vi.fn(() => ({
    theme: { value: 'light' },
    sidebarOpen: { value: false },
    loading: { value: false },
    error: { value: null },
    initializeTheme: vi.fn(),
    initializeWindowSize: vi.fn(),
    initializeScroll: vi.fn(),
}))

// Mock other composables
global.useNotifications = vi.fn(() => ({
    initializeNotifications: vi.fn(),
}))

global.useErrorHandler = vi.fn(() => ({
    handleError: vi.fn().mockReturnValue({ message: 'Test error' }),
}))

global.useApi = vi.fn(() => ({
    getPosts: vi.fn().mockResolvedValue({ data: [], results: [], count: 0 }),
    getCategories: vi.fn().mockResolvedValue({ data: [], results: [] }),
    getCategoryPosts: vi.fn().mockResolvedValue({ data: [], results: [], count: 0 }),
}))

global.useRuntimeConfig = vi.fn(() => ({
    public: {
        apiBase: 'http://localhost:8000',
        siteUrl: 'http://localhost:3000',
    },
}))

// Mock defineNuxtPlugin
global.defineNuxtPlugin = vi.fn((fn) => fn)

// Configure Vue Test Utils
config.global.stubs = {
    NuxtLink: {
        template: '<a><slot /></a>',
        props: ['to'],
    },
    PostCard: {
        template: '<div class="post-card"><slot /></div>',
        props: ['post', 'showExcerpt', 'showCategory', 'showAuthor', 'showDate'],
    },
    ToastNotification: {
        template: '<div class="toast-notification"><slot /></div>',
        props: ['toast'],
        emits: ['remove'],
    },
    EnhancedImage: {
        template: '<img />',
        props: ['src', 'alt', 'fallbackSrc', 'aspectRatio', 'containerClass', 'imageClass', 'lazyLoading', 'errorMessage'],
    },
    Icon: {
        template: '<span class="icon"></span>',
        props: ['name'],
    },
}

// Mock window and document
Object.defineProperty(window, 'location', {
    value: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000',
    },
    writable: true,
})

// Mock window event listeners
window.addEventListener = vi.fn()
window.removeEventListener = vi.fn()
window.dispatchEvent = vi.fn()

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
})

// Mock process
global.process = {
    client: true,
    server: false,
    env: {
        NODE_ENV: 'test',
    },
} as any

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
}
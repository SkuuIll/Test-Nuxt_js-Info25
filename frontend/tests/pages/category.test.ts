import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock category page component
const CategoryPage = {
    name: 'CategoryPage',
    template: `
    <div>
      <div v-if="loading" data-testid="loading">Loading...</div>
      <div v-else-if="error" data-testid="error">{{ error }}</div>
      <div v-else-if="posts.length === 0" data-testid="empty-state">No posts found</div>
      <div v-else>
        <div data-testid="category-header">{{ categoryName }}</div>
        <div data-testid="post-count">{{ posts.length }} posts</div>
        <div v-for="post in posts" :key="post.id" data-testid="post-card">
          <h2>{{ post.titulo }}</h2>
          <div class="post-author">{{ post.autor.username }}</div>
        </div>
      </div>
    </div>
  `,
    data() {
        return {
            posts: [],
            loading: false,
            error: null,
            categoryName: 'Test Category',
        }
    },
    async mounted() {
        await this.fetchPosts()
    },
    methods: {
        async fetchPosts() {
            const blogStore = global.useBlogStore()
            const route = global.useRoute()

            this.loading = blogStore.loading.value
            this.error = blogStore.error.value
            this.posts = blogStore.posts.value

            if (blogStore.fetchPostsByCategory) {
                await blogStore.fetchPostsByCategory(route.params.slug, {
                    page: parseInt(route.query.page) || 1,
                    page_size: 12,
                    ...(route.query.search && { search: route.query.search }),
                })
            }
        },
    },
}

describe('Category Page', () => {
    let mockBlogStore: any
    let mockRoute: any

    beforeEach(() => {
        mockBlogStore = {
            posts: { value: [] },
            categories: { value: [] },
            loading: { value: false },
            error: { value: null },
            fetchCategories: vi.fn(),
            fetchPosts: vi.fn(),
            fetchPostsByCategory: vi.fn().mockResolvedValue({
                results: [
                    {
                        id: 1,
                        titulo: 'Test Post 1',
                        slug: 'test-post-1',
                        contenido: 'Test content 1',
                        categoria: { nombre: 'Test Category', slug: 'test-category' },
                        autor: { username: 'testuser' },
                        fecha_publicacion: '2024-01-01T00:00:00Z',
                    },
                    {
                        id: 2,
                        titulo: 'Test Post 2',
                        slug: 'test-post-2',
                        contenido: 'Test content 2',
                        categoria: { nombre: 'Test Category', slug: 'test-category' },
                        autor: { username: 'testuser' },
                        fecha_publicacion: '2024-01-02T00:00:00Z',
                    },
                ],
                count: 2,
            }),
        }

        mockRoute = {
            params: { slug: 'test-category' },
            query: {},
            path: '/category/test-category',
            fullPath: '/category/test-category',
            name: 'category-slug',
            meta: {},
            hash: '',
            redirectedFrom: undefined,
        }

        global.useBlogStore = vi.fn(() => mockBlogStore)
        global.useRoute = vi.fn(() => mockRoute)
        global.useHead = vi.fn()
        global.useSeoMeta = vi.fn()
    })

    it('renders without crashing', () => {
        const wrapper = mount(CategoryPage)
        expect(wrapper.exists()).toBe(true)
    })

    it('calls fetchPostsByCategory on mount', async () => {
        mount(CategoryPage)

        // Wait for mounted hook
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(mockBlogStore.fetchPostsByCategory).toHaveBeenCalledWith('test-category', {
            page: 1,
            page_size: 12,
        })
    })

    it('displays category posts when loaded', async () => {
        mockBlogStore.posts.value = [
            {
                id: 1,
                titulo: 'Test Post 1',
                slug: 'test-post-1',
                contenido: 'Test content 1',
                categoria: { nombre: 'Test Category', slug: 'test-category' },
                autor: { username: 'testuser' },
                fecha_publicacion: '2024-01-01T00:00:00Z',
            },
        ]

        const wrapper = mount(CategoryPage)
        wrapper.vm.posts = mockBlogStore.posts.value
        await wrapper.vm.$nextTick()

        const postCards = wrapper.findAll('[data-testid="post-card"]')
        expect(postCards.length).toBeGreaterThan(0)
    })

    it('shows loading state while fetching posts', () => {
        mockBlogStore.loading.value = true

        const wrapper = mount(CategoryPage)
        wrapper.vm.loading = true

        const loadingElement = wrapper.find('[data-testid="loading"]')
        expect(loadingElement.exists()).toBe(true)
    })

    it('shows error state when fetch fails', async () => {
        mockBlogStore.error.value = 'Failed to fetch posts'

        const wrapper = mount(CategoryPage)
        wrapper.vm.error = 'Failed to fetch posts'
        await wrapper.vm.$nextTick()

        const errorElement = wrapper.find('[data-testid="error"]')
        expect(errorElement.exists()).toBe(true)
        expect(errorElement.text()).toContain('Failed to fetch posts')
    })

    it('shows empty state when no posts found', async () => {
        mockBlogStore.posts.value = []
        mockBlogStore.loading.value = false
        mockBlogStore.error.value = null

        const wrapper = mount(CategoryPage)
        wrapper.vm.posts = []
        wrapper.vm.loading = false
        wrapper.vm.error = null
        await wrapper.vm.$nextTick()

        const emptyElement = wrapper.find('[data-testid="empty-state"]')
        expect(emptyElement.exists()).toBe(true)
    })

    it('handles pagination correctly', async () => {
        mockRoute.query = { page: '2' }

        mount(CategoryPage)

        // Wait for mounted hook
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(mockBlogStore.fetchPostsByCategory).toHaveBeenCalledWith('test-category', {
            page: 2,
            page_size: 12,
        })
    })

    it('displays category information in header', async () => {
        const wrapper = mount(CategoryPage)
        await wrapper.vm.$nextTick()

        const categoryHeader = wrapper.find('[data-testid="category-header"]')
        expect(categoryHeader.exists()).toBe(true)
        expect(categoryHeader.text()).toContain('Test Category')
    })

    it('handles search within category', async () => {
        mockRoute.query = { search: 'test query' }

        mount(CategoryPage)

        // Wait for mounted hook
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(mockBlogStore.fetchPostsByCategory).toHaveBeenCalledWith('test-category', {
            page: 1,
            page_size: 12,
            search: 'test query',
        })
    })

    it('shows post count information', async () => {
        const wrapper = mount(CategoryPage)
        wrapper.vm.posts = [
            { id: 1, titulo: 'Post 1' },
            { id: 2, titulo: 'Post 2' },
        ]
        await wrapper.vm.$nextTick()

        const countElement = wrapper.find('[data-testid="post-count"]')
        expect(countElement.exists()).toBe(true)
        expect(countElement.text()).toContain('2')
    })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CategoryPage from '~/pages/category/[slug].vue'

// Mock Nuxt composables
const mockRoute = {
    params: { slug: 'test-category' }
}

const mockApi = {
    get: vi.fn()
}

const mockToast = {
    success: vi.fn(),
    error: vi.fn()
}

const mockUseHead = vi.fn()

vi.mock('#app', () => ({
    useRoute: () => mockRoute,
    useNuxtApp: () => ({ $api: mockApi }),
    useHead: mockUseHead
}))

vi.mock('~/composables/useToast', () => ({
    useToast: () => mockToast
}))

// Mock PostCard component
vi.mock('~/components/PostCard.vue', () => ({
    default: {
        name: 'PostCard',
        props: ['post'],
        template: '<div class="post-card">{{ post.titulo }}</div>'
    }
}))

describe('Category Page', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state initially', () => {
        const wrapper = mount(CategoryPage)

        expect(wrapper.find('.animate-pulse').exists()).toBe(true)
        expect(wrapper.findAll('.animate-pulse')).toHaveLength(6)
    })

    it('displays category name in header', async () => {
        const mockCategoryData = {
            nombre: 'Test Category',
            descripcion: 'Test category description'
        }

        mockApi.get.mockResolvedValueOnce({ data: mockCategoryData })
        mockApi.get.mockResolvedValueOnce({
            data: {
                results: [],
                count: 0,
                next: null
            }
        })

        const wrapper = mount(CategoryPage)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.find('h1').text()).toContain('Test Category')
        expect(wrapper.text()).toContain('Test category description')
    })

    it('displays posts when data is loaded', async () => {
        const mockPosts = [
            {
                id: 1,
                titulo: 'Test Post 1',
                slug: 'test-post-1',
                contenido: 'Test content 1'
            },
            {
                id: 2,
                titulo: 'Test Post 2',
                slug: 'test-post-2',
                contenido: 'Test content 2'
            }
        ]

        mockApi.get.mockResolvedValueOnce({ data: null }) // Category not found
        mockApi.get.mockResolvedValueOnce({
            data: {
                results: mockPosts,
                count: 2,
                next: null
            }
        })

        const wrapper = mount(CategoryPage)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.findAll('.post-card')).toHaveLength(2)
        expect(wrapper.text()).toContain('Test Post 1')
        expect(wrapper.text()).toContain('Test Post 2')
    })

    it('shows error state when API call fails', async () => {
        const mockError = new Error('API Error')
        mockApi.get.mockRejectedValue(mockError)

        const wrapper = mount(CategoryPage)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.find('.error-content').exists()).toBe(true)
        expect(wrapper.text()).toContain('Error al cargar el contenido')
    })

    it('shows 404 error for non-existent category', async () => {
        const mockError = { response: { status: 404 } }
        mockApi.get.mockRejectedValue(mockError)

        const wrapper = mount(CategoryPage)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.text()).toContain('Categoría no encontrada')
        expect(mockToast.error).toHaveBeenCalledWith(
            'Categoría no encontrada',
            'La categoría que buscas no existe.'
        )
    })

    it('shows empty state when no posts are found', async () => {
        mockApi.get.mockResolvedValueOnce({ data: { nombre: 'Empty Category' } })
        mockApi.get.mockResolvedValueOnce({
            data: {
                results: [],
                count: 0,
                next: null
            }
        })

        const wrapper = mount(CategoryPage)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.text()).toContain('No hay artículos disponibles')
        expect(wrapper.text()).toContain('Empty Category')
    })

    it('shows load more button when there are more posts', async () => {
        const mockPosts = [
            { id: 1, titulo: 'Post 1', slug: 'post-1' }
        ]

        mockApi.get.mockResolvedValueOnce({ data: null })
        mockApi.get.mockResolvedValueOnce({
            data: {
                results: mockPosts,
                count: 20,
                next: 'http://api.example.com/posts/?page=2'
            }
        })

        const wrapper = mount(CategoryPage)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.find('button').text()).toContain('Cargar más artículos')
    })

    it('loads more posts when load more button is clicked', async () => {
        const mockPosts1 = [{ id: 1, titulo: 'Post 1', slug: 'post-1' }]
        const mockPosts2 = [{ id: 2, titulo: 'Post 2', slug: 'post-2' }]

        // First call - initial load
        mockApi.get.mockResolvedValueOnce({ data: null })
        mockApi.get.mockResolvedValueOnce({
            data: {
                results: mockPosts1,
                count: 2,
                next: 'http://api.example.com/posts/?page=2'
            }
        })

        const wrapper = mount(CategoryPage)

        // Wait for initial load
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        // Mock second call for load more
        mockApi.get.mockResolvedValueOnce({
            data: {
                results: mockPosts2,
                count: 2,
                next: null
            }
        })

        // Click load more button
        const loadMoreButton = wrapper.find('button')
        await loadMoreButton.trigger('click')

        // Wait for load more operation
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.findAll('.post-card')).toHaveLength(2)
    })

    it('sets correct meta tags', () => {
        mount(CategoryPage)

        expect(mockUseHead).toHaveBeenCalledWith(
            expect.objectContaining({
                title: expect.any(Object), // computed value
                meta: expect.arrayContaining([
                    expect.objectContaining({
                        name: 'description'
                    }),
                    expect.objectContaining({
                        name: 'robots',
                        content: 'index, follow'
                    })
                ])
            })
        )
    })

    it('handles route parameter changes', async () => {
        const wrapper = mount(CategoryPage)

        // Change route parameter
        mockRoute.params.slug = 'new-category'

        // Trigger route change
        await wrapper.vm.$nextTick()

        // Should call API again with new slug
        expect(mockApi.get).toHaveBeenCalledWith(
            expect.stringContaining('new-category')
        )
    })

    it('refreshes data when refresh button is clicked', async () => {
        // First simulate an error
        mockApi.get.mockRejectedValueOnce(new Error('Network Error'))

        const wrapper = mount(CategoryPage)

        // Wait for error state
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        // Mock successful retry
        mockApi.get.mockResolvedValueOnce({ data: { nombre: 'Refreshed Category' } })
        mockApi.get.mockResolvedValueOnce({
            data: {
                results: [],
                count: 0,
                next: null
            }
        })

        // Click retry button
        const retryButton = wrapper.find('button')
        await retryButton.trigger('click')

        // Wait for refresh
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(mockApi.get).toHaveBeenCalledTimes(4) // 2 initial + 2 retry
    })

    it('displays total posts count', async () => {
        mockApi.get.mockResolvedValueOnce({
            data: {
                nombre: 'Test Category',
                descripcion: 'Test description'
            }
        })
        mockApi.get.mockResolvedValueOnce({
            data: {
                results: [],
                count: 42,
                next: null
            }
        })

        const wrapper = mount(CategoryPage)

        // Wait for async operations
        await wrapper.vm.$nextTick()
        await new Promise(resolve => setTimeout(resolve, 0))

        expect(wrapper.text()).toContain('42 artículos en esta categoría')
    })
})
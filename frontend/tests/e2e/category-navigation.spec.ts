import { test, expect } from '@playwright/test'

test.describe('Category Navigation E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Mock API responses
        await page.route('**/api/v1/categories/', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        {
                            id: 1,
                            nombre: 'Technology',
                            slug: 'technology',
                            descripcion: 'Posts about technology and innovation',
                        },
                        {
                            id: 2,
                            nombre: 'Science',
                            slug: 'science',
                            descripcion: 'Scientific discoveries and research',
                        },
                        {
                            id: 3,
                            nombre: 'Health',
                            slug: 'health',
                            descripcion: 'Health and wellness topics',
                        },
                    ],
                }),
            })
        })

        await page.route('**/api/v1/posts/?categoria__slug=technology*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        results: [
                            {
                                id: 1,
                                titulo: 'Latest Tech Trends',
                                slug: 'latest-tech-trends',
                                contenido: 'Content about latest technology trends...',
                                categoria: { nombre: 'Technology', slug: 'technology' },
                                autor: { username: 'techwriter' },
                                fecha_publicacion: '2024-01-15T10:00:00Z',
                                imagen: '/images/tech-trends.jpg',
                            },
                            {
                                id: 2,
                                titulo: 'AI Revolution',
                                slug: 'ai-revolution',
                                contenido: 'Content about AI revolution...',
                                categoria: { nombre: 'Technology', slug: 'technology' },
                                autor: { username: 'aiexpert' },
                                fecha_publicacion: '2024-01-14T15:30:00Z',
                                imagen: '/images/ai-revolution.jpg',
                            },
                        ],
                        count: 2,
                    },
                }),
            })
        })

        await page.route('**/api/v1/posts/?categoria__slug=science*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        results: [
                            {
                                id: 3,
                                titulo: 'Space Exploration',
                                slug: 'space-exploration',
                                contenido: 'Content about space exploration...',
                                categoria: { nombre: 'Science', slug: 'science' },
                                autor: { username: 'scientist' },
                                fecha_publicacion: '2024-01-13T09:00:00Z',
                                imagen: '/images/space.jpg',
                            },
                        ],
                        count: 1,
                    },
                }),
            })
        })

        await page.route('**/api/v1/posts/?categoria__slug=nonexistent*', async (route) => {
            await route.fulfill({
                status: 404,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    message: 'Category not found',
                }),
            })
        })
    })

    test('navigates to category page and displays posts', async ({ page }) => {
        // Navigate to technology category
        await page.goto('/category/technology')

        // Check if page loads correctly
        await expect(page).toHaveTitle(/Technology/)

        // Check category header
        const categoryHeader = page.locator('[data-testid="category-header"]')
        await expect(categoryHeader).toBeVisible()
        await expect(categoryHeader).toContainText('Technology')

        // Check if posts are displayed
        const postCards = page.locator('[data-testid="post-card"]')
        await expect(postCards).toHaveCount(2)

        // Check first post content
        const firstPost = postCards.first()
        await expect(firstPost.locator('h2')).toContainText('Latest Tech Trends')
        await expect(firstPost.locator('.post-author')).toContainText('techwriter')

        // Check second post content
        const secondPost = postCards.nth(1)
        await expect(secondPost.locator('h2')).toContainText('AI Revolution')
        await expect(secondPost.locator('.post-author')).toContainText('aiexpert')
    })

    test('displays loading state while fetching posts', async ({ page }) => {
        // Delay the API response to see loading state
        await page.route('**/api/v1/posts/?categoria__slug=technology*', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 1000))
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: { results: [], count: 0 },
                }),
            })
        })

        // Navigate to category page
        await page.goto('/category/technology')

        // Check if loading state is displayed
        const loadingElement = page.locator('[data-testid="loading"]')
        await expect(loadingElement).toBeVisible()

        // Wait for loading to complete
        await expect(loadingElement).not.toBeVisible({ timeout: 2000 })
    })

    test('displays empty state when no posts found', async ({ page }) => {
        // Mock empty response
        await page.route('**/api/v1/posts/?categoria__slug=technology*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: { results: [], count: 0 },
                }),
            })
        })

        // Navigate to category page
        await page.goto('/category/technology')

        // Check if empty state is displayed
        const emptyState = page.locator('[data-testid="empty-state"]')
        await expect(emptyState).toBeVisible()
        await expect(emptyState).toContainText('No posts found')
    })

    test('handles invalid category slug', async ({ page }) => {
        // Navigate to non-existent category
        await page.goto('/category/nonexistent')

        // Check if error state is displayed
        const errorElement = page.locator('[data-testid="error"]')
        await expect(errorElement).toBeVisible()
        await expect(errorElement).toContainText('Category not found')
    })

    test('displays post count information', async ({ page }) => {
        // Navigate to technology category
        await page.goto('/category/technology')

        // Check if post count is displayed
        const postCount = page.locator('[data-testid="post-count"]')
        await expect(postCount).toBeVisible()
        await expect(postCount).toContainText('2 posts')
    })

    test('handles pagination', async ({ page }) => {
        // Mock paginated response
        await page.route('**/api/v1/posts/?categoria__slug=technology&page=1*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        results: [
                            {
                                id: 1,
                                titulo: 'Post 1',
                                slug: 'post-1',
                                contenido: 'Content 1',
                                categoria: { nombre: 'Technology', slug: 'technology' },
                                autor: { username: 'author1' },
                                fecha_publicacion: '2024-01-15T10:00:00Z',
                            },
                        ],
                        count: 25,
                        next: 'http://localhost:8000/api/v1/posts/?categoria__slug=technology&page=2',
                        previous: null,
                    },
                }),
            })
        })

        await page.route('**/api/v1/posts/?categoria__slug=technology&page=2*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        results: [
                            {
                                id: 2,
                                titulo: 'Post 2',
                                slug: 'post-2',
                                contenido: 'Content 2',
                                categoria: { nombre: 'Technology', slug: 'technology' },
                                autor: { username: 'author2' },
                                fecha_publicacion: '2024-01-14T10:00:00Z',
                            },
                        ],
                        count: 25,
                        next: null,
                        previous: 'http://localhost:8000/api/v1/posts/?categoria__slug=technology&page=1',
                    },
                }),
            })
        })

        // Navigate to first page
        await page.goto('/category/technology?page=1')

        // Check if pagination controls are visible
        const pagination = page.locator('[data-testid="pagination"]')
        await expect(pagination).toBeVisible()

        // Check if next button is available
        const nextButton = page.locator('[data-testid="next-page"]')
        await expect(nextButton).toBeVisible()

        // Click next page
        await nextButton.click()

        // Check if URL updated
        await expect(page).toHaveURL(/page=2/)

        // Check if previous button is now available
        const prevButton = page.locator('[data-testid="prev-page"]')
        await expect(prevButton).toBeVisible()
    })

    test('handles search within category', async ({ page }) => {
        // Mock search response
        await page.route('**/api/v1/posts/?categoria__slug=technology&search=AI*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        results: [
                            {
                                id: 2,
                                titulo: 'AI Revolution',
                                slug: 'ai-revolution',
                                contenido: 'Content about AI revolution...',
                                categoria: { nombre: 'Technology', slug: 'technology' },
                                autor: { username: 'aiexpert' },
                                fecha_publicacion: '2024-01-14T15:30:00Z',
                            },
                        ],
                        count: 1,
                    },
                }),
            })
        })

        // Navigate to category page with search
        await page.goto('/category/technology?search=AI')

        // Check if search results are displayed
        const postCards = page.locator('[data-testid="post-card"]')
        await expect(postCards).toHaveCount(1)
        await expect(postCards.first().locator('h2')).toContainText('AI Revolution')

        // Check if search term is highlighted or indicated
        const searchInfo = page.locator('[data-testid="search-info"]')
        await expect(searchInfo).toBeVisible()
        await expect(searchInfo).toContainText('AI')
    })

    test('navigates between different categories', async ({ page }) => {
        // Start with technology category
        await page.goto('/category/technology')

        // Verify we're on technology page
        await expect(page.locator('[data-testid="category-header"]')).toContainText('Technology')

        // Navigate to science category
        await page.goto('/category/science')

        // Verify we're now on science page
        await expect(page.locator('[data-testid="category-header"]')).toContainText('Science')

        // Check if science posts are displayed
        const postCards = page.locator('[data-testid="post-card"]')
        await expect(postCards).toHaveCount(1)
        await expect(postCards.first().locator('h2')).toContainText('Space Exploration')
    })

    test('displays category description', async ({ page }) => {
        // Navigate to technology category
        await page.goto('/category/technology')

        // Check if category description is displayed
        const categoryDescription = page.locator('[data-testid="category-description"]')
        await expect(categoryDescription).toBeVisible()
        await expect(categoryDescription).toContainText('Posts about technology and innovation')
    })

    test('handles responsive design', async ({ page }) => {
        // Test mobile viewport
        await page.setViewportSize({ width: 375, height: 667 })
        await page.goto('/category/technology')

        // Check if mobile layout is applied
        const categoryHeader = page.locator('[data-testid="category-header"]')
        await expect(categoryHeader).toBeVisible()

        // Check if posts are displayed in mobile layout
        const postCards = page.locator('[data-testid="post-card"]')
        await expect(postCards).toHaveCount(2)

        // Test tablet viewport
        await page.setViewportSize({ width: 768, height: 1024 })
        await page.reload()

        // Check if tablet layout is applied
        await expect(categoryHeader).toBeVisible()
        await expect(postCards).toHaveCount(2)

        // Test desktop viewport
        await page.setViewportSize({ width: 1200, height: 800 })
        await page.reload()

        // Check if desktop layout is applied
        await expect(categoryHeader).toBeVisible()
        await expect(postCards).toHaveCount(2)
    })
})
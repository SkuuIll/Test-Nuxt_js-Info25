interface DashboardUser {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_active: boolean
    is_staff: boolean
    is_superuser: boolean
    date_joined: string
    last_login: string | null
    posts_count?: number
    comments_count?: number
    permissions?: {
        can_manage_posts: boolean
        can_manage_users: boolean
        can_manage_comments: boolean
        can_view_stats: boolean
    }
}

interface UsersResponse {
    count: number
    next: string | null
    previous: string | null
    results: DashboardUser[]
}

export const useDashboardUsers = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    const { accessToken } = useDashboardAuth()

    // State
    const users = ref<DashboardUser[]>([])
    const currentUser = ref<DashboardUser | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const totalCount = ref(0)

    // Fetch users list (using mock data for now)
    const fetchUsers = async (params: {
        page?: number
        page_size?: number
        search?: string
        is_active?: boolean
        is_staff?: boolean
        ordering?: string
    } = {}) => {
        loading.value = true
        error.value = null

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Mock users data
            const mockUsers: DashboardUser[] = [
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@blog.com',
                    first_name: 'Admin',
                    last_name: 'User',
                    is_active: true,
                    is_staff: true,
                    is_superuser: true,
                    date_joined: '2024-01-01T00:00:00Z',
                    last_login: '2024-07-29T10:00:00Z',
                    posts_count: 15,
                    comments_count: 25,
                    permissions: {
                        can_manage_posts: true,
                        can_manage_users: true,
                        can_manage_comments: true,
                        can_view_stats: true
                    }
                },
                {
                    id: 2,
                    username: 'editor',
                    email: 'editor@blog.com',
                    first_name: 'Editor',
                    last_name: 'Blog',
                    is_active: true,
                    is_staff: true,
                    is_superuser: false,
                    date_joined: '2024-02-15T00:00:00Z',
                    last_login: '2024-07-28T15:30:00Z',
                    posts_count: 8,
                    comments_count: 12,
                    permissions: {
                        can_manage_posts: true,
                        can_manage_users: false,
                        can_manage_comments: true,
                        can_view_stats: true
                    }
                },
                {
                    id: 3,
                    username: 'usuario1',
                    email: 'usuario1@ejemplo.com',
                    first_name: 'Juan',
                    last_name: 'Pérez',
                    is_active: true,
                    is_staff: false,
                    is_superuser: false,
                    date_joined: '2024-03-10T00:00:00Z',
                    last_login: '2024-07-20T09:15:00Z',
                    posts_count: 3,
                    comments_count: 18
                },
                {
                    id: 4,
                    username: 'maria_garcia',
                    email: 'maria@ejemplo.com',
                    first_name: 'María',
                    last_name: 'García',
                    is_active: true,
                    is_staff: false,
                    is_superuser: false,
                    date_joined: '2024-04-05T00:00:00Z',
                    last_login: null,
                    posts_count: 0,
                    comments_count: 5
                },
                {
                    id: 5,
                    username: 'carlos_inactive',
                    email: 'carlos@ejemplo.com',
                    first_name: 'Carlos',
                    last_name: 'López',
                    is_active: false,
                    is_staff: false,
                    is_superuser: false,
                    date_joined: '2024-01-20T00:00:00Z',
                    last_login: '2024-05-15T12:00:00Z',
                    posts_count: 2,
                    comments_count: 8
                }
            ]

            // Apply filters
            let filteredUsers = [...mockUsers]

            if (params.search) {
                const search = params.search.toLowerCase()
                filteredUsers = filteredUsers.filter(user =>
                    user.username.toLowerCase().includes(search) ||
                    user.email.toLowerCase().includes(search) ||
                    user.first_name.toLowerCase().includes(search) ||
                    user.last_name.toLowerCase().includes(search)
                )
            }

            if (params.is_active !== undefined) {
                filteredUsers = filteredUsers.filter(user => user.is_active === params.is_active)
            }

            if (params.is_staff !== undefined) {
                filteredUsers = filteredUsers.filter(user => user.is_staff === params.is_staff)
            }

            // Apply ordering
            if (params.ordering) {
                const [direction, field] = params.ordering.startsWith('-')
                    ? ['desc', params.ordering.slice(1)]
                    : ['asc', params.ordering]

                filteredUsers.sort((a, b) => {
                    let aVal = a[field as keyof DashboardUser]
                    let bVal = b[field as keyof DashboardUser]

                    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
                    if (typeof bVal === 'string') bVal = bVal.toLowerCase()

                    if (direction === 'desc') {
                        return aVal < bVal ? 1 : -1
                    }
                    return aVal > bVal ? 1 : -1
                })
            }

            // Apply pagination
            const pageSize = params.page_size || 10
            const page = params.page || 1
            const startIndex = (page - 1) * pageSize
            const endIndex = startIndex + pageSize
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

            users.value = paginatedUsers
            totalCount.value = filteredUsers.length

            return {
                count: filteredUsers.length,
                next: endIndex < filteredUsers.length ? 'next' : null,
                previous: startIndex > 0 ? 'prev' : null,
                results: paginatedUsers
            }
        } catch (err: any) {
            console.error('Users fetch error:', err)
            error.value = err.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    return {
        users: readonly(users),
        currentUser: readonly(currentUser),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        fetchUsers
    }
}
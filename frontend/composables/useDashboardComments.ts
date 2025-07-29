interface DashboardComment {
    id: number
    contenido: string
    content?: string
    approved: boolean
    fecha_creacion: string
    created_at?: string
    fecha_actualizacion: string
    updated_at?: string
    usuario: {
        id: number
        username: string
        email: string
        first_name: string
        last_name: string
    }
    author?: {
        id: number
        username: string
        email: string
        first_name: string
        last_name: string
    }
    post: {
        id: number
        titulo: string
        title?: string
    }
    parent?: {
        id: number
        contenido: string
        usuario: {
            username: string
        }
    }
    replies_count?: number
}

interface CommentsResponse {
    count: number
    next: string | null
    previous: string | null
    results: DashboardComment[]
}

export const useDashboardComments = () => {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase
    const { accessToken } = useDashboardAuth()

    // State
    const comments = ref<DashboardComment[]>([])
    const currentComment = ref<DashboardComment | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const totalCount = ref(0)

    // Fetch comments list (using mock data for now)
    const fetchComments = async (params: {
        page?: number
        page_size?: number
        search?: string
        approved?: boolean
        post?: number
        ordering?: string
    } = {}) => {
        loading.value = true
        error.value = null

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500))

            // Mock comments data
            const mockComments: DashboardComment[] = [
                {
                    id: 1,
                    contenido: 'Excelente artículo, muy informativo y bien explicado. Me ayudó mucho a entender el tema.',
                    approved: true,
                    fecha_creacion: '2024-07-29T10:30:00Z',
                    fecha_actualizacion: '2024-07-29T10:30:00Z',
                    usuario: {
                        id: 3,
                        username: 'usuario1',
                        email: 'usuario1@ejemplo.com',
                        first_name: 'Juan',
                        last_name: 'Pérez'
                    },
                    post: {
                        id: 1,
                        titulo: 'Guía completa de Django REST Framework'
                    },
                    replies_count: 2
                },
                {
                    id: 2,
                    contenido: 'No estoy de acuerdo con algunos puntos del artículo. Creo que falta más profundidad en ciertos aspectos.',
                    approved: false,
                    fecha_creacion: '2024-07-29T09:15:00Z',
                    fecha_actualizacion: '2024-07-29T09:15:00Z',
                    usuario: {
                        id: 4,
                        username: 'maria_garcia',
                        email: 'maria@ejemplo.com',
                        first_name: 'María',
                        last_name: 'García'
                    },
                    post: {
                        id: 2,
                        titulo: 'Festival de arte contemporáneo'
                    },
                    replies_count: 0
                },
                {
                    id: 3,
                    contenido: 'Gracias por compartir esta información. ¿Podrías agregar más ejemplos prácticos?',
                    approved: true,
                    fecha_creacion: '2024-07-28T16:45:00Z',
                    fecha_actualizacion: '2024-07-28T16:45:00Z',
                    usuario: {
                        id: 5,
                        username: 'carlos_inactive',
                        email: 'carlos@ejemplo.com',
                        first_name: 'Carlos',
                        last_name: 'López'
                    },
                    post: {
                        id: 1,
                        titulo: 'Guía completa de Django REST Framework'
                    },
                    parent: {
                        id: 1,
                        contenido: 'Excelente artículo...',
                        usuario: {
                            username: 'usuario1'
                        }
                    },
                    replies_count: 0
                },
                {
                    id: 4,
                    contenido: 'Spam comment with promotional content. This should be moderated.',
                    approved: false,
                    fecha_creacion: '2024-07-28T14:20:00Z',
                    fecha_actualizacion: '2024-07-28T14:20:00Z',
                    usuario: {
                        id: 6,
                        username: 'spammer',
                        email: 'spam@example.com',
                        first_name: 'Spam',
                        last_name: 'User'
                    },
                    post: {
                        id: 3,
                        titulo: 'Resultados del campeonato mundial'
                    },
                    replies_count: 0
                },
                {
                    id: 5,
                    contenido: '¡Me encantó este post! Muy bien estructurado y fácil de seguir.',
                    approved: true,
                    fecha_creacion: '2024-07-27T11:10:00Z',
                    fecha_actualizacion: '2024-07-27T11:10:00Z',
                    usuario: {
                        id: 7,
                        username: 'reader123',
                        email: 'reader@ejemplo.com',
                        first_name: 'Ana',
                        last_name: 'Martínez'
                    },
                    post: {
                        id: 2,
                        titulo: 'Festival de arte contemporáneo'
                    },
                    replies_count: 1
                }
            ]

            // Apply filters
            let filteredComments = [...mockComments]

            if (params.search) {
                const search = params.search.toLowerCase()
                filteredComments = filteredComments.filter(comment =>
                    comment.contenido.toLowerCase().includes(search) ||
                    comment.usuario.username.toLowerCase().includes(search) ||
                    comment.post.titulo.toLowerCase().includes(search)
                )
            }

            if (params.approved !== undefined) {
                filteredComments = filteredComments.filter(comment => comment.approved === params.approved)
            }

            if (params.post) {
                filteredComments = filteredComments.filter(comment => comment.post.id === params.post)
            }

            // Apply ordering
            if (params.ordering) {
                const [direction, field] = params.ordering.startsWith('-')
                    ? ['desc', params.ordering.slice(1)]
                    : ['asc', params.ordering]

                filteredComments.sort((a, b) => {
                    let aVal = a[field as keyof DashboardComment]
                    let bVal = b[field as keyof DashboardComment]

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
            const paginatedComments = filteredComments.slice(startIndex, endIndex)

            comments.value = paginatedComments
            totalCount.value = filteredComments.length

            return {
                count: filteredComments.length,
                next: endIndex < filteredComments.length ? 'next' : null,
                previous: startIndex > 0 ? 'prev' : null,
                results: paginatedComments
            }
        } catch (err: any) {
            console.error('Comments fetch error:', err)
            error.value = err.message || 'Error de conexión'
        } finally {
            loading.value = false
        }
    }

    // Approve comment (placeholder)
    const approveComment = async (id: number) => {
        try {
            const index = comments.value.findIndex(c => c.id === id)
            if (index !== -1) {
                comments.value[index].approved = true
                return true
            }
        } catch (err: any) {
            console.error('Approve comment error:', err)
            error.value = err.message || 'Error de conexión'
        }
    }

    // Reject comment (placeholder)
    const rejectComment = async (id: number) => {
        try {
            const index = comments.value.findIndex(c => c.id === id)
            if (index !== -1) {
                comments.value[index].approved = false
                return true
            }
        } catch (err: any) {
            console.error('Reject comment error:', err)
            error.value = err.message || 'Error de conexión'
        }
    }

    // Delete comment (placeholder)
    const deleteComment = async (id: number) => {
        try {
            comments.value = comments.value.filter(c => c.id !== id)
            return true
        } catch (err: any) {
            console.error('Delete comment error:', err)
            error.value = err.message || 'Error de conexión'
            return false
        }
    }

    // Bulk approve comments (placeholder)
    const bulkApproveComments = async (commentIds: number[]) => {
        try {
            let approvedCount = 0
            commentIds.forEach(id => {
                const index = comments.value.findIndex(c => c.id === id)
                if (index !== -1) {
                    comments.value[index].approved = true
                    approvedCount++
                }
            })
            return approvedCount
        } catch (err: any) {
            console.error('Bulk approve error:', err)
            error.value = err.message || 'Error de conexión'
        }
    }

    return {
        comments: readonly(comments),
        currentComment: readonly(currentComment),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        fetchComments,
        approveComment,
        rejectComment,
        deleteComment,
        bulkApproveComments
    }
}
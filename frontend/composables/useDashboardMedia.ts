/**
 * Dashboard media management composable
 * Handles file uploads, media library, and image management for dashboard
 */

interface MediaFile {
    id: number
    filename: string
    original_filename: string
    file_type: 'image' | 'document' | 'video' | 'audio'
    file_size: number
    file_url: string
    thumbnail_url?: string
    alt_text?: string
    caption?: string
    uploaded_by: {
        id: number
        username: string
    }
    uploaded_at: string
    is_featured: boolean
}

interface MediaFilters {
    page?: number
    page_size?: number
    search?: string
    file_type?: 'image' | 'document' | 'video' | 'audio'
    uploaded_by?: number
    date_from?: string
    date_to?: string
}

interface UploadProgress {
    filename: string
    progress: number
    status: 'uploading' | 'completed' | 'error'
    error?: string
}

export const useDashboardMedia = () => {
    const { dashboardApiCall, requirePermission } = useDashboardAuth()
    // Error handlers imported from utils to avoid circular dependencies
    const { dashboardLoading } = useLoading()

    // State
    const mediaFiles = ref<MediaFile[]>([])
    const currentFile = ref<MediaFile | null>(null)
    const uploadProgress = ref<UploadProgress[]>([])
    const loading = computed(() => dashboardLoading.loading.value)
    const error = ref<string | null>(null)
    const totalCount = ref(0)
    const currentFilters = ref<MediaFilters>({})

    // Computed
    const imageFiles = computed(() => mediaFiles.value.filter(f => f.file_type === 'image'))
    const documentFiles = computed(() => mediaFiles.value.filter(f => f.file_type === 'document'))
    const isUploading = computed(() => uploadProgress.value.some(p => p.status === 'uploading'))

    // Helper function to clean filters
    const cleanFilters = (filters: MediaFilters) => {
        const cleaned: Record<string, any> = {}
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                cleaned[key] = value
            }
        }
        return cleaned
    }

    // Fetch media files
    const fetchMediaFiles = async (filters: MediaFilters = {}) => {
        return await dashboardLoading.withLoading(async () => {
            try {
                error.value = null
                console.log('📡 Fetching dashboard media files with filters:', filters)

                // Require permission to manage media
                await requirePermission('can_manage_posts')

                // Store current filters
                currentFilters.value = { ...filters }

                const response = await dashboardApiCall<{ results: MediaFile[], count: number }>('/dashboard/media/', {
                    params: cleanFilters(filters)
                })

                mediaFiles.value = response.results || []
                totalCount.value = response.count || 0

                console.log('✅ Dashboard media files fetched successfully:', {
                    count: mediaFiles.value.length,
                    total: totalCount.value
                })

                return response
            } catch (err: any) {
                console.error('❌ Dashboard media files fetch error:', err)

                const errorInfo = handleApiError(err, 'Dashboard Media Files Fetch Failed')
                error.value = errorInfo.message

                throw err
            }
        })
    }

    // Upload single file
    const uploadFile = async (file: File, metadata: { alt_text?: string, caption?: string } = {}) => {
        try {
            console.log('📤 Uploading file:', file.name)

            // Require permission to manage media
            await requirePermission('can_manage_posts')

            // Add to upload progress
            const progressItem: UploadProgress = {
                filename: file.name,
                progress: 0,
                status: 'uploading'
            }
            uploadProgress.value.push(progressItem)

            // Create form data
            const formData = new FormData()
            formData.append('file', file)
            if (metadata.alt_text) formData.append('alt_text', metadata.alt_text)
            if (metadata.caption) formData.append('caption', metadata.caption)

            // Upload with progress tracking
            const response = await dashboardApiCall<MediaFile>('/dashboard/media/upload/', {
                method: 'POST',
                body: formData,
                onUploadProgress: (progressEvent: any) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    progressItem.progress = progress
                }
            })

            // Update progress status
            progressItem.status = 'completed'
            progressItem.progress = 100

            // Add to media files list
            mediaFiles.value.unshift(response)
            totalCount.value += 1

            console.log('✅ File uploaded successfully:', response.filename)

            // Remove from progress after delay
            setTimeout(() => {
                const index = uploadProgress.value.indexOf(progressItem)
                if (index > -1) {
                    uploadProgress.value.splice(index, 1)
                }
            }, 2000)

            return response
        } catch (err: any) {
            console.error('❌ File upload error:', err)

            // Update progress status
            const progressItem = uploadProgress.value.find(p => p.filename === file.name)
            if (progressItem) {
                progressItem.status = 'error'
                progressItem.error = err.message || 'Upload failed'
            }

            const errorInfo = handleApiError(err, 'File Upload Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Upload multiple files
    const uploadMultipleFiles = async (files: File[], metadata: { alt_text?: string, caption?: string } = {}) => {
        const results: MediaFile[] = []
        const errors: { file: string, error: string }[] = []

        for (const file of files) {
            try {
                const result = await uploadFile(file, metadata)
                results.push(result)
            } catch (error: any) {
                errors.push({ file: file.name, error: error.message })
            }
        }

        return { results, errors }
    }

    // Update media file
    const updateMediaFile = async (id: number, data: Partial<MediaFile>) => {
        try {
            console.log('📝 Updating media file:', id)

            // Require permission to manage media
            await requirePermission('can_manage_posts')

            const response = await dashboardApiCall<MediaFile>(`/dashboard/media/${id}/`, {
                method: 'PATCH',
                body: data
            })

            // Update in media files list
            const index = mediaFiles.value.findIndex(f => f.id === id)
            if (index !== -1) {
                mediaFiles.value[index] = response
            }

            // Update current file if it's the same
            if (currentFile.value?.id === id) {
                currentFile.value = response
            }

            console.log('✅ Media file updated successfully')
            return response
        } catch (err: any) {
            console.error('❌ Media file update error:', err)

            const errorInfo = handleApiError(err, 'Media File Update Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Delete media file
    const deleteMediaFile = async (id: number) => {
        try {
            console.log('🗑️ Deleting media file:', id)

            // Require permission to manage media
            await requirePermission('can_manage_posts')

            await dashboardApiCall(`/dashboard/media/${id}/`, {
                method: 'DELETE'
            })

            // Remove from media files list
            mediaFiles.value = mediaFiles.value.filter(f => f.id !== id)
            totalCount.value = Math.max(0, totalCount.value - 1)

            // Clear current file if it was deleted
            if (currentFile.value?.id === id) {
                currentFile.value = null
            }

            console.log('✅ Media file deleted successfully')
            return true
        } catch (err: any) {
            console.error('❌ Media file delete error:', err)

            const errorInfo = handleApiError(err, 'Media File Delete Failed')
            error.value = errorInfo.message

            throw err
        }
    }

    // Search media files
    const searchMediaFiles = async (query: string) => {
        return await fetchMediaFiles({ ...currentFilters.value, search: query, page: 1 })
    }

    // Filter by file type
    const filterByFileType = async (fileType: 'image' | 'document' | 'video' | 'audio') => {
        return await fetchMediaFiles({ ...currentFilters.value, file_type: fileType, page: 1 })
    }

    // Get file size in human readable format
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'

        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Check if file is image
    const isImageFile = (file: MediaFile): boolean => {
        return file.file_type === 'image'
    }

    // Get file icon based on type
    const getFileIcon = (file: MediaFile): string => {
        switch (file.file_type) {
            case 'image':
                return '🖼️'
            case 'document':
                return '📄'
            case 'video':
                return '🎥'
            case 'audio':
                return '🎵'
            default:
                return '📁'
        }
    }

    // Clear upload progress
    const clearUploadProgress = () => {
        uploadProgress.value = []
    }

    return {
        // State
        mediaFiles: readonly(mediaFiles),
        currentFile: readonly(currentFile),
        uploadProgress: readonly(uploadProgress),
        loading: readonly(loading),
        error: readonly(error),
        totalCount: readonly(totalCount),
        currentFilters: readonly(currentFilters),

        // Computed
        imageFiles: readonly(imageFiles),
        documentFiles: readonly(documentFiles),
        isUploading: readonly(isUploading),

        // File Operations
        fetchMediaFiles,
        uploadFile,
        uploadMultipleFiles,
        updateMediaFile,
        deleteMediaFile,

        // Search and Filter
        searchMediaFiles,
        filterByFileType,

        // Utilities
        formatFileSize,
        isImageFile,
        getFileIcon,
        clearUploadProgress,
        cleanFilters
    }
}
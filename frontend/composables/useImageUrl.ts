/**
 * Composable for handling image URLs consistently
 */

export const useImageUrl = () => {
    const config = useRuntimeConfig()

    const normalizeImageUrl = (imageUrl: string | null | undefined): string | null => {
        if (!imageUrl) return null

        console.log('🖼️ Normalizing image URL:', imageUrl)

        // If it's already a full URL, return as is
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            console.log('✅ Already full URL:', imageUrl)
            return imageUrl
        }

        // Get base URL
        const baseUrl = config.public.apiBase || 'http://localhost:8000'
        console.log('🔗 Base URL:', baseUrl)

        // Clean up the image URL to avoid double /media/
        let cleanImageUrl = imageUrl
        // Remove leading slash if present
        if (cleanImageUrl.startsWith('/')) {
            cleanImageUrl = cleanImageUrl.substring(1)
        }

        // If it already starts with media/, don't add it again
        if (cleanImageUrl.startsWith('media/')) {
            const fullUrl = `${baseUrl}/${cleanImageUrl}`
            console.log('📁 Media URL (cleaned):', fullUrl)
            return fullUrl
        }

        // Otherwise, add media/ prefix
        const fullUrl = `${baseUrl}/media/${cleanImageUrl}`
        console.log('📂 Added media prefix:', fullUrl)
        return fullUrl
    }

    const getImageUrl = (post: any): string | null => {
        const imageUrl = post.image_url || post.image || post.imagen
        console.log('🔍 Getting image URL for post:', {
            id: post.id,
            title: post.title || post.titulo,
            image_url: post.image_url,
            image: post.image,
            imagen: post.imagen,
            resolved: imageUrl
        })
        return normalizeImageUrl(imageUrl)
    }

    const getPlaceholderUrl = (type: 'post' | 'avatar' | 'category' = 'post'): string => {
        const placeholders = {
            post: '/images/post-placeholder.svg',
            avatar: '/images/avatar-placeholder.svg',
            category: '/images/category-placeholder.svg'
        }

        return placeholders[type] || placeholders.post
    }

    return {
        normalizeImageUrl,
        getImageUrl,
        getPlaceholderUrl
    }
}
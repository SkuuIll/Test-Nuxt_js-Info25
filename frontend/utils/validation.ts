/**
 * Utilidades de validación para la aplicación
 */

/**
 * Valida si un slug es válido
 */
export const isValidSlug = (slug: any): slug is string => {
    return (
        typeof slug === 'string' &&
        slug.length > 0 &&
        slug !== 'undefined' &&
        slug !== 'null' &&
        slug !== 'NaN' &&
        !slug.includes('undefined') &&
        !slug.includes('null')
    )
}

/**
 * Valida si un ID es válido
 */
export const isValidId = (id: any): id is number => {
    const numId = Number(id)
    return (
        !isNaN(numId) &&
        numId > 0 &&
        id !== 'undefined' &&
        id !== 'null'
    )
}

/**
 * Sanitiza un slug para uso seguro en URLs
 */
export const sanitizeSlug = (slug: any): string | null => {
    if (!isValidSlug(slug)) {
        console.warn('⚠️ Slug inválido detectado:', slug)
        return null
    }

    return slug.toString().trim()
}

/**
 * Genera un slug seguro desde un título
 */
export const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
        .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones múltiples
        .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
}

/**
 * Valida parámetros de ruta
 */
export const validateRouteParams = (params: Record<string, any>): boolean => {
    for (const [key, value] of Object.entries(params)) {
        if (!value || value === 'undefined' || value === 'null') {
            console.error(`❌ Parámetro de ruta inválido: ${key} = ${value}`)
            return false
        }
    }
    return true
}

/**
 * Crea una URL segura para posts
 */
export const createPostUrl = (post: { slug?: string; id?: number; title?: string }): string => {
    // Priorizar slug si está disponible
    if (isValidSlug(post.slug)) {
        return `/posts/${post.slug}`
    }

    // Fallback a ID si no hay slug
    if (isValidId(post.id)) {
        return `/posts/${post.id}`
    }

    // Generar slug desde título como último recurso
    if (post.title) {
        const generatedSlug = generateSlug(post.title)
        if (generatedSlug) {
            console.warn('⚠️ Usando slug generado para post:', { title: post.title, slug: generatedSlug })
            return `/posts/${generatedSlug}`
        }
    }

    console.error('❌ No se pudo crear URL para post:', post)
    return '/'
}
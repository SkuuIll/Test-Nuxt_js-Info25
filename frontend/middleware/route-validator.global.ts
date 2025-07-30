export default defineNuxtRouteMiddleware((to, from) => {
    // Solo ejecutar en desarrollo
    if (!process.dev) return

    // Verificar rutas de posts con parámetros problemáticos
    if (to.path.startsWith('/posts/')) {
        const slug = to.params.slug

        if (!slug || slug === 'undefined' || slug === 'null' || slug === '') {
            console.error('🚨 Navegación bloqueada - Slug inválido:', {
                path: to.path,
                slug: slug,
                params: to.params,
                from: from.path
            })

            // Redirigir a la página principal en lugar de mostrar error
            return navigateTo('/')
        }

        // Log navegación válida
        console.log('✅ Navegación válida a post:', {
            slug: slug,
            path: to.path
        })
    }

    // Verificar otras rutas dinámicas problemáticas
    const problematicPaths = ['/categories/', '/tags/', '/users/']

    for (const path of problematicPaths) {
        if (to.path.startsWith(path)) {
            const param = Object.values(to.params)[0]

            if (!param || param === 'undefined' || param === 'null') {
                console.error('🚨 Navegación bloqueada - Parámetro inválido:', {
                    path: to.path,
                    param: param,
                    params: to.params,
                    from: from.path
                })

                return navigateTo('/')
            }
        }
    }
})
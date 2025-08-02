<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Test de Navegación de Categorías</h1>
    
    <div class="space-y-4">
      <p class="text-gray-600">
        Esta página prueba la navegación a diferentes categorías para verificar que las rutas funcionan correctamente.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="category in testCategories"
          :key="category.slug"
          :to="`/category/${category.slug}`"
          class="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border"
        >
          <h3 class="font-semibold text-lg mb-2">{{ category.name }}</h3>
          <p class="text-gray-600 text-sm">{{ category.description }}</p>
          <div class="mt-2 text-xs text-blue-600">
            /category/{{ category.slug }}
          </div>
        </NuxtLink>
      </div>
      
      <div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 class="font-semibold text-yellow-800 mb-2">Nota:</h3>
        <p class="text-yellow-700 text-sm">
          Estas son categorías de prueba. Si alguna no existe en el backend, 
          verás un mensaje de error apropiado en la página de categoría.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Categorías de prueba para verificar la navegación
const testCategories = [
  {
    slug: 'tecnologia',
    name: 'Tecnología',
    description: 'Últimas noticias sobre tecnología e innovación'
  },
  {
    slug: 'deportes',
    name: 'Deportes',
    description: 'Noticias deportivas y resultados'
  },
  {
    slug: 'politica',
    name: 'Política',
    description: 'Actualidad política nacional e internacional'
  },
  {
    slug: 'economia',
    name: 'Economía',
    description: 'Noticias económicas y financieras'
  },
  {
    slug: 'cultura',
    name: 'Cultura',
    description: 'Arte, música, literatura y entretenimiento'
  },
  {
    slug: 'ciencia',
    name: 'Ciencia',
    description: 'Descubrimientos científicos y avances médicos'
  }
]

// Meta tags
useHead({
  title: 'Test de Categorías - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content: 'Página de prueba para verificar la navegación de categorías'
    }
  ]
})
</script>
</script>
</template>
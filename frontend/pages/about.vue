<template>
  <div class="container mx-auto px-4 py-8">
    <Breadcrumbs :items="[{ name: 'Acerca de' }]" />

    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-8">Acerca de Nosotros</h1>

      <div class="prose prose-lg dark:prose-invert max-w-none">
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Somos tu fuente confiable de información actualizada y relevante. Nuestro compromiso es
          brindarte las noticias más importantes de manera clara, objetiva y oportuna.
        </p>

        <h2>Nuestra Misión</h2>
        <p>
          Informar de manera veraz y objetiva sobre los acontecimientos más relevantes,
          proporcionando a nuestros lectores las herramientas necesarias para formar su propia
          opinión sobre los temas que afectan su vida cotidiana.
        </p>

        <h2>Nuestros Valores</h2>
        <ul>
          <li><strong>Veracidad:</strong> Verificamos cada información antes de publicarla</li>
          <li>
            <strong>Objetividad:</strong> Presentamos los hechos sin sesgos ni opiniones personales
          </li>
          <li>
            <strong>Transparencia:</strong> Citamos nuestras fuentes y corregimos errores cuando
            ocurren
          </li>
          <li>
            <strong>Responsabilidad:</strong> Entendemos el impacto de nuestro trabajo en la
            sociedad
          </li>
        </ul>

        <h2>Nuestro Equipo</h2>
        <p>
          Contamos con un equipo de periodistas experimentados y especializados en diferentes áreas,
          desde política y economía hasta tecnología y cultura. Cada miembro de nuestro equipo está
          comprometido con los más altos estándares del periodismo.
        </p>

        <h2>Contacto</h2>
        <p>
          ¿Tienes alguna sugerencia, comentario o información que quieras compartir con nosotros? No
          dudes en contactarnos a través de nuestros canales oficiales.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO
useHead({
  title: 'Acerca de Nosotros - Blog de Noticias',
  meta: [
    {
      name: 'description',
      content:
        'Conoce más sobre nuestro blog de noticias, nuestra misión, valores y el equipo que hace posible mantenerte informado.',
    },
  ],
})
</script>
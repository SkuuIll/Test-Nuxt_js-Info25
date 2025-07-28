<template>
  <section class="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div
        class="absolute inset-0"
        style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.1&quot;%3E%3Ccircle cx=&quot;7&quot; cy=&quot;7&quot; r=&quot;1&quot;/%3E%3Ccircle cx=&quot;27&quot; cy=&quot;7&quot; r=&quot;1&quot;/%3E%3Ccircle cx=&quot;47&quot; cy=&quot;7&quot; r=&quot;1&quot;/%3E%3Ccircle cx=&quot;7&quot; cy=&quot;27&quot; r=&quot;1&quot;/%3E%3Ccircle cx=&quot;27&quot; cy=&quot;27&quot; r=&quot;1&quot;/%3E%3Ccircle cx=&quot;47&quot; cy=&quot;27&quot; r=&quot;1&quot;/%3E%3Ccircle cx=&quot;7&quot; cy=&quot;47&quot; r=&quot;1&quot;/%3E%3Ccircle cx=&quot;27&quot; cy=&quot;47&quot; r=&quot;1&quot;/%3E%3Ccircle cx=&quot;47&quot; cy=&quot;47&quot; r=&quot;1&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      />
    </div>

    <div class="relative container mx-auto px-4 py-16 md:py-24">
      <div class="text-center">
        <!-- Main Title -->
        <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
          Bienvenido al
          <span class="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            Blog de Noticias
          </span>
        </h1>

        <!-- Subtitle -->
        <p class="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-slide-up">
          Tu fuente confiable de información actualizada y relevante
        </p>

        <!-- CTA Button -->
        <div class="mb-12 animate-scale-in">
          <NuxtLink
            to="/posts"
            class="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Explorar Artículos
          </NuxtLink>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div
            class="text-center animate-fade-in"
            style="animation-delay: 0.2s"
          >
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div class="text-3xl md:text-4xl font-bold text-white mb-2">
                {{ stats.posts }}
              </div>
              <div class="text-blue-200 font-medium">
                POSTS
              </div>
            </div>
          </div>

          <div
            class="text-center animate-fade-in"
            style="animation-delay: 0.4s"
          >
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div class="text-3xl md:text-4xl font-bold text-white mb-2">
                {{ stats.categories }}
              </div>
              <div class="text-blue-200 font-medium">
                CATEGORÍAS
              </div>
            </div>
          </div>

          <div
            class="text-center animate-fade-in"
            style="animation-delay: 0.6s"
          >
            <div class="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div class="text-3xl md:text-4xl font-bold text-white mb-2">
                {{ stats.comments }}
              </div>
              <div class="text-blue-200 font-medium">
                COMENTARIOS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <button
        class="text-white/70 hover:text-white transition-colors duration-200"
        @click="scrollToContent"
      >
        <Icon
          name="chevron-down"
          class="w-6 h-6"
        />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
const blogStore = useBlogStore()

// Computed stats
const stats = computed(() => ({
  posts: blogStore.posts.length || 10,
  categories: blogStore.categories.length || 6,
  comments: blogStore.posts.reduce((total, post) => total + post.comments_count, 0) || 20
}))

// Scroll to content
const scrollToContent = () => {
  const element = document.querySelector('main')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out 0.2s forwards;
  opacity: 0;
}

.animate-scale-in {
  animation: scaleIn 0.8s ease-out 0.4s forwards;
  opacity: 0;
}
</style>
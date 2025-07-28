<template>
  <article class="card group cursor-pointer">
    <!-- Image -->
    <div class="relative overflow-hidden rounded-t-lg">
      <NuxtImg
        v-if="post.image"
        :src="post.image"
        :alt="post.title"
        class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        format="webp"
      />
      <div
        v-else
        class="w-full h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"
      >
        <Icon
          name="newspaper"
          class="w-12 h-12 text-white opacity-50"
        />
      </div>
      
      <!-- Category Badge -->
      <div
        v-if="showCategory"
        class="absolute top-3 left-3"
      >
        <NuxtLink
          :to="`/category/${post.category.slug}`"
          class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-900 hover:bg-white transition-colors duration-200"
          @click.stop
        >
          {{ post.category.name }}
        </NuxtLink>
      </div>
      
      <!-- Reading Time -->
      <div class="absolute top-3 right-3">
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white">
          <Icon
            name="clock"
            class="w-3 h-3 mr-1"
          />
          {{ post.reading_time }} min
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Title -->
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
        <NuxtLink
          :to="`/posts/${post.slug}`"
          class="hover:underline"
        >
          {{ post.title }}
        </NuxtLink>
      </h2>

      <!-- Excerpt -->
      <p
        v-if="showExcerpt"
        class="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3"
      >
        {{ post.excerpt }}
      </p>

      <!-- Meta Information -->
      <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div class="flex items-center space-x-4">
          <!-- Author -->
          <div
            v-if="showAuthor"
            class="flex items-center space-x-2"
          >
            <div class="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {{ post.author.username.charAt(0).toUpperCase() }}
            </div>
            <span>{{ post.author.username }}</span>
          </div>

          <!-- Date -->
          <div
            v-if="showDate"
            class="flex items-center space-x-1"
          >
            <Icon
              name="calendar"
              class="w-4 h-4"
            />
            <time :datetime="post.published_at || post.created_at">
              {{ formatDate(post.published_at || post.created_at) }}
            </time>
          </div>
        </div>

        <!-- Comments Count -->
        <div class="flex items-center space-x-1">
          <Icon
            name="chat"
            class="w-4 h-4"
          />
          <span>{{ post.comments_count }}</span>
        </div>
      </div>

      <!-- Tags -->
      <div
        v-if="post.tags && post.tags.length > 0"
        class="mt-4 flex flex-wrap gap-2"
      >
        <NuxtLink
          v-for="tag in post.tags.slice(0, 3)"
          :key="tag.id"
          :to="`/tag/${tag.slug}`"
          class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200"
          @click.stop
        >
          <Icon
            name="tag"
            class="w-3 h-3 mr-1"
          />
          {{ tag.name }}
        </NuxtLink>
        <span
          v-if="post.tags.length > 3"
          class="text-xs text-gray-500"
        >
          +{{ post.tags.length - 3 }} más
        </span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Post } from '~/types'

interface Props {
  post: Post
  showExcerpt?: boolean
  showCategory?: boolean
  showAuthor?: boolean
  showDate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showExcerpt: true,
  showCategory: true,
  showAuthor: true,
  showDate: true
})

// Format date utility
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return 'Hace 1 día'
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`
  } else {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
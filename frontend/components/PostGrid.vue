<template>
  <div class="space-y-8">
    <!-- Posts Grid -->
    <div
      v-if="posts.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        :show-excerpt="showExcerpt"
        :show-category="showCategory"
        :show-author="showAuthor"
        :show-date="showDate"
        @click="navigateToPost(post.slug)"
      />
    </div>

    <!-- Loading Skeletons -->
    <div
      v-if="loading && posts.length === 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <PostCardSkeleton
        v-for="i in skeletonCount"
        :key="i"
      />
    </div>

    <!-- Load More Skeletons (for infinite scroll) -->
    <div
      v-if="loading && posts.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <PostCardSkeleton
        v-for="i in 3"
        :key="`loading-${i}`"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && posts.length === 0"
      class="text-center py-12"
    >
      <Icon
        name="newspaper"
        class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{ emptyTitle }}
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ emptyMessage }}
      </p>
      <NuxtLink
        to="/"
        class="btn btn-primary"
      >
        Ver todos los artículos
      </NuxtLink>
    </div>

    <!-- Load More Button (fallback for infinite scroll) -->
    <div
      v-if="hasMore && !infiniteScroll && posts.length > 0"
      class="text-center"
    >
      <button
        :disabled="loading"
        class="btn btn-secondary"
        @click="loadMore"
      >
        <Icon
          v-if="loading"
          name="loading"
          class="w-4 h-4 animate-spin mr-2"
        />
        {{ loading ? 'Cargando...' : 'Cargar más artículos' }}
      </button>
    </div>

    <!-- Infinite Scroll Trigger -->
    <div
      v-if="infiniteScroll && hasMore"
      ref="infiniteScrollTrigger"
      class="h-10 flex items-center justify-center"
    >
      <Icon
        v-if="loading"
        name="loading"
        class="w-6 h-6 animate-spin text-primary-600"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~/types'

interface Props {
  posts: Post[]
  loading?: boolean
  hasMore?: boolean
  infiniteScroll?: boolean
  showExcerpt?: boolean
  showCategory?: boolean
  showAuthor?: boolean
  showDate?: boolean
  skeletonCount?: number
  emptyTitle?: string
  emptyMessage?: string
}

interface Emits {
  (e: 'load-more'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hasMore: false,
  infiniteScroll: true,
  showExcerpt: true,
  showCategory: true,
  showAuthor: true,
  showDate: true,
  skeletonCount: 6,
  emptyTitle: 'No hay artículos disponibles',
  emptyMessage: 'No se encontraron artículos en este momento.'
})

const emit = defineEmits<Emits>()

const infiniteScrollTrigger = ref<HTMLElement>()

const navigateToPost = (slug: string) => {
  navigateTo(`/posts/${slug}`)
}

const loadMore = () => {
  if (!props.loading && props.hasMore) {
    emit('load-more')
  }
}

// Infinite scroll implementation
const { stop } = useIntersectionObserver(
  infiniteScrollTrigger,
  ([{ isIntersecting }]) => {
    if (isIntersecting && props.infiniteScroll && props.hasMore && !props.loading) {
      loadMore()
    }
  },
  {
    threshold: 0.1,
    rootMargin: '100px'
  }
)

// Cleanup intersection observer on unmount
onUnmounted(() => {
  stop()
})
</script>
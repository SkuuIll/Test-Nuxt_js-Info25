<template>
  <div>
    <ul v-if="posts.length > 0" role="list" class="divide-y divide-gray-200">
      <li
        v-for="(post, index) in posts"
        :key="post.id"
        class="py-4 hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center space-x-4">
          <!-- Ranking number -->
          <div class="flex-shrink-0">
            <span
              :class="[
                'inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium',
                {
                  'bg-yellow-100 text-yellow-800': index === 0,
                  'bg-gray-100 text-gray-800': index === 1,
                  'bg-orange-100 text-orange-800': index === 2,
                  'bg-blue-100 text-blue-800': index > 2
                }
              ]"
            >
              {{ index + 1 }}
            </span>
          </div>
          
          <!-- Post info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ post.title || post.titulo }}
            </p>
            <div class="flex items-center mt-1 space-x-4 text-xs text-gray-500">
              <span class="flex items-center">
                <ChatBubbleLeftIcon class="h-3 w-3 mr-1" />
                {{ post.comments_count || 0 }} comentarios
              </span>
              <span class="flex items-center">
                <UserIcon class="h-3 w-3 mr-1" />
                {{ post.author?.username || 'Anónimo' }}
              </span>
              <span v-if="post.published_date || post.fecha_publicacion">
                {{ formatDate(post.published_date || post.fecha_publicacion) }}
              </span>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex-shrink-0">
            <NuxtLink
              :to="`/dashboard/posts/${post.id}/edit`"
              class="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Editar
            </NuxtLink>
          </div>
        </div>
      </li>
    </ul>
    
    <!-- Empty state -->
    <div v-else class="text-center py-8">
      <DocumentTextIcon class="mx-auto h-12 w-12 text-gray-300" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">
        No hay posts populares
      </h3>
      <p class="mt-1 text-sm text-gray-500">
        Los posts con más comentarios aparecerán aquí
      </p>
    </div>
    
    <!-- View all link -->
    <div v-if="posts.length > 0" class="mt-6">
      <NuxtLink
        to="/dashboard/posts"
        class="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        Ver todos los posts
        <ArrowRightIcon class="ml-2 h-4 w-4" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChatBubbleLeftIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline'

interface Post {
  id: number
  title?: string
  titulo?: string
  comments_count?: number
  author?: {
    username: string
  }
  published_date?: string
  fecha_publicacion?: string
}

interface Props {
  posts: Post[]
}

defineProps<Props>()

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>
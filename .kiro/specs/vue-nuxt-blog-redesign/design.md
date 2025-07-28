# Design Document - Vue.js + Nuxt.js Blog Redesign

## Overview

Este diseño describe la arquitectura completa para migrar el blog de Django templates a una aplicación Vue.js + Nuxt.js moderna. El sistema mantendrá Django como API backend mientras reemplaza completamente el frontend con una SPA optimizada, responsive y sin conflictos de CSS.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nuxt.js App  │    │   Django API    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ - Vue 3         │    │ - REST API      │    │ - Posts         │
│ - TypeScript    │    │ - Authentication│    │ - Users         │
│ - Tailwind CSS  │    │ - Admin Panel   │    │ - Comments      │
│ - Pinia Store   │    │ - File Upload   │    │ - Categories    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Architecture (Nuxt.js)

```
frontend/
├── components/          # Vue components reutilizables
│   ├── ui/             # Componentes base (Button, Card, etc.)
│   ├── layout/         # Layout components (Header, Footer)
│   ├── blog/           # Blog-specific components
│   └── forms/          # Form components
├── pages/              # Rutas automáticas de Nuxt
├── layouts/            # Layout templates
├── middleware/         # Route middleware
├── plugins/            # Vue plugins
├── stores/             # Pinia stores
├── composables/        # Vue composables
├── utils/              # Utility functions
└── assets/             # Static assets
```

### Backend Architecture (Django API - Optimized)

```
backend/
├── api/                # Restructured API endpoints
│   ├── v1/             # API versioning
│   │   ├── posts/      # Posts CRUD with pagination
│   │   ├── auth/       # JWT authentication
│   │   ├── comments/   # Comments with threading
│   │   ├── categories/ # Categories with post counts
│   │   ├── search/     # Full-text search
│   │   └── media/      # File upload handling
├── models/             # Optimized database models
├── serializers/        # DRF serializers with optimization
├── permissions/        # Role-based permissions
├── filters/            # Advanced filtering
├── pagination/         # Custom pagination
└── middleware/         # CORS and security
```

## Components and Interfaces

### Core Components

#### 1. Layout Components

**AppHeader.vue**
```vue
<template>
  <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
    <nav class="container mx-auto px-4 py-3">
      <!-- Compact navigation with theme toggle -->
    </nav>
  </header>
</template>
```

**AppFooter.vue**
```vue
<template>
  <footer class="bg-gray-50 dark:bg-gray-900 mt-auto">
    <!-- Minimalist footer with social links -->
  </footer>
</template>
```

#### 2. Blog Components

**PostCard.vue**
```vue
<template>
  <article class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all">
    <img :src="post.image" class="w-full h-48 object-cover rounded-t-lg" loading="lazy">
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-2">{{ post.title }}</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-4">{{ post.excerpt }}</p>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">{{ formatDate(post.created_at) }}</span>
        <NuxtLink :to="`/posts/${post.slug}`" class="btn-primary">Leer más</NuxtLink>
      </div>
    </div>
  </article>
</template>
```

**PostGrid.vue**
```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <PostCard v-for="post in posts" :key="post.id" :post="post" />
  </div>
  <InfiniteScroll @load="loadMore" />
</template>
```

#### 3. UI Components

**ThemeToggle.vue**
```vue
<template>
  <button @click="toggleTheme" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
    <Icon :name="isDark ? 'sun' : 'moon'" class="w-5 h-5" />
  </button>
</template>
```

**SearchBar.vue**
```vue
<template>
  <div class="relative">
    <input 
      v-model="query" 
      @input="search"
      class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
      placeholder="Buscar artículos..."
    >
    <SearchResults v-if="results.length" :results="results" />
  </div>
</template>
```

### API Integration Layer

#### Enhanced API Service (composables/useApi.ts)

```typescript
export const useApi = () => {
  const config = useRuntimeConfig()
  const { $auth } = useNuxtApp()
  
  const api = $fetch.create({
    baseURL: config.public.apiBase + '/api/v1',
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest({ request, options }) {
      // Add JWT token to requests
      const token = $auth.getToken()
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      }
    },
    onResponseError({ response }) {
      // Handle token refresh
      if (response.status === 401) {
        return $auth.refreshToken()
      }
    }
  })
  
  return {
    // Posts with advanced features
    getPosts: (params?: PostsParams) => api('/posts/', { params }),
    getPost: (slug: string) => api(`/posts/${slug}/`),
    searchPosts: (query: string, filters?: SearchFilters) => api('/posts/search/', { params: { query, ...filters } }),
    
    // Categories with post counts
    getCategories: () => api('/categories/'),
    getCategoryPosts: (slug: string, params?: any) => api(`/categories/${slug}/posts/`, { params }),
    
    // Enhanced Auth
    login: (credentials: LoginCredentials) => api('/auth/login/', { method: 'POST', body: credentials }),
    register: (userData: RegisterData) => api('/auth/register/', { method: 'POST', body: userData }),
    refreshToken: () => api('/auth/refresh/', { method: 'POST' }),
    logout: () => api('/auth/logout/', { method: 'POST' }),
    
    // Comments with threading
    getComments: (postId: number, params?: CommentParams) => api(`/posts/${postId}/comments/`, { params }),
    createComment: (postId: number, comment: CreateCommentData) => api(`/posts/${postId}/comments/`, { method: 'POST', body: comment }),
    
    // Media upload
    uploadImage: (file: File) => {
      const formData = new FormData()
      formData.append('image', file)
      return api('/media/upload/', { method: 'POST', body: formData })
    }
  }
}
```

#### Store Management (stores/blog.ts)

```typescript
export const useBlogStore = defineStore('blog', () => {
  const posts = ref([])
  const categories = ref([])
  const currentPost = ref(null)
  const loading = ref(false)
  
  const { getPosts, getPost, getCategories } = useApi()
  
  const fetchPosts = async (params = {}) => {
    loading.value = true
    try {
      const data = await getPosts(params)
      posts.value = data.results
    } finally {
      loading.value = false
    }
  }
  
  const fetchPost = async (slug: string) => {
    loading.value = true
    try {
      currentPost.value = await getPost(slug)
    } finally {
      loading.value = false
    }
  }
  
  return {
    posts: readonly(posts),
    categories: readonly(categories),
    currentPost: readonly(currentPost),
    loading: readonly(loading),
    fetchPosts,
    fetchPost
  }
})
```

## Data Models

### Frontend Types (types/index.ts)

```typescript
export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  image?: string
  author: User
  category: Category
  created_at: string
  updated_at: string
  comments_count: number
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  posts_count: number
}

export interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  avatar?: string
}

export interface Comment {
  id: number
  content: string
  author: User
  post: number
  created_at: string
  parent?: number
  replies?: Comment[]
}
```

### API Response Types

```typescript
export interface ApiResponse<T> {
  count: number
  next?: string
  previous?: string
  results: T[]
}

export interface ApiError {
  detail: string
  code?: string
}
```

## Error Handling

### Global Error Handler (plugins/error-handler.ts)

```typescript
export default defineNuxtPlugin(() => {
  const toast = useToast()
  
  // Handle API errors globally
  $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login')
      } else if (response.status >= 500) {
        toast.error('Error del servidor. Intenta de nuevo.')
      }
    }
  })
})
```

### Error Boundaries

```vue
<!-- components/ErrorBoundary.vue -->
<template>
  <div v-if="error" class="error-state">
    <h2>Algo salió mal</h2>
    <p>{{ error.message }}</p>
    <button @click="retry">Reintentar</button>
  </div>
  <slot v-else />
</template>
```

## Testing Strategy

### Component Testing (Vitest + Vue Test Utils)

```typescript
// tests/components/PostCard.test.ts
import { mount } from '@vue/test-utils'
import PostCard from '~/components/blog/PostCard.vue'

describe('PostCard', () => {
  it('renders post information correctly', () => {
    const post = {
      id: 1,
      title: 'Test Post',
      excerpt: 'Test excerpt',
      created_at: '2024-01-01'
    }
    
    const wrapper = mount(PostCard, {
      props: { post }
    })
    
    expect(wrapper.text()).toContain('Test Post')
    expect(wrapper.text()).toContain('Test excerpt')
  })
})
```

### E2E Testing (Playwright)

```typescript
// tests/e2e/blog.spec.ts
import { test, expect } from '@playwright/test'

test('user can browse posts', async ({ page }) => {
  await page.goto('/')
  
  // Check posts are loaded
  await expect(page.locator('[data-testid="post-card"]')).toHaveCount(6)
  
  // Click on first post
  await page.locator('[data-testid="post-card"]').first().click()
  
  // Should navigate to post detail
  await expect(page).toHaveURL(/\/posts\/.*/)
})
```

## Performance Optimization

### Code Splitting Strategy

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    experimental: {
      wasm: true
    }
  },
  
  // Automatic code splitting
  build: {
    splitChunks: {
      layouts: true,
      pages: true,
      commons: true
    }
  }
})
```

### Image Optimization

```vue
<template>
  <NuxtImg
    :src="post.image"
    :alt="post.title"
    width="400"
    height="300"
    format="webp"
    loading="lazy"
    class="w-full h-48 object-cover"
  />
</template>
```

### Caching Strategy

```typescript
// Server-side caching
export default defineEventHandler(async (event) => {
  return await cachedFunction(
    () => $fetch('/api/posts/'),
    {
      maxAge: 1000 * 60 * 5, // 5 minutes
      name: 'posts',
      getKey: () => 'all-posts'
    }
  )()
})
```

## SEO Implementation

### Dynamic Meta Tags

```vue
<!-- pages/posts/[slug].vue -->
<script setup>
const { data: post } = await useFetch(`/api/posts/${route.params.slug}/`)

useSeoMeta({
  title: post.value.title,
  description: post.value.excerpt,
  ogTitle: post.value.title,
  ogDescription: post.value.excerpt,
  ogImage: post.value.image,
  twitterCard: 'summary_large_image'
})
</script>
```

### Structured Data

```typescript
// composables/useStructuredData.ts
export const useStructuredData = (post: Post) => {
  useJsonld({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    author: {
      '@type': 'Person',
      name: post.author.username
    },
    datePublished: post.created_at,
    dateModified: post.updated_at
  })
}
```

## Deployment Architecture

### Build Process

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to production
        run: npm run deploy
```

### Environment Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8000',
      siteUrl: process.env.SITE_URL || 'http://localhost:3000'
    }
  }
})
```

## Migration Strategy

### Phase 1: Setup and Core Components
1. Initialize Nuxt.js project with TypeScript
2. Configure Tailwind CSS and basic theming
3. Create core layout components
4. Implement API integration layer

### Phase 2: Main Features
1. Implement post listing and detail pages
2. Add search and filtering functionality
3. Create authentication flow
4. Implement comment system

### Phase 3: Optimization and Polish
1. Add performance optimizations
2. Implement SEO enhancements
3. Add comprehensive testing
4. Optimize for mobile devices

### Phase 4: Migration and Cleanup
1. Deploy new frontend
2. Configure Django as API-only
3. Remove old HTML templates
4. Clean up static CSS files

This design provides a comprehensive foundation for building a modern, performant, and maintainable blog application using Vue.js and Nuxt.js while preserving all existing functionality.
## Dj
ango Backend Optimization

### Enhanced Django Settings

```python
# settings.py - Optimized for API-only backend
import os
from datetime import timedelta

# Remove template and static file configurations
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    
    # Local apps
    'posts',
    'users',
    'comments',
    'categories',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.CursorPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Nuxt.js dev server
    "https://yourdomain.com",  # Production frontend
]

# Database optimization
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'MAX_CONNS': 20,
            'CONN_MAX_AGE': 600,
        }
    }
}

# Redis Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Media files optimization
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Image optimization settings
THUMBNAIL_SIZES = {
    'small': (300, 200),
    'medium': (600, 400),
    'large': (1200, 800),
}
```

### Optimized Models

```python
# models.py - Enhanced with performance optimizations
from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, db_index=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.name

class Post(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True, db_index=True)
    content = models.TextField()
    excerpt = models.TextField(max_length=300)
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='posts')
    tags = models.ManyToManyField('Tag', blank=True, related_name='posts')
    
    # SEO fields
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    
    # Status and timestamps
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ], default='draft', db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    
    # Full-text search
    search_vector = SearchVectorField(null=True)
    
    # Soft delete
    is_deleted = models.BooleanField(default=False, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['author', 'status']),
            GinIndex(fields=['search_vector']),
        ]
        ordering = ['-published_at']
    
    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['post', 'is_approved', 'is_deleted']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['created_at']
```

### Advanced API Serializers

```python
# serializers.py - Optimized with nested data
from rest_framework import serializers
from .models import Post, Category, Comment, User

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class CategorySerializer(serializers.ModelSerializer):
    posts_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'posts_count']
    
    def get_posts_count(self, obj):
        return obj.posts.filter(status='published', is_deleted=False).count()

class PostListSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()
    reading_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'excerpt', 'image', 
            'author', 'category', 'published_at', 
            'comments_count', 'reading_time'
        ]
    
    def get_comments_count(self, obj):
        return obj.comments.filter(is_approved=True, is_deleted=False).count()
    
    def get_reading_time(self, obj):
        # Calculate reading time based on content length
        words = len(obj.content.split())
        return max(1, words // 200)  # Assuming 200 words per minute

class PostDetailSerializer(PostListSerializer):
    tags = serializers.StringRelatedField(many=True)
    
    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ['content', 'tags', 'meta_title', 'meta_description']

class CommentSerializer(serializers.ModelSerializer):
    author = AuthorSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'created_at', 'replies']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(
                obj.replies.filter(is_approved=True, is_deleted=False), 
                many=True
            ).data
        return []
```

### High-Performance ViewSets

```python
# views.py - Optimized with caching and filtering
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.postgres.search import SearchVector
from django.core.cache import cache
from .models import Post, Category, Comment
from .serializers import PostListSerializer, PostDetailSerializer, CategorySerializer

class PostViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Post.objects.select_related('author', 'category').prefetch_related('tags')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'author', 'status']
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['published_at', 'created_at']
    ordering = ['-published_at']
    
    def get_queryset(self):
        return self.queryset.filter(status='published', is_deleted=False)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostListSerializer
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response({'results': []})
        
        # Use cached results if available
        cache_key = f'search:{query}'
        cached_results = cache.get(cache_key)
        if cached_results:
            return Response(cached_results)
        
        # Perform full-text search
        posts = self.get_queryset().annotate(
            search=SearchVector('title', 'content', 'excerpt')
        ).filter(search=query)[:20]
        
        serializer = self.get_serializer(posts, many=True)
        results = {'results': serializer.data}
        
        # Cache results for 5 minutes
        cache.set(cache_key, results, 300)
        return Response(results)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        # Get featured posts (cached)
        cache_key = 'featured_posts'
        featured = cache.get(cache_key)
        if not featured:
            featured = self.get_queryset()[:6]
            cache.set(cache_key, featured, 3600)  # Cache for 1 hour
        
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    @action(detail=True, methods=['get'])
    def posts(self, request, slug=None):
        category = self.get_object()
        posts = Post.objects.filter(
            category=category, 
            status='published', 
            is_deleted=False
        ).select_related('author', 'category')
        
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = PostListSerializer(posts, many=True)
        return Response(serializer.data)
```
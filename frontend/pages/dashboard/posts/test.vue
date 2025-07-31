<template>
  <div class="dashboard-posts-test">
    <h1>Dashboard Posts Management Test</h1>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Loading...</p>
    </div>
    
    <!-- Error State -->
    <div v-if="error" class="error">
      <p>Error: {{ error }}</p>
      <button @click="clearError">Clear Error</button>
    </div>
    
    <!-- Stats -->
    <div v-if="postStats" class="stats">
      <h2>Post Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Posts</h3>
          <p>{{ postStats.total_posts }}</p>
        </div>
        <div class="stat-card">
          <h3>Published</h3>
          <p>{{ postStats.published_posts }}</p>
        </div>
        <div class="stat-card">
          <h3>Drafts</h3>
          <p>{{ postStats.draft_posts }}</p>
        </div>
        <div class="stat-card">
          <h3>Featured</h3>
          <p>{{ postStats.featured_posts }}</p>
        </div>
      </div>
    </div>
    
    <!-- Controls -->
    <div class="controls">
      <button @click="loadPosts">Load Posts</button>
      <button @click="loadStats">Load Stats</button>
      <button @click="loadCategories">Load Categories</button>
      <button @click="testBulkActions" :disabled="!hasSelectedPosts">Test Bulk Actions</button>
      <button @click="testCreatePost">Test Create Post</button>
    </div>
    
    <!-- Filters -->
    <div class="filters">
      <input 
        v-model="searchQuery" 
        placeholder="Search posts..." 
        @input="onSearch"
      />
      <select v-model="statusFilter" @change="onFilterChange">
        <option value="">All Status</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>
    </div>
    
    <!-- Posts List -->
    <div v-if="posts.length > 0" class="posts-list">
      <h2>Posts ({{ totalCount }})</h2>
      
      <!-- Bulk Actions -->
      <div v-if="hasSelectedPosts" class="bulk-actions">
        <p>{{ selectedPosts.length }} posts selected</p>
        <button @click="bulkPublish(selectedPosts)">Publish Selected</button>
        <button @click="bulkDraft(selectedPosts)">Draft Selected</button>
        <button @click="bulkFeature(selectedPosts)">Feature Selected</button>
        <button @click="clearSelection">Clear Selection</button>
      </div>
      
      <div class="posts-grid">
        <div 
          v-for="post in posts" 
          :key="post.id" 
          class="post-card"
          :class="{ selected: isPostSelected(post.id) }"
        >
          <div class="post-header">
            <input 
              type="checkbox" 
              :checked="isPostSelected(post.id)"
              @change="togglePostSelection(post.id)"
            />
            <h3>{{ post.title || post.titulo }}</h3>
            <span class="status" :class="post.status">{{ post.status }}</span>
          </div>
          
          <div class="post-meta">
            <p>Author: {{ post.author?.username || post.autor?.username }}</p>
            <p>Category: {{ post.category?.name || post.categoria?.nombre }}</p>
            <p>Featured: {{ post.featured ? 'Yes' : 'No' }}</p>
            <p>Comments: {{ post.comments_count || 0 }}</p>
          </div>
          
          <div class="post-actions">
            <button @click="editPost(post)">Edit</button>
            <button @click="duplicatePost(post.id)">Duplicate</button>
            <button @click="toggleFeatured(post.id)">
              {{ post.featured ? 'Unfeature' : 'Feature' }}
            </button>
            <button @click="deletePost(post.id)" class="danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Categories -->
    <div v-if="categories.length > 0" class="categories">
      <h2>Categories</h2>
      <ul>
        <li v-for="category in categories" :key="category.id">
          {{ category.name || category.nombre }} ({{ category.posts_count || 0 }} posts)
        </li>
      </ul>
    </div>
    
    <!-- Operation History -->
    <div v-if="operationHistory.length > 0" class="operation-history">
      <h2>Recent Operations</h2>
      <ul>
        <li v-for="operation in operationHistory.slice(0, 10)" :key="operation.timestamp">
          <span :class="{ success: operation.success, error: !operation.success }">
            {{ operation.action }}
          </span>
          <span v-if="operation.postTitle">- {{ operation.postTitle }}</span>
          <span class="timestamp">{{ formatDate(operation.timestamp) }}</span>
        </li>
      </ul>
    </div>
    
    <!-- Validation Errors -->
    <div v-if="Object.keys(validationErrors).length > 0" class="validation-errors">
      <h3>Validation Errors</h3>
      <div v-for="(errors, field) in validationErrors" :key="field">
        <strong>{{ field }}:</strong>
        <ul>
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Test page for dashboard posts management
definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'dashboard'
})

const {
  // State
  posts,
  currentPost,
  categories,
  postStats,
  loading,
  error,
  totalCount,
  selectedPosts,
  operationHistory,
  validationErrors,
  
  // Computed
  hasSelectedPosts,
  publishedPosts,
  draftPosts,
  featuredPosts,
  
  // Methods
  fetchPosts,
  fetchPost,
  createPost,
  updatePost,
  deletePost,
  duplicatePost,
  toggleFeatured,
  fetchCategories,
  fetchPostStats,
  
  // Bulk operations
  bulkPublish,
  bulkDraft,
  bulkFeature,
  bulkDelete,
  
  // Selection
  togglePostSelection,
  selectAllPosts,
  clearSelection,
  isPostSelected,
  
  // Search and filter
  searchPosts,
  filterByStatus,
  resetFilters,
  
  // Validation
  clearValidationErrors
} = useDashboardPosts()

// Local reactive state for testing
const searchQuery = ref('')
const statusFilter = ref('')

// Methods
const loadPosts = async () => {
  try {
    await fetchPosts()
    console.log('Posts loaded:', posts.value.length)
  } catch (err) {
    console.error('Failed to load posts:', err)
  }
}

const loadStats = async () => {
  try {
    await fetchPostStats()
    console.log('Stats loaded:', postStats.value)
  } catch (err) {
    console.error('Failed to load stats:', err)
  }
}

const loadCategories = async () => {
  try {
    await fetchCategories()
    console.log('Categories loaded:', categories.value.length)
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const testBulkActions = async () => {
  if (selectedPosts.value.length === 0) {
    alert('Please select some posts first')
    return
  }
  
  try {
    await bulkFeature(selectedPosts.value)
    console.log('Bulk feature completed')
  } catch (err) {
    console.error('Bulk action failed:', err)
  }
}

const testCreatePost = async () => {
  try {
    const newPost = {
      title: `Test Post ${Date.now()}`,
      content: 'This is a test post created from the dashboard test page.',
      status: 'draft',
      featured: false
    }
    
    const created = await createPost(newPost)
    console.log('Post created:', created)
  } catch (err) {
    console.error('Failed to create post:', err)
  }
}

const editPost = (post: any) => {
  console.log('Edit post:', post)
  // In a real app, this would navigate to edit page or open modal
}

const onSearch = debounce(async () => {
  if (searchQuery.value.trim()) {
    await searchPosts(searchQuery.value)
  } else {
    await fetchPosts()
  }
}, 300)

const onFilterChange = async () => {
  if (statusFilter.value) {
    await filterByStatus(statusFilter.value as any)
  } else {
    await fetchPosts()
  }
}

const clearError = () => {
  error.value = null
  clearValidationErrors()
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// Debounce utility
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Load initial data
onMounted(async () => {
  await loadPosts()
  await loadStats()
  await loadCategories()
})
</script>

<style scoped>
.dashboard-posts-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading, .error {
  padding: 20px;
  margin: 20px 0;
  border-radius: 8px;
}

.loading {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
}

.error {
  background: #fef2f2;
  border: 1px solid #ef4444;
  color: #dc2626;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 20px 0;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #6b7280;
  font-size: 14px;
  text-transform: uppercase;
}

.stat-card p {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
}

.controls, .filters {
  display: flex;
  gap: 10px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.controls button, .filters input, .filters select {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
}

.controls button:hover {
  background: #f3f4f6;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-actions {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.post-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.post-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.post-card.selected {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.post-header h3 {
  margin: 0;
  flex: 1;
  font-size: 16px;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: bold;
}

.status.published {
  background: #dcfce7;
  color: #166534;
}

.status.draft {
  background: #fef3c7;
  color: #92400e;
}

.status.archived {
  background: #f3f4f6;
  color: #6b7280;
}

.post-meta p {
  margin: 5px 0;
  font-size: 14px;
  color: #6b7280;
}

.post-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.post-actions button {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 12px;
  cursor: pointer;
}

.post-actions button:hover {
  background: #f3f4f6;
}

.post-actions button.danger {
  color: #dc2626;
  border-color: #fca5a5;
}

.post-actions button.danger:hover {
  background: #fef2f2;
}

.categories ul, .operation-history ul {
  list-style: none;
  padding: 0;
}

.categories li, .operation-history li {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.operation-history .success {
  color: #059669;
}

.operation-history .error {
  color: #dc2626;
}

.operation-history .timestamp {
  color: #6b7280;
  font-size: 12px;
  margin-left: 10px;
}

.validation-errors {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 16px;
  margin: 20px 0;
}

.validation-errors h3 {
  color: #dc2626;
  margin-top: 0;
}

.validation-errors ul {
  margin: 5px 0;
  padding-left: 20px;
}

.validation-errors li {
  color: #dc2626;
}
</style>
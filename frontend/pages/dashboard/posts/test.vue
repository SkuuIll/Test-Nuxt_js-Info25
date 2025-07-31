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
        <div class="stat-card">
          <h3>This Month</h3>
          <p>{{ postStats.posts_this_month }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Views</h3>
          <p>{{ postStats.total_views?.toLocaleString() || 0 }}</p>
        </div>
      </div>
    </div>
    
    <!-- Controls -->
    <div class="controls">
      <button @click="loadPosts">Load Posts</button>
      <button @click="loadStats">Load Stats</button>
      <button @click="loadCategories">Load Categories</button>
      <button @click="testCreatePost">Test Create Post</button>
      <button @click="testBulkActions" :disabled="!hasSelectedPosts">Test Bulk Actions</button>
      <button @click="testExport">Test Export</button>
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
      <select v-model="categoryFilter" @change="onFilterChange">
        <option value="">All Categories</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">
          {{ category.name }}
        </option>
      </select>
      <select v-model="sortOrder" @change="onSortChange">
        <option value="">Default Order</option>
        <option value="-created_at">Newest First</option>
        <option value="created_at">Oldest First</option>
        <option value="-updated_at">Recently Updated</option>
        <option value="title">Title A-Z</option>
        <option value="-title">Title Z-A</option>
      </select>
      <label>
        <input type="checkbox" v-model="featuredOnly" @change="onFilterChange" />
        Featured Only
      </label>
    </div>
    
    <!-- Posts List -->
    <div v-if="posts.length > 0" class="posts-list">
      <h2>Posts ({{ totalCount }})</h2>
      
      <!-- Bulk Actions -->
      <div v-if="hasSelectedPosts" class="bulk-actions">
        <p>{{ selectedPosts.length }} posts selected</p>
        <button @click="bulkPublish(selectedPosts)">Publish Selected</button>
        <button @click="bulkDraft(selectedPosts)">Draft Selected</button>
        <button @click="bulkArchive(selectedPosts)">Archive Selected</button>
        <button @click="bulkFeature(selectedPosts)">Feature Selected</button>
        <button @click="bulkUnfeature(selectedPosts)">Unfeature Selected</button>
        <button @click="bulkDeleteWithConfirm">Delete Selected</button>
        <button @click="clearSelection">Clear Selection</button>
      </div>
      
      <div class="posts-grid">
        <div 
          v-for="post in posts" 
          :key="post.id" 
          class="post-card"
          :class="{ 
            selected: isPostSelected(post.id),
            [`status-${post.status}`]: true,
            featured: post.featured
          }"
        >
          <div class="post-header">
            <input 
              type="checkbox" 
              :checked="isPostSelected(post.id)"
              @change="togglePostSelection(post.id)"
            />
            <div class="post-title">
              <h3>{{ post.title }}</h3>
              <div class="post-meta">
                <span class="status" :class="post.status">{{ post.status }}</span>
                <span v-if="post.featured" class="featured-badge">⭐ Featured</span>
                <span class="category">{{ post.categoria?.name || 'No Category' }}</span>
              </div>
            </div>
          </div>
          
          <div class="post-content">
            <p class="excerpt">{{ getExcerpt(post.content) }}</p>
          </div>
          
          <div class="post-stats">
            <div class="stat">
              <span class="label">Views:</span>
              <span class="value">{{ post.views_count || 0 }}</span>
            </div>
            <div class="stat">
              <span class="label">Comments:</span>
              <span class="value">{{ post.comments_count || 0 }}</span>
            </div>
            <div class="stat">
              <span class="label">Reading Time:</span>
              <span class="value">{{ post.reading_time || 0 }} min</span>
            </div>
            <div class="stat">
              <span class="label">Words:</span>
              <span class="value">{{ post.word_count || 0 }}</span>
            </div>
          </div>
          
          <div class="post-meta-info">
            <p>Author: {{ post.author?.username || 'Unknown' }}</p>
            <p>Created: {{ formatDate(post.created_at) }}</p>
            <p>Updated: {{ formatDate(post.updated_at) }}</p>
            <p v-if="post.scheduled_publish_date">Scheduled: {{ formatDate(post.scheduled_publish_date) }}</p>
          </div>
          
          <div class="post-actions">
            <button @click="editPost(post)">Edit</button>
            <button @click="duplicatePost(post.id)">Duplicate</button>
            <button @click="toggleFeatured(post.id)" :class="{ active: post.featured }">
              {{ post.featured ? 'Unfeature' : 'Feature' }}
            </button>
            <button @click="viewAnalytics(post.id)">Analytics</button>
            <button @click="viewSEOAnalysis(post.id)">SEO</button>
            <button @click="getContentSuggestions(post.id)">Suggestions</button>
            <div class="status-actions">
              <button 
                v-if="post.status !== 'published'"
                @click="changePostStatus(post.id, 'published')"
                class="publish"
              >
                Publish
              </button>
              <button 
                v-if="post.status !== 'draft'"
                @click="changePostStatus(post.id, 'draft')"
                class="draft"
              >
                Draft
              </button>
              <button 
                v-if="post.status !== 'archived'"
                @click="changePostStatus(post.id, 'archived')"
                class="archive"
              >
                Archive
              </button>
            </div>
            <button @click="deletePost(post.id)" class="danger">Delete</button>
          </div>
        </div>
      </div>
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
    
    <!-- Post Analytics Modal -->
    <div v-if="showAnalytics" class="modal-overlay" @click="closeAnalytics">
      <div class="modal-content" @click.stop>
        <h3>Post Analytics</h3>
        <div v-if="currentAnalytics" class="analytics-content">
          <div class="analytics-section">
            <h4>Performance Metrics</h4>
            <p>Views: {{ currentAnalytics.views }}</p>
            <p>Comments: {{ currentAnalytics.comments }}</p>
            <p>Shares: {{ currentAnalytics.shares }}</p>
            <p>Reading Time: {{ currentAnalytics.reading_time }} minutes</p>
            <p>Bounce Rate: {{ currentAnalytics.bounce_rate }}%</p>
            <p>Engagement Rate: {{ currentAnalytics.engagement_rate }}%</p>
          </div>
          <div class="analytics-section">
            <h4>Traffic Sources</h4>
            <div v-for="source in currentAnalytics.traffic_sources" :key="source.source">
              <p><strong>{{ source.source }}:</strong> {{ source.visits }} visits</p>
            </div>
          </div>
          <div class="analytics-section">
            <h4>Popular Sections</h4>
            <div v-for="section in currentAnalytics.popular_sections" :key="section.section">
              <p><strong>{{ section.section }}:</strong> {{ section.time_spent }}s avg time</p>
            </div>
          </div>
        </div>
        <button @click="closeAnalytics">Close</button>
      </div>
    </div>
    
    <!-- SEO Analysis Modal -->
    <div v-if="showSEO" class="modal-overlay" @click="closeSEO">
      <div class="modal-content" @click.stop>
        <h3>SEO Analysis</h3>
        <div v-if="currentSEO" class="seo-content">
          <div class="seo-score">
            <h4>SEO Score: {{ currentSEO.seo_score }}/100</h4>
          </div>
          <div class="seo-section">
            <h4>Title Analysis</h4>
            <p>Length: {{ currentSEO.title_analysis.length }} characters</p>
            <p>Optimal Length: {{ currentSEO.title_analysis.optimal_length ? 'Yes' : 'No' }}</p>
            <p>Keyword Presence: {{ currentSEO.title_analysis.keyword_presence ? 'Yes' : 'No' }}</p>
            <p>Readability Score: {{ currentSEO.title_analysis.readability_score }}/100</p>
          </div>
          <div class="seo-section">
            <h4>Meta Description Analysis</h4>
            <p>Length: {{ currentSEO.meta_description_analysis.length }} characters</p>
            <p>Optimal Length: {{ currentSEO.meta_description_analysis.optimal_length ? 'Yes' : 'No' }}</p>
            <p>Keyword Presence: {{ currentSEO.meta_description_analysis.keyword_presence ? 'Yes' : 'No' }}</p>
            <p>Call to Action: {{ currentSEO.meta_description_analysis.call_to_action ? 'Yes' : 'No' }}</p>
          </div>
          <div class="seo-section">
            <h4>Content Analysis</h4>
            <p>Word Count: {{ currentSEO.content_analysis.word_count }}</p>
            <p>Reading Time: {{ currentSEO.content_analysis.reading_time }} minutes</p>
            <p>Keyword Density: {{ currentSEO.content_analysis.keyword_density }}%</p>
            <p>Headings Structure: {{ currentSEO.content_analysis.headings_structure ? 'Good' : 'Needs Improvement' }}</p>
            <p>Internal Links: {{ currentSEO.content_analysis.internal_links }}</p>
            <p>External Links: {{ currentSEO.content_analysis.external_links }}</p>
            <p>Images with Alt: {{ currentSEO.content_analysis.images_with_alt }}</p>
            <p>Images without Alt: {{ currentSEO.content_analysis.images_without_alt }}</p>
          </div>
          <div v-if="currentSEO.recommendations.length > 0" class="seo-section">
            <h4>Recommendations</h4>
            <div v-for="rec in currentSEO.recommendations" :key="rec.message" class="recommendation" :class="rec.type">
              <p><strong>{{ rec.type.toUpperCase() }} ({{ rec.impact }} impact):</strong></p>
              <p>{{ rec.message }}</p>
            </div>
          </div>
        </div>
        <button @click="closeSEO">Close</button>
      </div>
    </div>
    
    <!-- Content Suggestions Modal -->
    <div v-if="showSuggestions" class="modal-overlay" @click="closeSuggestions">
      <div class="modal-content" @click.stop>
        <h3>Content Suggestions</h3>
        <div v-if="currentSuggestions" class="suggestions-content">
          <div class="suggestions-section">
            <h4>Improvement Suggestions</h4>
            <div v-for="suggestion in currentSuggestions.improvement_suggestions" :key="suggestion.suggestion" class="suggestion" :class="suggestion.priority">
              <p><strong>{{ suggestion.type.toUpperCase() }} ({{ suggestion.priority }} priority):</strong></p>
              <p>{{ suggestion.suggestion }}</p>
              <p class="impact">Estimated Impact: {{ suggestion.estimated_impact }}</p>
            </div>
          </div>
          <div class="suggestions-section">
            <h4>Related Topics</h4>
            <div v-for="topic in currentSuggestions.related_topics" :key="topic.topic">
              <p><strong>{{ topic.topic }}</strong> ({{ topic.relevance }}% relevance)</p>
            </div>
          </div>
          <div class="suggestions-section">
            <h4>Trending Keywords</h4>
            <div v-for="keyword in currentSuggestions.trending_keywords" :key="keyword.keyword">
              <p><strong>{{ keyword.keyword }}</strong> (trend score: {{ keyword.trend_score }})</p>
            </div>
          </div>
          <div v-if="currentSuggestions.content_gaps?.length > 0" class="suggestions-section">
            <h4>Content Gaps</h4>
            <div v-for="gap in currentSuggestions.content_gaps" :key="gap.gap">
              <p><strong>Gap:</strong> {{ gap.gap }}</p>
              <p><strong>Opportunity:</strong> {{ gap.opportunity }}</p>
            </div>
          </div>
        </div>
        <button @click="closeSuggestions">Close</button>
      </div>
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
  // Status management
  changePostStatus,
  toggleFeatured,
  schedulePost,
  // Bulk operations
  bulkPublish,
  bulkDraft,
  bulkArchive,
  bulkDelete,
  bulkFeature,
  bulkUnfeature,
  bulkActionWithConfirmation,
  // Selection
  togglePostSelection,
  selectAllPosts,
  clearSelection,
  isPostSelected,
  // Search and filter
  searchPosts,
  filterByStatus,
  filterByCategory,
  sortPosts,
  resetFilters,
  // Additional data
  fetchCategories,
  fetchPostStats,
  // Analytics
  getPostAnalytics,
  getSEOAnalysis,
  getContentSuggestions,
  // Import/Export
  exportPosts,
  // Validation
  clearValidationErrors
} = useDashboardPosts()

// Local reactive state for testing
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const sortOrder = ref('')
const featuredOnly = ref(false)
const showAnalytics = ref(false)
const showSEO = ref(false)
const showSuggestions = ref(false)
const currentAnalytics = ref(null)
const currentSEO = ref(null)
const currentSuggestions = ref(null)

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

const testCreatePost = async () => {
  try {
    const newPost = {
      title: `Test Post ${Date.now()}`,
      content: `This is a test post created at ${new Date().toISOString()}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      status: 'draft' as const,
      category_id: categories.value[0]?.id || 1,
      meta_title: 'Test Post Meta Title',
      meta_description: 'This is a test post meta description for SEO purposes.',
      featured: false
    }
    const created = await createPost(newPost)
    console.log('Post created:', created)
  } catch (err) {
    console.error('Failed to create post:', err)
  }
}

const testBulkActions = async () => {
  if (selectedPosts.value.length === 0) {
    alert('Please select some posts first')
    return
  }
  
  try {
    await bulkDraft(selectedPosts.value)
    console.log('Bulk draft completed')
  } catch (err) {
    console.error('Bulk action failed:', err)
  }
}

const testExport = async () => {
  try {
    await exportPosts('csv')
    console.log('Export completed')
  } catch (err) {
    console.error('Export failed:', err)
  }
}

const bulkDeleteWithConfirm = async () => {
  try {
    await bulkActionWithConfirmation({
      action: 'delete',
      post_ids: selectedPosts.value
    })
  } catch (err) {
    console.error('Bulk delete failed:', err)
  }
}

const editPost = (post: any) => {
  console.log('Edit post:', post)
  // In a real app, this would navigate to edit page or open modal
}

const viewAnalytics = async (postId: number) => {
  try {
    currentAnalytics.value = await getPostAnalytics(postId)
    showAnalytics.value = true
  } catch (err) {
    console.error('Failed to load analytics:', err)
  }
}

const viewSEOAnalysis = async (postId: number) => {
  try {
    currentSEO.value = await getSEOAnalysis(postId)
    showSEO.value = true
  } catch (err) {
    console.error('Failed to load SEO analysis:', err)
  }
}

const getContentSuggestionsForPost = async (postId: number) => {
  try {
    currentSuggestions.value = await getContentSuggestions(postId)
    showSuggestions.value = true
  } catch (err) {
    console.error('Failed to load content suggestions:', err)
  }
}

const closeAnalytics = () => {
  showAnalytics.value = false
  currentAnalytics.value = null
}

const closeSEO = () => {
  showSEO.value = false
  currentSEO.value = null
}

const closeSuggestions = () => {
  showSuggestions.value = false
  currentSuggestions.value = null
}

const onSearch = debounce(async () => {
  if (searchQuery.value.trim()) {
    await searchPosts(searchQuery.value)
  } else {
    await fetchPosts()
  }
}, 300)

const onFilterChange = async () => {
  const filters: any = {}
  
  if (statusFilter.value) filters.status = statusFilter.value
  if (categoryFilter.value) filters.category = categoryFilter.value
  if (featuredOnly.value) filters.featured = true
  
  await fetchPosts(filters)
}

const onSortChange = async () => {
  if (sortOrder.value) {
    await sortPosts(sortOrder.value)
  } else {
    await fetchPosts()
  }
}

const clearError = () => {
  error.value = null
  clearValidationErrors()
}

const getExcerpt = (content: string, maxLength: number = 150) => {
  if (!content) return ''
  const text = content.replace(/<[^>]*>/g, '') // Remove HTML tags
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatDate = (date: Date | string) => {
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
  max-width: 1400px;
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  align-items: center;
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

.filters label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.bulk-actions {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
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

.post-card.featured {
  border-left: 4px solid #f59e0b;
}

.post-card.status-published {
  border-top: 3px solid #10b981;
}

.post-card.status-draft {
  border-top: 3px solid #6b7280;
}

.post-card.status-archived {
  border-top: 3px solid #ef4444;
}

.post-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 15px;
}

.post-title {
  flex: 1;
}

.post-title h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  line-height: 1.4;
}

.post-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: bold;
}

.status.published {
  background: #dcfce7;
  color: #166534;
}

.status.draft {
  background: #f3f4f6;
  color: #374151;
}

.status.archived {
  background: #fef2f2;
  color: #dc2626;
}

.featured-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
}

.category {
  background: #e0e7ff;
  color: #3730a3;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.post-content {
  margin: 15px 0;
}

.excerpt {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}

.post-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 15px 0;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat .label {
  color: #6b7280;
}

.stat .value {
  font-weight: bold;
  color: #374151;
}

.post-meta-info p {
  margin: 3px 0;
  font-size: 12px;
  color: #9ca3af;
}

.post-actions {
  display: flex;
  gap: 6px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.post-actions button {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 11px;
  cursor: pointer;
}

.post-actions button:hover {
  background: #f3f4f6;
}

.post-actions button.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.status-actions {
  display: flex;
  gap: 4px;
}

.post-actions button.publish {
  color: #059669;
  border-color: #a7f3d0;
}

.post-actions button.publish:hover {
  background: #ecfdf5;
}

.post-actions button.draft {
  color: #6b7280;
  border-color: #d1d5db;
}

.post-actions button.archive {
  color: #dc2626;
  border-color: #fca5a5;
}

.post-actions button.archive:hover {
  background: #fef2f2;
}

.post-actions button.danger {
  color: #dc2626;
  border-color: #fca5a5;
  background: #fef2f2;
}

.post-actions button.danger:hover {
  background: #fee2e2;
}

.operation-history ul {
  list-style: none;
  padding: 0;
}

.operation-history li {
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  width: 90%;
}

.analytics-content, .seo-content, .suggestions-content {
  margin: 20px 0;
}

.analytics-section, .seo-section, .suggestions-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
}

.analytics-section h4, .seo-section h4, .suggestions-section h4 {
  margin: 0 0 10px 0;
  color: #374151;
}

.analytics-section p, .seo-section p {
  margin: 5px 0;
  color: #6b7280;
}

.seo-score {
  text-align: center;
  background: #f0f9ff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.seo-score h4 {
  margin: 0;
  font-size: 24px;
  color: #1e40af;
}

.recommendation {
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
}

.recommendation.critical {
  background: #fef2f2;
  border-color: #ef4444;
}

.recommendation.warning {
  background: #fef3c7;
  border-color: #f59e0b;
}

.recommendation.suggestion {
  background: #f0f9ff;
  border-color: #3b82f6;
}

.suggestion {
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
}

.suggestion.high {
  background: #fef2f2;
  border-color: #ef4444;
}

.suggestion.medium {
  background: #fef3c7;
  border-color: #f59e0b;
}

.suggestion.low {
  background: #f0f9ff;
  border-color: #3b82f6;
}

.impact {
  font-style: italic;
  color: #6b7280;
  font-size: 12px;
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

/* Responsive design */
@media (max-width: 768px) {
  .posts-grid {
    grid-template-columns: 1fr;
  }
  
  .post-actions {
    flex-direction: column;
  }
  
  .post-actions button {
    width: 100%;
  }
  
  .modal-content {
    width: 95%;
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .post-stats {
    grid-template-columns: 1fr;
  }
}
</style>
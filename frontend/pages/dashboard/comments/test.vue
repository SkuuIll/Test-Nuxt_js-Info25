<template>
  <div class="dashboard-comments-test">
    <h1>Dashboard Comments Management Test</h1>
    
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
    <div v-if="commentStats" class="stats">
      <h2>Comment Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Comments</h3>
          <p>{{ commentStats.total_comments }}</p>
        </div>
        <div class="stat-card">
          <h3>Approved</h3>
          <p>{{ commentStats.approved_comments }}</p>
        </div>
        <div class="stat-card">
          <h3>Pending</h3>
          <p>{{ commentStats.pending_comments }}</p>
        </div>
        <div class="stat-card">
          <h3>Spam</h3>
          <p>{{ commentStats.spam_comments }}</p>
        </div>
      </div>
    </div>
    
    <!-- Controls -->
    <div class="controls">
      <button @click="loadComments">Load Comments</button>
      <button @click="loadStats">Load Stats</button>
      <button @click="testBulkActions" :disabled="!hasSelectedComments">Test Bulk Actions</button>
      <button @click="testAutoModeration">Test Auto Moderation</button>
      <button @click="testSpamDetection">Test Spam Detection</button>
    </div>
    
    <!-- Filters -->
    <div class="filters">
      <input 
        v-model="searchQuery" 
        placeholder="Search comments..." 
        @input="onSearch"
      />
      <select v-model="statusFilter" @change="onFilterChange">
        <option value="">All Status</option>
        <option value="approved">Approved</option>
        <option value="pending">Pending</option>
        <option value="rejected">Rejected</option>
        <option value="spam">Spam</option>
      </select>
      <select v-model="postFilter" @change="onFilterChange">
        <option value="">All Posts</option>
        <option value="1">Post 1</option>
        <option value="2">Post 2</option>
      </select>
    </div>
    
    <!-- Comments List -->
    <div v-if="comments.length > 0" class="comments-list">
      <h2>Comments ({{ totalCount }})</h2>
      
      <!-- Bulk Actions -->
      <div v-if="hasSelectedComments" class="bulk-actions">
        <p>{{ selectedComments.length }} comments selected</p>
        <button @click="bulkApprove(selectedComments)">Approve Selected</button>
        <button @click="bulkReject(selectedComments)">Reject Selected</button>
        <button @click="bulkMarkSpam(selectedComments)">Mark as Spam</button>
        <button @click="clearSelection">Clear Selection</button>
      </div>
      
      <div class="comments-grid">
        <div 
          v-for="comment in comments" 
          :key="comment.id" 
          class="comment-card"
          :class="{ 
            selected: isCommentSelected(comment.id),
            [`status-${comment.status}`]: true
          }"
        >
          <div class="comment-header">
            <input 
              type="checkbox" 
              :checked="isCommentSelected(comment.id)"
              @change="toggleCommentSelection(comment.id)"
            />
            <div class="comment-author">
              <strong>{{ comment.author?.username || comment.author_name }}</strong>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            </div>
            <span class="status" :class="comment.status">{{ comment.status }}</span>
          </div>
          
          <div class="comment-content">
            <p>{{ comment.content }}</p>
          </div>
          
          <div class="comment-meta">
            <p>Post: {{ comment.post?.title || `Post #${comment.post_id}` }}</p>
            <p v-if="comment.parent_id">Reply to: Comment #{{ comment.parent_id }}</p>
            <p>IP: {{ comment.ip_address || 'N/A' }}</p>
            <p v-if="comment.spam_score">Spam Score: {{ comment.spam_score }}%</p>
          </div>
          
          <div class="comment-actions">
            <button 
              v-if="comment.status === 'pending'"
              @click="approveComment(comment.id)"
              class="approve"
            >
              Approve
            </button>
            <button 
              v-if="comment.status !== 'rejected'"
              @click="rejectComment(comment.id)"
              class="reject"
            >
              Reject
            </button>
            <button 
              v-if="comment.status !== 'spam'"
              @click="markAsSpam(comment.id)"
              class="spam"
            >
              Mark Spam
            </button>
            <button @click="viewCommentAnalytics(comment.id)">Analytics</button>
            <button @click="viewCommentThread(comment.id)">Thread</button>
            <button @click="checkSpam(comment.id)">Check Spam</button>
            <button @click="deleteComment(comment.id)" class="danger">Delete</button>
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
          <span v-if="operation.commentId">- Comment #{{ operation.commentId }}</span>
          <span class="timestamp">{{ formatDate(operation.timestamp) }}</span>
        </li>
      </ul>
    </div>
    
    <!-- Comment Analytics Modal -->
    <div v-if="showAnalytics" class="modal-overlay" @click="closeAnalytics">
      <div class="modal-content" @click.stop>
        <h3>Comment Analytics</h3>
        <div v-if="currentCommentAnalytics" class="analytics-content">
          <div class="analytics-section">
            <h4>Engagement Metrics</h4>
            <p>Replies: {{ currentCommentAnalytics.engagement_metrics.replies_count }}</p>
            <p>Likes: {{ currentCommentAnalytics.engagement_metrics.likes_count }}</p>
            <p>Reports: {{ currentCommentAnalytics.engagement_metrics.reports_count }}</p>
            <p>Views: {{ currentCommentAnalytics.engagement_metrics.views_count }}</p>
            <p>Engagement Rate: {{ currentCommentAnalytics.engagement_metrics.engagement_rate }}%</p>
          </div>
          <div class="analytics-section">
            <h4>Sentiment Analysis</h4>
            <p>Sentiment: {{ currentCommentAnalytics.sentiment_analysis.sentiment_label }}</p>
            <p>Score: {{ currentCommentAnalytics.sentiment_analysis.sentiment_score }}</p>
            <p>Confidence: {{ currentCommentAnalytics.sentiment_analysis.confidence }}%</p>
            <p>Keywords: {{ currentCommentAnalytics.sentiment_analysis.keywords.join(', ') }}</p>
          </div>
          <div class="analytics-section">
            <h4>Spam Indicators</h4>
            <p>Spam Score: {{ currentCommentAnalytics.spam_indicators.spam_score }}%</p>
            <p>Likely Spam: {{ currentCommentAnalytics.spam_indicators.is_likely_spam ? 'Yes' : 'No' }}</p>
            <p>Indicators: {{ currentCommentAnalytics.spam_indicators.indicators.join(', ') }}</p>
          </div>
          <div v-if="currentCommentAnalytics.moderation_history.length > 0" class="analytics-section">
            <h4>Moderation History</h4>
            <div v-for="action in currentCommentAnalytics.moderation_history" :key="action.timestamp">
              <p><strong>{{ action.action }}</strong> by {{ action.moderator }}</p>
              <p>{{ formatDate(action.timestamp) }} - {{ action.reason }}</p>
            </div>
          </div>
        </div>
        <button @click="closeAnalytics">Close</button>
      </div>
    </div>
    
    <!-- Comment Thread Modal -->
    <div v-if="showThread" class="modal-overlay" @click="closeThread">
      <div class="modal-content" @click.stop>
        <h3>Comment Thread</h3>
        <div v-if="currentCommentThread" class="thread-content">
          <div class="thread-stats">
            <p>Total comments: {{ currentCommentThread.thread_stats.total_comments }}</p>
            <p>Max depth: {{ currentCommentThread.thread_stats.max_depth }}</p>
            <p>Participants: {{ currentCommentThread.thread_stats.participants_count }}</p>
          </div>
          <div class="thread-list">
            <div 
              v-for="comment in currentCommentThread.thread" 
              :key="comment.id"
              class="thread-comment"
              :style="{ marginLeft: `${comment.level * 20}px` }"
            >
              <div class="thread-comment-header">
                <strong>{{ comment.author.username }}</strong>
                <span class="thread-comment-date">{{ formatDate(comment.created_at) }}</span>
                <span class="thread-comment-status" :class="comment.is_approved ? 'approved' : 'pending'">
                  {{ comment.is_approved ? 'Approved' : 'Pending' }}
                </span>
              </div>
              <p class="thread-comment-content">{{ comment.content }}</p>
              <p class="thread-comment-replies">{{ comment.replies_count }} replies</p>
            </div>
          </div>
        </div>
        <button @click="closeThread">Close</button>
      </div>
    </div>
    
    <!-- Spam Check Results Modal -->
    <div v-if="showSpamResults" class="modal-overlay" @click="closeSpamResults">
      <div class="modal-content" @click.stop>
        <h3>Spam Check Results</h3>
        <div v-if="currentSpamResults" class="spam-results-content">
          <div class="spam-summary">
            <p><strong>Is Spam:</strong> {{ currentSpamResults.is_spam ? 'Yes' : 'No' }}</p>
            <p><strong>Spam Score:</strong> {{ currentSpamResults.spam_score }}%</p>
            <p><strong>Confidence:</strong> {{ currentSpamResults.confidence }}%</p>
            <p><strong>Recommended Action:</strong> {{ currentSpamResults.recommended_action }}</p>
          </div>
          <div v-if="currentSpamResults.indicators.length > 0" class="spam-indicators">
            <h4>Spam Indicators</h4>
            <div v-for="indicator in currentSpamResults.indicators" :key="indicator.type">
              <p><strong>{{ indicator.type }}</strong> ({{ indicator.severity }})</p>
              <p>{{ indicator.description }}</p>
            </div>
          </div>
        </div>
        <button @click="closeSpamResults">Close</button>
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
// Test page for dashboard comments management
definePageMeta({
  middleware: ['auth', 'admin'],
  layout: 'dashboard'
})

const {
  // State
  comments,
  currentComment,
  commentStats,
  loading,
  error,
  totalCount,
  selectedComments,
  operationHistory,
  validationErrors,
  // Computed
  hasSelectedComments,
  approvedComments,
  pendingComments,
  spamComments,
  // Methods
  fetchComments,
  fetchComment,
  createComment,
  updateComment,
  deleteComment,
  fetchCommentStats,
  // Moderation
  approveComment,
  rejectComment,
  markAsSpam,
  bulkApprove,
  bulkReject,
  bulkMarkSpam,
  // Selection
  toggleCommentSelection,
  selectAllComments,
  clearSelection,
  isCommentSelected,
  // Search and filter
  searchComments,
  filterByStatus,
  filterByPost,
  resetFilters,
  // Analytics and moderation
  getCommentAnalytics,
  getCommentThread,
  checkCommentSpam,
  autoModerateComments,
  // Validation
  clearValidationErrors
} = useDashboardComments()

// Local reactive state for testing
const searchQuery = ref('')
const statusFilter = ref('')
const postFilter = ref('')
const showAnalytics = ref(false)
const showThread = ref(false)
const showSpamResults = ref(false)
const currentCommentAnalytics = ref(null)
const currentCommentThread = ref(null)
const currentSpamResults = ref(null)

// Methods
const loadComments = async () => {
  try {
    await fetchComments()
    console.log('Comments loaded:', comments.value.length)
  } catch (err) {
    console.error('Failed to load comments:', err)
  }
}

const loadStats = async () => {
  try {
    await fetchCommentStats()
    console.log('Stats loaded:', commentStats.value)
  } catch (err) {
    console.error('Failed to load stats:', err)
  }
}

const testBulkActions = async () => {
  if (selectedComments.value.length === 0) {
    alert('Please select some comments first')
    return
  }
  
  try {
    await bulkApprove(selectedComments.value)
    console.log('Bulk approve completed')
  } catch (err) {
    console.error('Bulk action failed:', err)
  }
}

const testAutoModeration = async () => {
  try {
    const criteria = {
      spam_threshold: 70,
      sentiment_threshold: -0.5,
      keyword_filters: ['spam', 'fake', 'scam'],
      apply_actions: true
    }
    const result = await autoModerateComments(criteria)
    console.log('Auto moderation completed:', result)
  } catch (err) {
    console.error('Auto moderation failed:', err)
  }
}

const testSpamDetection = async () => {
  if (comments.value.length === 0) {
    alert('No comments available for spam detection test')
    return
  }
  
  try {
    const firstComment = comments.value[0]
    await checkSpam(firstComment.id)
    console.log('Spam detection test completed')
  } catch (err) {
    console.error('Spam detection failed:', err)
  }
}

const viewCommentAnalytics = async (commentId: number) => {
  try {
    currentCommentAnalytics.value = await getCommentAnalytics(commentId)
    showAnalytics.value = true
  } catch (err) {
    console.error('Failed to load comment analytics:', err)
  }
}

const viewCommentThread = async (commentId: number) => {
  try {
    currentCommentThread.value = await getCommentThread(commentId)
    showThread.value = true
  } catch (err) {
    console.error('Failed to load comment thread:', err)
  }
}

const checkSpam = async (commentId: number) => {
  try {
    currentSpamResults.value = await checkCommentSpam(commentId)
    showSpamResults.value = true
  } catch (err) {
    console.error('Failed to check spam:', err)
  }
}

const closeAnalytics = () => {
  showAnalytics.value = false
  currentCommentAnalytics.value = null
}

const closeThread = () => {
  showThread.value = false
  currentCommentThread.value = null
}

const closeSpamResults = () => {
  showSpamResults.value = false
  currentSpamResults.value = null
}

const onSearch = debounce(async () => {
  if (searchQuery.value.trim()) {
    await searchComments(searchQuery.value)
  } else {
    await fetchComments()
  }
}, 300)

const onFilterChange = async () => {
  if (statusFilter.value) {
    await filterByStatus(statusFilter.value as any)
  } else if (postFilter.value) {
    await filterByPost(Number(postFilter.value))
  } else {
    await fetchComments()
  }
}

const clearError = () => {
  error.value = null
  clearValidationErrors()
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
  await loadComments()
  await loadStats()
})
</script>

<style scoped>
.dashboard-comments-test {
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

.comments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.comment-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.comment-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.comment-card.selected {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.comment-card.status-approved {
  border-left: 4px solid #10b981;
}

.comment-card.status-pending {
  border-left: 4px solid #f59e0b;
}

.comment-card.status-rejected {
  border-left: 4px solid #ef4444;
}

.comment-card.status-spam {
  border-left: 4px solid #8b5cf6;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-author {
  flex: 1;
}

.comment-author strong {
  display: block;
  font-size: 14px;
}

.comment-date {
  font-size: 12px;
  color: #6b7280;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: bold;
}

.status.approved {
  background: #dcfce7;
  color: #166534;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.rejected {
  background: #fef2f2;
  color: #dc2626;
}

.status.spam {
  background: #f3e8ff;
  color: #7c3aed;
}

.comment-content {
  margin: 10px 0;
  padding: 10px;
  background: #f9fafb;
  border-radius: 6px;
}

.comment-content p {
  margin: 0;
  color: #374151;
  line-height: 1.5;
}

.comment-meta p {
  margin: 5px 0;
  font-size: 12px;
  color: #6b7280;
}

.comment-actions {
  display: flex;
  gap: 6px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.comment-actions button {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 11px;
  cursor: pointer;
}

.comment-actions button:hover {
  background: #f3f4f6;
}

.comment-actions button.approve {
  color: #059669;
  border-color: #a7f3d0;
}

.comment-actions button.approve:hover {
  background: #ecfdf5;
}

.comment-actions button.reject {
  color: #dc2626;
  border-color: #fca5a5;
}

.comment-actions button.reject:hover {
  background: #fef2f2;
}

.comment-actions button.spam {
  color: #7c3aed;
  border-color: #c4b5fd;
}

.comment-actions button.spam:hover {
  background: #f5f3ff;
}

.comment-actions button.danger {
  color: #dc2626;
  border-color: #fca5a5;
  background: #fef2f2;
}

.comment-actions button.danger:hover {
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
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  width: 90%;
}

.analytics-content, .thread-content, .spam-results-content {
  margin: 20px 0;
}

.analytics-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
}

.analytics-section h4 {
  margin: 0 0 10px 0;
  color: #374151;
}

.analytics-section p {
  margin: 5px 0;
  color: #6b7280;
}

.thread-stats {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.thread-list {
  max-height: 400px;
  overflow-y: auto;
}

.thread-comment {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 10px;
}

.thread-comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.thread-comment-date {
  color: #6b7280;
  font-size: 12px;
}

.thread-comment-status {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  text-transform: uppercase;
}

.thread-comment-status.approved {
  background: #dcfce7;
  color: #166534;
}

.thread-comment-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.thread-comment-content {
  color: #4b5563;
  margin: 5px 0;
  font-size: 14px;
}

.thread-comment-replies {
  color: #9ca3af;
  font-size: 12px;
  margin: 0;
}

.spam-summary {
  background: #fef3c7;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.spam-summary p {
  margin: 5px 0;
}

.spam-indicators {
  background: #f9fafb;
  padding: 15px;
  border-radius: 6px;
}

.spam-indicators h4 {
  margin: 0 0 15px 0;
  color: #374151;
}

.spam-indicators > div {
  margin-bottom: 10px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #ef4444;
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
  .comments-grid {
    grid-template-columns: 1fr;
  }
  
  .comment-actions {
    flex-direction: column;
  }
  
  .comment-actions button {
    width: 100%;
  }
  
  .modal-content {
    width: 95%;
    padding: 16px;
  }
  
  .thread-comment {
    margin-left: 0 !important;
  }
}
</style>
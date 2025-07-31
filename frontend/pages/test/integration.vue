<template>
  <div class="integration-test-page">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Integration Testing Dashboard</h1>
      
      <!-- Test Controls -->
      <div class="test-controls mb-8">
        <div class="flex flex-wrap gap-4 mb-4">
          <button 
            @click="runAllTests"
            :disabled="isRunningTests"
            class="btn btn-primary"
          >
            {{ isRunningTests ? 'Running Tests...' : 'Run All Tests' }}
          </button>
          
          <button 
            @click="runAuthTests"
            :disabled="isRunningTests"
            class="btn btn-secondary"
          >
            Test Authentication
          </button>
          
          <button 
            @click="runApiTests"
            :disabled="isRunningTests"
            class="btn btn-secondary"
          >
            Test API Endpoints
          </button>
          
          <button 
            @click="runDashboardTests"
            :disabled="isRunningTests"
            class="btn btn-secondary"
          >
            Test Dashboard
          </button>
          
          <button 
            @click="clearResults"
            class="btn btn-outline"
          >
            Clear Results
          </button>
        </div>
        
        <!-- Progress Bar -->
        <div v-if="isRunningTests" class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: `${testProgress}%` }"
            />
          </div>
          <p class="text-sm text-gray-600 mt-2">
            {{ currentTest || 'Preparing tests...' }}
          </p>
        </div>
      </div>
      
      <!-- Test Statistics -->
      <div v-if="testStats.total > 0" class="test-stats mb-8">
        <h2 class="text-xl font-semibold mb-4">Test Results Summary</h2>
        <div class="stats-grid">
          <div class="stat-card success">
            <div class="stat-number">{{ testStats.passed }}</div>
            <div class="stat-label">Passed</div>
          </div>
          <div class="stat-card error">
            <div class="stat-number">{{ testStats.failed }}</div>
            <div class="stat-label">Failed</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-number">{{ testStats.warnings }}</div>
            <div class="stat-label">Warnings</div>
          </div>
          <div class="stat-card info">
            <div class="stat-number">{{ testStats.successRate.toFixed(1) }}%</div>
            <div class="stat-label">Success Rate</div>
          </div>
          <div class="stat-card info">
            <div class="stat-number">{{ testStats.avgResponseTime }}ms</div>
            <div class="stat-label">Avg Response Time</div>
          </div>
        </div>
      </div>
      
      <!-- System Health Check -->
      <div class="system-health mb-8">
        <h2 class="text-xl font-semibold mb-4">System Health</h2>
        <div class="health-grid">
          <div class="health-card" :class="apiHealth.status">
            <div class="health-icon">🌐</div>
            <div class="health-info">
              <div class="health-title">API Connection</div>
              <div class="health-status">{{ apiHealth.message }}</div>
              <div v-if="apiHealth.responseTime" class="health-detail">
                Response: {{ apiHealth.responseTime }}ms
              </div>
            </div>
          </div>
          
          <div class="health-card" :class="authHealth.status">
            <div class="health-icon">🔐</div>
            <div class="health-info">
              <div class="health-title">Authentication</div>
              <div class="health-status">{{ authHealth.message }}</div>
              <div v-if="authHealth.tokenExpiry" class="health-detail">
                Token expires: {{ formatDate(authHealth.tokenExpiry) }}
              </div>
            </div>
          </div>
          
          <div class="health-card" :class="dbHealth.status">
            <div class="health-icon">🗄️</div>
            <div class="health-info">
              <div class="health-title">Database</div>
              <div class="health-status">{{ dbHealth.message }}</div>
              <div v-if="dbHealth.queryTime" class="health-detail">
                Query time: {{ dbHealth.queryTime }}ms
              </div>
            </div>
          </div>
          
          <div class="health-card" :class="errorHealth.status">
            <div class="health-icon">🚨</div>
            <div class="health-info">
              <div class="health-title">Error Handling</div>
              <div class="health-status">{{ errorHealth.message }}</div>
              <div v-if="errorHealth.recentErrors" class="health-detail">
                Recent errors: {{ errorHealth.recentErrors }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="test-results">
        <h2 class="text-xl font-semibold mb-4">Detailed Test Results</h2>
        
        <!-- Filter Controls -->
        <div class="filter-controls mb-4">
          <select v-model="resultFilter" class="filter-select">
            <option value="all">All Results</option>
            <option value="success">Passed Only</option>
            <option value="error">Failed Only</option>
            <option value="warning">Warnings Only</option>
          </select>
          
          <select v-model="sortBy" class="filter-select">
            <option value="timestamp">Sort by Time</option>
            <option value="responseTime">Sort by Response Time</option>
            <option value="endpoint">Sort by Endpoint</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
        
        <!-- Results Table -->
        <div class="results-table">
          <div class="table-header">
            <div class="col-endpoint">Endpoint</div>
            <div class="col-method">Method</div>
            <div class="col-status">Status</div>
            <div class="col-time">Response Time</div>
            <div class="col-timestamp">Timestamp</div>
            <div class="col-actions">Actions</div>
          </div>
          
          <div 
            v-for="result in filteredResults" 
            :key="`${result.endpoint}-${result.timestamp}`"
            class="table-row"
            :class="result.status"
          >
            <div class="col-endpoint">
              <span class="endpoint-path">{{ result.endpoint }}</span>
              <span v-if="result.error" class="error-message">{{ result.error }}</span>
            </div>
            <div class="col-method">
              <span class="method-badge" :class="result.method.toLowerCase()">
                {{ result.method }}
              </span>
            </div>
            <div class="col-status">
              <span class="status-badge" :class="result.status">
                {{ result.status }}
                <span v-if="result.statusCode" class="status-code">
                  ({{ result.statusCode }})
                </span>
              </span>
            </div>
            <div class="col-time">
              {{ result.responseTime }}ms
            </div>
            <div class="col-timestamp">
              {{ formatTime(result.timestamp) }}
            </div>
            <div class="col-actions">
              <button 
                @click="retryTest(result)"
                class="action-btn retry"
                title="Retry Test"
              >
                🔄
              </button>
              <button 
                @click="viewDetails(result)"
                class="action-btn details"
                title="View Details"
              >
                👁️
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Test Details Modal -->
      <div v-if="selectedResult" class="modal-overlay" @click="closeDetails">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Test Details</h3>
            <button @click="closeDetails" class="modal-close">×</button>
          </div>
          
          <div class="modal-body">
            <div class="detail-section">
              <h4>Request</h4>
              <p><strong>Endpoint:</strong> {{ selectedResult.endpoint }}</p>
              <p><strong>Method:</strong> {{ selectedResult.method }}</p>
              <p><strong>Timestamp:</strong> {{ formatDate(selectedResult.timestamp) }}</p>
            </div>
            
            <div class="detail-section">
              <h4>Response</h4>
              <p><strong>Status:</strong> {{ selectedResult.status }}</p>
              <p v-if="selectedResult.statusCode">
                <strong>Status Code:</strong> {{ selectedResult.statusCode }}
              </p>
              <p><strong>Response Time:</strong> {{ selectedResult.responseTime }}ms</p>
              <p v-if="selectedResult.error">
                <strong>Error:</strong> {{ selectedResult.error }}
              </p>
            </div>
            
            <div v-if="selectedResult.data" class="detail-section">
              <h4>Response Data</h4>
              <pre class="response-data">{{ JSON.stringify(selectedResult.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Error Logs -->
      <div v-if="errorStats.total > 0" class="error-logs mt-8">
        <h2 class="text-xl font-semibold mb-4">Recent Errors</h2>
        <div class="error-list">
          <div 
            v-for="error in errorStats.recentErrors" 
            :key="error.timestamp"
            class="error-item"
          >
            <div class="error-header">
              <span class="error-type">{{ error.error?.name || 'Error' }}</span>
              <span class="error-time">{{ formatTime(error.timestamp) }}</span>
            </div>
            <div class="error-message">{{ error.error?.message || 'Unknown error' }}</div>
            <div v-if="error.context" class="error-context">
              Context: {{ error.context.component || 'Unknown' }} - {{ error.context.action || 'Unknown' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Integration testing page
definePageMeta({
  middleware: ['auth'],
  layout: 'default'
})

const {
  testResults,
  isRunningTests,
  currentTest,
  testProgress,
  runAllTests: runApiTests,
  testEndpoint,
  getTestStats,
  clearTestResults
} = useApiTesting()

const { getErrorStats } = useGlobalErrorHandler()
const { healthCheck } = useApi()
const { isAuthenticated, getTokens } = useAuth()

// Local state
const resultFilter = ref('all')
const sortBy = ref('timestamp')
const selectedResult = ref(null)
const apiHealth = ref({ status: 'unknown', message: 'Checking...', responseTime: null })
const authHealth = ref({ status: 'unknown', message: 'Checking...', tokenExpiry: null })
const dbHealth = ref({ status: 'unknown', message: 'Checking...', queryTime: null })
const errorHealth = ref({ status: 'unknown', message: 'Checking...', recentErrors: 0 })

// Computed
const testStats = computed(() => getTestStats())
const errorStats = computed(() => getErrorStats())

const filteredResults = computed(() => {
  let filtered = testResults.value

  // Apply status filter
  if (resultFilter.value !== 'all') {
    filtered = filtered.filter(r => r.status === resultFilter.value)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'responseTime':
        return b.responseTime - a.responseTime
      case 'endpoint':
        return a.endpoint.localeCompare(b.endpoint)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'timestamp':
      default:
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    }
  })

  return filtered
})

// Methods
const runAllTests = async () => {
  await runApiTests()
  await checkSystemHealth()
}

const runAuthTests = async () => {
  const authTests = [
    { endpoint: '/api/v1/auth/user/', method: 'GET' as const, requiresAuth: true },
    { endpoint: '/api/v1/auth/token/verify/', method: 'POST' as const, requiresAuth: true }
  ]

  for (const test of authTests) {
    await testEndpoint(test.endpoint, test.method, { requiresAuth: test.requiresAuth })
  }
}

const runDashboardTests = async () => {
  const dashboardTests = [
    { endpoint: '/api/v1/dashboard/stats/', method: 'GET' as const },
    { endpoint: '/api/v1/dashboard/posts/', method: 'GET' as const },
    { endpoint: '/api/v1/dashboard/users/', method: 'GET' as const }
  ]

  for (const test of dashboardTests) {
    await testEndpoint(test.endpoint, test.method, { requiresAuth: true })
  }
}

const checkSystemHealth = async () => {
  // Check API health
  try {
    const startTime = Date.now()
    const isHealthy = await healthCheck()
    const responseTime = Date.now() - startTime
    
    apiHealth.value = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? 'API is responding' : 'API is not responding',
      responseTime
    }
  } catch (error) {
    apiHealth.value = {
      status: 'error',
      message: 'Failed to check API health',
      responseTime: null
    }
  }

  // Check authentication health
  try {
    const tokens = getTokens()
    if (tokens?.access) {
      // Parse JWT to get expiry
      const payload = JSON.parse(atob(tokens.access.split('.')[1]))
      const expiry = new Date(payload.exp * 1000)
      const isExpired = expiry < new Date()
      
      authHealth.value = {
        status: isExpired ? 'warning' : 'healthy',
        message: isExpired ? 'Token expired' : 'Authentication valid',
        tokenExpiry: expiry
      }
    } else {
      authHealth.value = {
        status: 'error',
        message: 'No authentication token',
        tokenExpiry: null
      }
    }
  } catch (error) {
    authHealth.value = {
      status: 'error',
      message: 'Failed to check authentication',
      tokenExpiry: null
    }
  }

  // Check database health (via API)
  try {
    const startTime = Date.now()
    await testEndpoint('/api/v1/posts/', 'GET')
    const queryTime = Date.now() - startTime
    
    dbHealth.value = {
      status: 'healthy',
      message: 'Database queries working',
      queryTime
    }
  } catch (error) {
    dbHealth.value = {
      status: 'error',
      message: 'Database queries failing',
      queryTime: null
    }
  }

  // Check error handling health
  const errors = getErrorStats()
  errorHealth.value = {
    status: errors.unresolved > 5 ? 'warning' : 'healthy',
    message: errors.unresolved > 5 ? 'High error rate' : 'Error handling working',
    recentErrors: errors.unresolved
  }
}

const retryTest = async (result: any) => {
  await testEndpoint(result.endpoint, result.method)
}

const viewDetails = (result: any) => {
  selectedResult.value = result
}

const closeDetails = () => {
  selectedResult.value = null
}

const clearResults = () => {
  clearTestResults()
}

const formatDate = (date: Date | string) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

const formatTime = (date: Date | string) => {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(date))
}

// Initialize health check on mount
onMounted(() => {
  checkSystemHealth()
})
</script>

<style scoped>
.integration-test-page {
  min-height: 100vh;
  background: #f8fafc;
}

.btn {
  @apply px-4 py-2 rounded font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50;
}

.progress-container {
  @apply w-full;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-blue-600 transition-all duration-300;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-5 gap-4;
}

.stat-card {
  @apply bg-white p-4 rounded-lg shadow text-center;
}

.stat-card.success {
  @apply border-l-4 border-green-500;
}

.stat-card.error {
  @apply border-l-4 border-red-500;
}

.stat-card.warning {
  @apply border-l-4 border-yellow-500;
}

.stat-card.info {
  @apply border-l-4 border-blue-500;
}

.stat-number {
  @apply text-2xl font-bold;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.health-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.health-card {
  @apply bg-white p-4 rounded-lg shadow flex items-center space-x-3;
}

.health-card.healthy {
  @apply border-l-4 border-green-500;
}

.health-card.warning {
  @apply border-l-4 border-yellow-500;
}

.health-card.error {
  @apply border-l-4 border-red-500;
}

.health-card.unknown {
  @apply border-l-4 border-gray-500;
}

.health-icon {
  @apply text-2xl;
}

.health-title {
  @apply font-medium;
}

.health-status {
  @apply text-sm text-gray-600;
}

.health-detail {
  @apply text-xs text-gray-500;
}

.filter-controls {
  @apply flex gap-4;
}

.filter-select {
  @apply px-3 py-2 border border-gray-300 rounded;
}

.results-table {
  @apply bg-white rounded-lg shadow overflow-hidden;
}

.table-header {
  @apply grid grid-cols-6 gap-4 p-4 bg-gray-50 font-medium text-sm;
}

.table-row {
  @apply grid grid-cols-6 gap-4 p-4 border-t border-gray-200;
}

.table-row.success {
  @apply bg-green-50;
}

.table-row.error {
  @apply bg-red-50;
}

.table-row.warning {
  @apply bg-yellow-50;
}

.endpoint-path {
  @apply font-mono text-sm;
}

.error-message {
  @apply text-xs text-red-600 block;
}

.method-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.method-badge.get {
  @apply bg-green-100 text-green-800;
}

.method-badge.post {
  @apply bg-blue-100 text-blue-800;
}

.method-badge.put {
  @apply bg-yellow-100 text-yellow-800;
}

.method-badge.delete {
  @apply bg-red-100 text-red-800;
}

.status-badge {
  @apply px-2 py-1 rounded text-xs font-medium;
}

.status-badge.success {
  @apply bg-green-100 text-green-800;
}

.status-badge.error {
  @apply bg-red-100 text-red-800;
}

.status-badge.warning {
  @apply bg-yellow-100 text-yellow-800;
}

.status-code {
  @apply ml-1 opacity-75;
}

.action-btn {
  @apply p-1 hover:bg-gray-100 rounded;
}

.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto;
}

.modal-header {
  @apply flex justify-between items-center p-4 border-b;
}

.modal-close {
  @apply text-2xl hover:bg-gray-100 w-8 h-8 rounded;
}

.modal-body {
  @apply p-4 space-y-4;
}

.detail-section h4 {
  @apply font-medium mb-2;
}

.response-data {
  @apply bg-gray-100 p-3 rounded text-sm overflow-x-auto;
}

.error-list {
  @apply space-y-3;
}

.error-item {
  @apply bg-white p-4 rounded-lg shadow border-l-4 border-red-500;
}

.error-header {
  @apply flex justify-between items-center mb-2;
}

.error-type {
  @apply font-medium text-red-800;
}

.error-time {
  @apply text-sm text-gray-500;
}

.error-message {
  @apply text-sm text-gray-700 mb-1;
}

.error-context {
  @apply text-xs text-gray-500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    @apply grid-cols-3;
  }
  
  .col-method,
  .col-timestamp,
  .col-actions {
    @apply hidden;
  }
  
  .health-grid {
    @apply grid-cols-1;
  }
  
  .stats-grid {
    @apply grid-cols-2;
  }
}
</style>
<template>
  <div class="cors-test-page">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">CORS Configuration Test</h1>
      
      <!-- Test Controls -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Test Controls</h2>
        
        <div class="flex flex-wrap gap-4 mb-4">
          <button
            @click="runFullTestSuite"
            :disabled="isRunning"
            class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {{ isRunning ? 'Running Tests...' : 'Run Full Test Suite' }}
          </button>
          
          <button
            @click="testSingleEndpoint"
            :disabled="isRunning"
            class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Test Single Endpoint
          </button>
          
          <button
            @click="getCorsConfig"
            :disabled="isRunning"
            class="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Get CORS Config
          </button>
          
          <button
            @click="downloadReport"
            :disabled="testResults.length === 0"
            class="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Download Report
          </button>
        </div>
        
        <!-- Current Test Status -->
        <div v-if="isRunning" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
            <span class="text-blue-700">Running: {{ currentTest }}</span>
          </div>
        </div>
      </div>
      
      <!-- Overall Results -->
      <div v-if="overallResults.totalTests > 0" class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">Overall Results</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-gray-700">{{ overallResults.totalTests }}</div>
            <div class="text-sm text-gray-500">Total Tests</div>
          </div>
          
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ overallResults.passed }}</div>
            <div class="text-sm text-gray-500">Passed</div>
          </div>
          
          <div class="bg-red-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-600">{{ overallResults.failed }}</div>
            <div class="text-sm text-gray-500">Failed</div>
          </div>
          
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ overallResults.totalTime.toFixed(0) }}ms</div>
            <div class="text-sm text-gray-500">Total Time</div>
          </div>
        </div>
        
        <!-- Success Rate -->
        <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            class="bg-green-500 h-2 rounded-full transition-all duration-500"
            :style="{ width: `${(overallResults.passed / overallResults.totalTests) * 100}%` }"
          ></div>
        </div>
        
        <div class="text-center text-sm text-gray-600">
          Success Rate: {{ ((overallResults.passed / overallResults.totalTests) * 100).toFixed(1) }}%
        </div>
      </div>
      
      <!-- Test Results -->
      <div v-if="testResults.length > 0" class="space-y-6">
        <div
          v-for="suite in testResults"
          :key="suite.testName"
          class="bg-white rounded-lg shadow-md p-6"
        >
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold">{{ suite.testName }}</h3>
              <p class="text-gray-600 text-sm">{{ suite.description }}</p>
            </div>
            
            <div class="flex items-center space-x-4">
              <span class="text-green-600 font-medium">{{ suite.passed }} passed</span>
              <span class="text-red-600 font-medium">{{ suite.failed }} failed</span>
              <span class="text-gray-500 text-sm">{{ suite.totalTime.toFixed(0) }}ms</span>
            </div>
          </div>
          
          <!-- Individual Test Results -->
          <div class="space-y-2">
            <div
              v-for="(result, index) in suite.results"
              :key="index"
              class="border rounded-lg p-3"
              :class="{
                'border-green-200 bg-green-50': result.success,
                'border-red-200 bg-red-50': !result.success
              }"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div
                    class="w-3 h-3 rounded-full mr-3"
                    :class="{
                      'bg-green-500': result.success,
                      'bg-red-500': !result.success
                    }"
                  ></div>
                  
                  <span class="font-medium">
                    Status: {{ result.status }}
                  </span>
                  
                  <span class="ml-4 text-sm text-gray-500">
                    {{ result.timing.toFixed(2) }}ms
                  </span>
                </div>
                
                <button
                  @click="toggleResultDetails(suite.testName, index)"
                  class="text-blue-500 hover:text-blue-600 text-sm"
                >
                  {{ expandedResults[`${suite.testName}-${index}`] ? 'Hide' : 'Show' }} Details
                </button>
              </div>
              
              <!-- Error Message -->
              <div v-if="result.error" class="mt-2 text-red-600 text-sm">
                Error: {{ result.error }}
              </div>
              
              <!-- Detailed Results -->
              <div
                v-if="expandedResults[`${suite.testName}-${index}`]"
                class="mt-4 space-y-3"
              >
                <!-- CORS Headers -->
                <div v-if="Object.keys(getCorsHeaders(result.headers)).length > 0">
                  <h4 class="font-medium text-sm mb-2">CORS Headers:</h4>
                  <div class="bg-gray-100 rounded p-2 text-xs font-mono">
                    <div
                      v-for="(value, header) in getCorsHeaders(result.headers)"
                      :key="header"
                      class="mb-1"
                    >
                      <span class="text-blue-600">{{ header }}:</span>
                      <span class="ml-2">{{ value }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Response Data -->
                <div v-if="result.data">
                  <h4 class="font-medium text-sm mb-2">Response Data:</h4>
                  <div class="bg-gray-100 rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                    <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
                  </div>
                </div>
                
                <!-- All Headers -->
                <div>
                  <h4 class="font-medium text-sm mb-2">All Headers:</h4>
                  <div class="bg-gray-100 rounded p-2 text-xs font-mono max-h-32 overflow-y-auto">
                    <div
                      v-for="(value, header) in result.headers"
                      :key="header"
                      class="mb-1"
                    >
                      <span class="text-purple-600">{{ header }}:</span>
                      <span class="ml-2">{{ value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- CORS Configuration -->
      <div v-if="corsConfig" class="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 class="text-xl font-semibold mb-4">Server CORS Configuration</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Server Info -->
          <div>
            <h3 class="font-medium mb-2">Server Information</h3>
            <div class="bg-gray-50 rounded p-3 text-sm">
              <div v-for="(value, key) in corsConfig.serverInfo" :key="key" class="mb-1">
                <span class="font-medium">{{ formatKey(key) }}:</span>
                <span class="ml-2" :class="{
                  'text-green-600': value === true,
                  'text-red-600': value === false,
                  'text-gray-700': typeof value !== 'boolean'
                }">
                  {{ value }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- CORS Headers -->
          <div>
            <h3 class="font-medium mb-2">CORS Headers</h3>
            <div class="bg-gray-50 rounded p-3 text-sm">
              <div v-for="(value, header) in corsConfig.corsHeaders" :key="header" class="mb-1">
                <span class="font-medium text-blue-600">{{ header }}:</span>
                <span class="ml-2 text-gray-700">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Debug Info -->
        <div v-if="corsConfig.debugInfo" class="mt-6">
          <h3 class="font-medium mb-2">Debug Information</h3>
          <div class="bg-gray-50 rounded p-3 text-sm font-mono">
            <pre>{{ JSON.stringify(corsConfig.debugInfo, null, 2) }}</pre>
          </div>
        </div>
      </div>
      
      <!-- Recommendations -->
      <div v-if="recommendations.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
        <h2 class="text-xl font-semibold mb-4 text-yellow-800">Recommendations</h2>
        <ul class="space-y-2">
          <li
            v-for="(recommendation, index) in recommendations"
            :key="index"
            class="flex items-start"
          >
            <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <span class="text-yellow-700">{{ recommendation }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// CORS test page
definePageMeta({
  layout: 'default'
})

const {
  isRunning,
  currentTest,
  testResults,
  overallResults,
  runFullTestSuite,
  testEndpoint,
  getCorsConfiguration,
  generateTestReport
} = useCorsTest()

// Local state
const expandedResults = ref<Record<string, boolean>>({})
const corsConfig = ref<any>(null)
const recommendations = computed(() => {
  const report = generateTestReport()
  return report?.recommendations || []
})

// Methods
const testSingleEndpoint = async () => {
  await testEndpoint('/api/v1/cors-test/')
}

const getCorsConfig = async () => {
  corsConfig.value = await getCorsConfiguration()
}

const toggleResultDetails = (suiteName: string, index: number) => {
  const key = `${suiteName}-${index}`
  expandedResults.value[key] = !expandedResults.value[key]
}

const getCorsHeaders = (headers: Record<string, string>) => {
  return Object.keys(headers)
    .filter(key => key.toLowerCase().startsWith('access-control-'))
    .reduce((acc, key) => ({ ...acc, [key]: headers[key] }), {})
}

const formatKey = (key: string) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const downloadReport = () => {
  const report = generateTestReport()
  if (!report) return

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cors-test-report-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Auto-load CORS config on mount
onMounted(() => {
  getCorsConfig()
})
</script>

<style scoped>
.cors-test-page {
  min-height: 100vh;
  background-color: #f8fafc;
}

.container {
  max-width: 1200px;
}

/* Custom scrollbar for code blocks */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Animation for progress bar */
.transition-all {
  transition: all 0.5s ease-in-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .grid-cols-1.md\\:grid-cols-2 {
    grid-template-columns: 1fr;
  }
}
</style>
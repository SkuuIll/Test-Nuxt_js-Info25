#!/usr/bin/env node

/**
 * Test script for the dashboard statistics and data loading system
 * This script validates the dashboard stats and realtime composables
 */

console.log('🧪 Testing Dashboard Statistics and Data Loading System')
console.log('='.repeat(50))

const fs = require('fs')
const path = require('path')

// Test 1: Check useDashboardStats composable
console.log('\n1. Testing useDashboardStats Composable...')

try {
    const dashboardStatsContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardStats.ts'), 'utf8')

    const statsChecks = [
        {
            name: 'Enhanced type definitions',
            test: () => dashboardStatsContent.includes('DashboardAnalytics') && dashboardStatsContent.includes('DashboardOverview'),
            fix: 'Add enhanced type definitions for dashboard statistics'
        },
        {
            name: 'Dashboard authentication integration',
            test: () => dashboardStatsContent.includes('useDashboardAuth') && dashboardStatsContent.includes('requirePermission'),
            fix: 'Integrate with dashboard authentication system'
        },
        {
            name: 'Enhanced error handling',
            test: () => dashboardStatsContent.includes('handleApiError') && dashboardStatsContent.includes('dashboardLoading'),
            fix: 'Add comprehensive error handling'
        },
        {
            name: 'Analytics data fetching',
            test: () => dashboardStatsContent.includes('fetchAnalytics') && dashboardStatsContent.includes('/dashboard/analytics/'),
            fix: 'Add analytics data fetching functionality'
        },
        {
            name: 'System health monitoring',
            test: () => dashboardStatsContent.includes('fetchSystemHealth') && dashboardStatsContent.includes('SystemHealth'),
            fix: 'Add system health monitoring'
        },
        {
            name: 'Time series data support',
            test: () => dashboardStatsContent.includes('fetchTimeSeriesData') && dashboardStatsContent.includes('TimeSeriesData'),
            fix: 'Add time series data support'
        },
        {
            name: 'Auto-refresh functionality',
            test: () => dashboardStatsContent.includes('startAutoRefresh') && dashboardStatsContent.includes('autoRefreshEnabled'),
            fix: 'Add auto-refresh functionality'
        },
        {
            name: 'Data export capabilities',
            test: () => dashboardStatsContent.includes('exportData') && dashboardStatsContent.includes('csv'),
            fix: 'Add data export capabilities'
        },
        {
            name: 'Popular content fetching',
            test: () => dashboardStatsContent.includes('fetchPopularContent') && dashboardStatsContent.includes('PopularPost'),
            fix: 'Add popular content fetching'
        },
        {
            name: 'Recent activity tracking',
            test: () => dashboardStatsContent.includes('fetchRecentActivity') && dashboardStatsContent.includes('RecentActivity'),
            fix: 'Add recent activity tracking'
        },
        {
            name: 'Dashboard reports',
            test: () => dashboardStatsContent.includes('fetchReport') && dashboardStatsContent.includes('reportType'),
            fix: 'Add dashboard reports functionality'
        },
        {
            name: 'Data freshness tracking',
            test: () => dashboardStatsContent.includes('getDataFreshness') && dashboardStatsContent.includes('lastUpdated'),
            fix: 'Add data freshness tracking'
        },
        {
            name: 'Utility functions',
            test: () => dashboardStatsContent.includes('formatNumber') && dashboardStatsContent.includes('calculatePercentageChange'),
            fix: 'Add utility functions for data formatting'
        }
    ]

    let passedChecks = 0

    statsChecks.forEach((check, index) => {
        const passed = check.test()
        console.log(`${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) {
            console.log(`   Fix: ${check.fix}`)
        } else {
            passedChecks++
        }
    })

    console.log(`\n📊 useDashboardStats: Passed ${passedChecks}/${statsChecks.length} checks`)

} catch (error) {
    console.log('❌ Error reading useDashboardStats composable:', error.message)
}

// Test 2: Check useDashboardRealtime composable
console.log('\n2. Testing useDashboardRealtime Composable...')

try {
    const dashboardRealtimeContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardRealtime.ts'), 'utf8')

    const realtimeChecks = [
        {
            name: 'WebSocket connection management',
            test: () => dashboardRealtimeContent.includes('WebSocket') && dashboardRealtimeContent.includes('connect'),
            fix: 'Add WebSocket connection management'
        },
        {
            name: 'Real-time event handling',
            test: () => dashboardRealtimeContent.includes('RealtimeEvent') && dashboardRealtimeContent.includes('handleRealtimeMessage'),
            fix: 'Add real-time event handling'
        },
        {
            name: 'System alerts management',
            test: () => dashboardRealtimeContent.includes('SystemAlert') && dashboardRealtimeContent.includes('dismissAlert'),
            fix: 'Add system alerts management'
        },
        {
            name: 'Connection status tracking',
            test: () => dashboardRealtimeContent.includes('connectionStatus') && dashboardRealtimeContent.includes('isConnected'),
            fix: 'Add connection status tracking'
        },
        {
            name: 'Auto-reconnection logic',
            test: () => dashboardRealtimeContent.includes('scheduleReconnect') && dashboardRealtimeContent.includes('reconnectAttempts'),
            fix: 'Add auto-reconnection logic'
        },
        {
            name: 'Event subscription system',
            test: () => dashboardRealtimeContent.includes('subscribe') && dashboardRealtimeContent.includes('unsubscribe'),
            fix: 'Add event subscription system'
        },
        {
            name: 'Real-time statistics',
            test: () => dashboardRealtimeContent.includes('RealtimeStats') && dashboardRealtimeContent.includes('realtimeStats'),
            fix: 'Add real-time statistics'
        },
        {
            name: 'Event formatting utilities',
            test: () => dashboardRealtimeContent.includes('formatEvent') && dashboardRealtimeContent.includes('getEventIcon'),
            fix: 'Add event formatting utilities'
        }
    ]

    let passedChecks = 0

    realtimeChecks.forEach((check, index) => {
        const passed = check.test()
        console.log(`${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) {
            console.log(`   Fix: ${check.fix}`)
        } else {
            passedChecks++
        }
    })

    console.log(`\n📊 useDashboardRealtime: Passed ${passedChecks}/${realtimeChecks.length} checks`)

} catch (error) {
    console.log('❌ Error reading useDashboardRealtime composable:', error.message)
}

// Test 3: Check data fetching functions
console.log('\n3. Testing Data Fetching Functions...')

try {
    const dashboardStatsContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardStats.ts'), 'utf8')

    const dataFetchingFunctions = [
        'fetchAnalytics',
        'fetchSummary',
        'fetchSystemHealth',
        'fetchTimeSeriesData',
        'fetchPopularContent',
        'fetchRecentActivity',
        'fetchReport',
        'loadDashboardData'
    ]

    let foundFunctions = 0

    dataFetchingFunctions.forEach(func => {
        if (dashboardStatsContent.includes(func)) {
            console.log(`✅ Found data fetching function: ${func}`)
            foundFunctions++
        } else {
            console.log(`❌ Missing data fetching function: ${func}`)
        }
    })

    console.log(`\n📊 Data Fetching Functions: Found ${foundFunctions}/${dataFetchingFunctions.length} functions`)

} catch (error) {
    console.log('❌ Error checking data fetching functions:', error.message)
}

// Test 4: Check computed properties
console.log('\n4. Testing Computed Properties...')

try {
    const dashboardStatsContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardStats.ts'), 'utf8')

    const computedProperties = [
        'overview',
        'trends',
        'popularPosts',
        'recentActivity',
        'timeSeriesData',
        'topCategories',
        'topAuthors',
        'pendingModerationCount',
        'isSystemHealthy',
        'storageWarning',
        'memoryWarning'
    ]

    let foundProperties = 0

    computedProperties.forEach(prop => {
        if (dashboardStatsContent.includes(`${prop} = computed`)) {
            console.log(`✅ Found computed property: ${prop}`)
            foundProperties++
        } else {
            console.log(`❌ Missing computed property: ${prop}`)
        }
    })

    console.log(`\n📊 Computed Properties: Found ${foundProperties}/${computedProperties.length} properties`)

} catch (error) {
    console.log('❌ Error checking computed properties:', error.message)
}

// Test 5: Check auto-refresh functionality
console.log('\n5. Testing Auto-Refresh Functionality...')

try {
    const dashboardStatsContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardStats.ts'), 'utf8')

    const autoRefreshFeatures = [
        'startAutoRefresh',
        'stopAutoRefresh',
        'toggleAutoRefresh',
        'autoRefreshEnabled',
        'refreshInterval',
        'refreshSection'
    ]

    let foundFeatures = 0

    autoRefreshFeatures.forEach(feature => {
        if (dashboardStatsContent.includes(feature)) {
            console.log(`✅ Found auto-refresh feature: ${feature}`)
            foundFeatures++
        } else {
            console.log(`❌ Missing auto-refresh feature: ${feature}`)
        }
    })

    console.log(`\n📊 Auto-Refresh Features: Found ${foundFeatures}/${autoRefreshFeatures.length} features`)

} catch (error) {
    console.log('❌ Error checking auto-refresh features:', error.message)
}

// Test 6: Check utility functions
console.log('\n6. Testing Utility Functions...')

try {
    const dashboardStatsContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardStats.ts'), 'utf8')

    const utilityFunctions = [
        'getDataFreshness',
        'formatNumber',
        'calculatePercentageChange',
        'getTrendDirection',
        'exportData'
    ]

    let foundFunctions = 0

    utilityFunctions.forEach(func => {
        if (dashboardStatsContent.includes(func)) {
            console.log(`✅ Found utility function: ${func}`)
            foundFunctions++
        } else {
            console.log(`❌ Missing utility function: ${func}`)
        }
    })

    console.log(`\n📊 Utility Functions: Found ${foundFunctions}/${utilityFunctions.length} functions`)

} catch (error) {
    console.log('❌ Error checking utility functions:', error.message)
}

// Test 7: Check API endpoints consistency
console.log('\n7. Testing API Endpoints Consistency...')

try {
    const dashboardStatsContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardStats.ts'), 'utf8')

    const expectedEndpoints = [
        '/dashboard/analytics/',
        '/dashboard/summary/',
        '/dashboard/system-health/',
        '/dashboard/time-series/',
        '/dashboard/popular/',
        '/dashboard/activity/',
        '/dashboard/reports/',
        '/dashboard/export/'
    ]

    let foundEndpoints = 0

    expectedEndpoints.forEach(endpoint => {
        if (dashboardStatsContent.includes(endpoint)) {
            console.log(`✅ Found API endpoint: ${endpoint}`)
            foundEndpoints++
        } else {
            console.log(`❌ Missing API endpoint: ${endpoint}`)
        }
    })

    console.log(`\n📊 API Endpoints: Found ${foundEndpoints}/${expectedEndpoints.length} endpoints`)

} catch (error) {
    console.log('❌ Error checking API endpoints:', error.message)
}

// Test 8: Check integration with dashboard auth
console.log('\n8. Testing Dashboard Auth Integration...')

try {
    const dashboardStatsContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardStats.ts'), 'utf8')
    const dashboardRealtimeContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardRealtime.ts'), 'utf8')

    const authIntegrationFeatures = [
        'useDashboardAuth',
        'dashboardApiCall',
        'requirePermission',
        'can_view_stats',
        'handleApiError',
        'dashboardLoading'
    ]

    let foundInStats = 0
    let foundInRealtime = 0

    authIntegrationFeatures.forEach(feature => {
        if (dashboardStatsContent.includes(feature)) {
            foundInStats++
        }
        if (dashboardRealtimeContent.includes(feature)) {
            foundInRealtime++
        }

        const inStats = dashboardStatsContent.includes(feature)
        const inRealtime = dashboardRealtimeContent.includes(feature)

        console.log(`${inStats && inRealtime ? '✅' : '⚠️'} Auth integration: ${feature} (Stats: ${inStats ? '✅' : '❌'}, Realtime: ${inRealtime ? '✅' : '❌'})`)
    })

    console.log(`\n📊 Auth Integration - Stats: ${foundInStats}/${authIntegrationFeatures.length}, Realtime: ${foundInRealtime}/${authIntegrationFeatures.length}`)

} catch (error) {
    console.log('❌ Error checking auth integration:', error.message)
}

console.log('\n🏁 Dashboard Statistics and Data Loading Test Complete')
console.log('='.repeat(50))
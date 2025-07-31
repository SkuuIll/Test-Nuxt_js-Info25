#!/usr/bin/env node

/**
 * Test script for the dashboard authentication system
 * This script validates the dashboard auth composables and middleware
 */

console.log('🧪 Testing Dashboard Authentication System')
console.log('='.repeat(50))

const fs = require('fs')
const path = require('path')

// Test 1: Check useDashboardAuth composable
console.log('\n1. Testing useDashboardAuth Composable...')

try {
    const dashboardAuthContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardAuth.ts'), 'utf8')

    const composableChecks = [
        {
            name: 'Dashboard-specific token management',
            test: () => dashboardAuthContent.includes('DASHBOARD_TOKEN_KEY') && dashboardAuthContent.includes('getDashboardTokens'),
            fix: 'Add dashboard-specific token management'
        },
        {
            name: 'Enhanced error handling integration',
            test: () => dashboardAuthContent.includes('handleAuthError') && dashboardAuthContent.includes('handleValidationError'),
            fix: 'Integrate with useErrorHandler composable'
        },
        {
            name: 'Dashboard permissions system',
            test: () => dashboardAuthContent.includes('DashboardPermissions') && dashboardAuthContent.includes('hasPermission'),
            fix: 'Add dashboard permissions system'
        },
        {
            name: 'Dashboard API call wrapper',
            test: () => dashboardAuthContent.includes('dashboardApiCall') && dashboardAuthContent.includes('Authorization'),
            fix: 'Add dashboard API call wrapper with token handling'
        },
        {
            name: 'Dashboard authentication initialization',
            test: () => dashboardAuthContent.includes('initializeDashboardAuth') && dashboardAuthContent.includes('initialized'),
            fix: 'Add dashboard authentication initialization'
        },
        {
            name: 'Dashboard token refresh mechanism',
            test: () => dashboardAuthContent.includes('refreshDashboardTokens') && dashboardAuthContent.includes('refresh'),
            fix: 'Add dashboard token refresh mechanism'
        },
        {
            name: 'Dashboard authentication guards',
            test: () => dashboardAuthContent.includes('requireDashboardAuth') && dashboardAuthContent.includes('requirePermission'),
            fix: 'Add dashboard authentication guard functions'
        },
        {
            name: 'Permission checking utilities',
            test: () => dashboardAuthContent.includes('hasAnyPermission') && dashboardAuthContent.includes('hasAllPermissions'),
            fix: 'Add comprehensive permission checking utilities'
        }
    ]

    let passedChecks = 0

    composableChecks.forEach((check, index) => {
        const passed = check.test()
        console.log(`${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) {
            console.log(`   Fix: ${check.fix}`)
        } else {
            passedChecks++
        }
    })

    console.log(`\n📊 useDashboardAuth: Passed ${passedChecks}/${composableChecks.length} checks`)

} catch (error) {
    console.log('❌ Error reading useDashboardAuth composable:', error.message)
}

// Test 2: Check useDashboardSession composable
console.log('\n2. Testing useDashboardSession Composable...')

try {
    const sessionContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardSession.ts'), 'utf8')

    const sessionChecks = [
        {
            name: 'Session monitoring system',
            test: () => sessionContent.includes('startSessionMonitoring') && sessionContent.includes('sessionInterval'),
            fix: 'Add session monitoring system'
        },
        {
            name: 'Session warning system',
            test: () => sessionContent.includes('sessionWarning') && sessionContent.includes('sessionExpiring'),
            fix: 'Add session warning system'
        },
        {
            name: 'Session extension functionality',
            test: () => sessionContent.includes('extendSession') && sessionContent.includes('refreshDashboardTokens'),
            fix: 'Add session extension functionality'
        },
        {
            name: 'Proactive token refresh',
            test: () => sessionContent.includes('scheduleProactiveRefresh') && sessionContent.includes('twoMinutes'),
            fix: 'Add proactive token refresh'
        },
        {
            name: 'Session status utilities',
            test: () => sessionContent.includes('getSessionStatus') && sessionContent.includes('formatTimeRemaining'),
            fix: 'Add session status utilities'
        },
        {
            name: 'Session cleanup on unmount',
            test: () => sessionContent.includes('onUnmounted') && sessionContent.includes('stopSessionMonitoring'),
            fix: 'Add proper session cleanup'
        }
    ]

    let passedChecks = 0

    sessionChecks.forEach((check, index) => {
        const passed = check.test()
        console.log(`${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) {
            console.log(`   Fix: ${check.fix}`)
        } else {
            passedChecks++
        }
    })

    console.log(`\n📊 useDashboardSession: Passed ${passedChecks}/${sessionChecks.length} checks`)

} catch (error) {
    console.log('❌ Error reading useDashboardSession composable:', error.message)
}

// Test 3: Check dashboard middleware files
console.log('\n3. Testing Dashboard Middleware...')

const middlewareFiles = [
    { name: 'dashboard-auth.ts', description: 'Dashboard authentication middleware' },
    { name: 'dashboard-permission.ts', description: 'Dashboard permission middleware' }
]

let middlewareCount = 0

middlewareFiles.forEach(file => {
    try {
        const middlewarePath = path.join(__dirname, 'middleware', file.name)
        if (fs.existsSync(middlewarePath)) {
            const content = fs.readFileSync(middlewarePath, 'utf8')

            const hasDefineMiddleware = content.includes('defineNuxtRouteMiddleware')
            const hasDashboardAuth = content.includes('useDashboardAuth') || content.includes('dashboard')
            const hasNavigation = content.includes('navigateTo')

            if (hasDefineMiddleware && hasDashboardAuth && hasNavigation) {
                console.log(`✅ ${file.description} - Complete`)
                middlewareCount++
            } else {
                console.log(`❌ ${file.description} - Incomplete`)
            }
        } else {
            console.log(`❌ ${file.description} - Missing`)
        }
    } catch (error) {
        console.log(`❌ ${file.description} - Error: ${error.message}`)
    }
})

console.log(`\n📊 Dashboard Middleware: ${middlewareCount}/${middlewareFiles.length} files complete`)

// Test 4: Check dashboard auth plugin
console.log('\n4. Testing Dashboard Authentication Plugin...')

try {
    const pluginPath = path.join(__dirname, 'plugins/dashboard-auth.client.ts')
    if (fs.existsSync(pluginPath)) {
        const pluginContent = fs.readFileSync(pluginPath, 'utf8')

        const hasDefinePlugin = pluginContent.includes('defineNuxtPlugin')
        const hasInitializeDashboard = pluginContent.includes('initializeDashboardAuth')
        const hasRouteCheck = pluginContent.includes('isDashboardRoute')

        if (hasDefinePlugin && hasInitializeDashboard && hasRouteCheck) {
            console.log('✅ Dashboard authentication plugin - Complete')
        } else {
            console.log('❌ Dashboard authentication plugin - Incomplete')
        }
    } else {
        console.log('❌ Dashboard authentication plugin - Missing')
    }
} catch (error) {
    console.log('❌ Dashboard authentication plugin - Error:', error.message)
}

// Test 5: Check dashboard-specific features
console.log('\n5. Testing Dashboard-Specific Features...')

try {
    const dashboardAuthContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardAuth.ts'), 'utf8')

    const dashboardFeatures = [
        'DashboardUser',
        'DashboardPermissions',
        'can_manage_posts',
        'can_manage_users',
        'can_manage_comments',
        'can_view_stats',
        'dashboard_auth_tokens',
        '/dashboard/auth/login/',
        '/dashboard/auth/logout/',
        '/dashboard/auth/profile/'
    ]

    let foundFeatures = 0

    dashboardFeatures.forEach(feature => {
        if (dashboardAuthContent.includes(feature)) {
            console.log(`✅ Found dashboard feature: ${feature}`)
            foundFeatures++
        } else {
            console.log(`❌ Missing dashboard feature: ${feature}`)
        }
    })

    console.log(`\n📊 Dashboard Features: Found ${foundFeatures}/${dashboardFeatures.length} features`)

} catch (error) {
    console.log('❌ Error checking dashboard features:', error.message)
}

// Test 6: Check integration with main auth system
console.log('\n6. Testing Integration with Main Auth System...')

try {
    const dashboardAuthContent = fs.readFileSync(path.join(__dirname, 'composables/useDashboardAuth.ts'), 'utf8')

    const integrationFeatures = [
        'useErrorHandler',
        'useLoading',
        'useApi',
        'api.tokenUtils',
        'api.apiRequest',
        'handleAuthError',
        'dashboardLoading.withLoading'
    ]

    let foundFeatures = 0

    integrationFeatures.forEach(feature => {
        if (dashboardAuthContent.includes(feature)) {
            console.log(`✅ Found integration: ${feature}`)
            foundFeatures++
        } else {
            console.log(`❌ Missing integration: ${feature}`)
        }
    })

    console.log(`\n📊 Integration Features: Found ${foundFeatures}/${integrationFeatures.length} features`)

} catch (error) {
    console.log('❌ Error checking integration features:', error.message)
}

console.log('\n🏁 Dashboard Authentication Test Complete')
console.log('='.repeat(50))
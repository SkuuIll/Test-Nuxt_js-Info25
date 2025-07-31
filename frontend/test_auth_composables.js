#!/usr/bin/env node

/**
 * Test script for the updated authentication composables
 * This script validates the auth store and composable functionality
 */

console.log('🧪 Testing Frontend Authentication Composables')
console.log('='.repeat(50))

const fs = require('fs')
const path = require('path')

// Test 1: Check auth store implementation
console.log('\n1. Testing Auth Store Implementation...')

try {
    const authStoreContent = fs.readFileSync(path.join(__dirname, 'stores/auth.ts'), 'utf8')

    const storeChecks = [
        {
            name: 'Uses enhanced error handling',
            test: () => authStoreContent.includes('handleAuthError') && authStoreContent.includes('handleValidationError'),
            fix: 'Add proper error handling with useErrorHandler'
        },
        {
            name: 'Uses API client utilities',
            test: () => authStoreContent.includes('api.tokenUtils') && authStoreContent.includes('api.login'),
            fix: 'Integrate with useApi composable'
        },
        {
            name: 'Has clearAuthState helper',
            test: () => authStoreContent.includes('clearAuthState'),
            fix: 'Add clearAuthState helper function'
        },
        {
            name: 'Enhanced login with profile fetch',
            test: () => authStoreContent.includes('api.getProfile()') && authStoreContent.includes('Login successful'),
            fix: 'Update login to fetch profile after authentication'
        },
        {
            name: 'Enhanced logout with proper cleanup',
            test: () => authStoreContent.includes('api.logout()') && authStoreContent.includes('clearAuthState'),
            fix: 'Update logout to properly clear state'
        },
        {
            name: 'Improved token management',
            test: () => authStoreContent.includes('import.meta.client') && !authStoreContent.includes('process.client'),
            fix: 'Use import.meta.client instead of process.client'
        },
        {
            name: 'Auth status checking utilities',
            test: () => authStoreContent.includes('checkAuthStatus') && authStoreContent.includes('refreshAuthIfNeeded'),
            fix: 'Add auth status checking utilities'
        }
    ]

    let passedChecks = 0

    storeChecks.forEach((check, index) => {
        const passed = check.test()
        console.log(`${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) {
            console.log(`   Fix: ${check.fix}`)
        } else {
            passedChecks++
        }
    })

    console.log(`\n📊 Auth Store: Passed ${passedChecks}/${storeChecks.length} checks`)

} catch (error) {
    console.log('❌ Error reading auth store:', error.message)
}

// Test 2: Check useAuth composable
console.log('\n2. Testing useAuth Composable...')

try {
    const useAuthContent = fs.readFileSync(path.join(__dirname, 'composables/useAuth.ts'), 'utf8')

    const composableChecks = [
        {
            name: 'Enhanced error handling methods',
            test: () => useAuthContent.includes('loginWithErrorHandling') && useAuthContent.includes('registerWithErrorHandling'),
            fix: 'Add enhanced error handling methods'
        },
        {
            name: 'Permission checking system',
            test: () => useAuthContent.includes('hasRole') && useAuthContent.includes('hasPermission'),
            fix: 'Add role and permission checking'
        },
        {
            name: 'Route guard functions',
            test: () => useAuthContent.includes('requireAuth') && useAuthContent.includes('requireAdmin'),
            fix: 'Add route guard functions'
        },
        {
            name: 'Auth status utilities',
            test: () => useAuthContent.includes('getAuthStatus') && useAuthContent.includes('ensureAuthenticated'),
            fix: 'Add auth status utilities'
        },
        {
            name: 'Safe logout method',
            test: () => useAuthContent.includes('safeLogout'),
            fix: 'Add safe logout method'
        },
        {
            name: 'Readonly state exposure',
            test: () => useAuthContent.includes('readonly(authStore.user)'),
            fix: 'Expose state as readonly'
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

    console.log(`\n📊 useAuth Composable: Passed ${passedChecks}/${composableChecks.length} checks`)

} catch (error) {
    console.log('❌ Error reading useAuth composable:', error.message)
}

// Test 3: Check middleware files
console.log('\n3. Testing Authentication Middleware...')

const middlewareFiles = [
    { name: 'auth.ts', description: 'Authentication middleware' },
    { name: 'admin.ts', description: 'Admin middleware' },
    { name: 'guest.ts', description: 'Guest middleware' }
]

let middlewareCount = 0

middlewareFiles.forEach(file => {
    try {
        const middlewarePath = path.join(__dirname, 'middleware', file.name)
        if (fs.existsSync(middlewarePath)) {
            const content = fs.readFileSync(middlewarePath, 'utf8')

            const hasDefineMiddleware = content.includes('defineNuxtRouteMiddleware')
            const hasAuthCheck = content.includes('isAuthenticated') || content.includes('getAuthStatus')
            const hasNavigation = content.includes('navigateTo')

            if (hasDefineMiddleware && hasAuthCheck && hasNavigation) {
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

console.log(`\n📊 Middleware: ${middlewareCount}/${middlewareFiles.length} files complete`)

// Test 4: Check auth plugin
console.log('\n4. Testing Authentication Plugin...')

try {
    const pluginPath = path.join(__dirname, 'plugins/auth.client.ts')
    if (fs.existsSync(pluginPath)) {
        const pluginContent = fs.readFileSync(pluginPath, 'utf8')

        const hasDefinePlugin = pluginContent.includes('defineNuxtPlugin')
        const hasInitializeAuth = pluginContent.includes('initializeAuth')
        const hasClientCheck = pluginContent.includes('client')

        if (hasDefinePlugin && hasInitializeAuth && hasClientCheck) {
            console.log('✅ Authentication plugin - Complete')
        } else {
            console.log('❌ Authentication plugin - Incomplete')
        }
    } else {
        console.log('❌ Authentication plugin - Missing')
    }
} catch (error) {
    console.log('❌ Authentication plugin - Error:', error.message)
}

// Test 5: Check error handling integration
console.log('\n5. Testing Error Handling Integration...')

try {
    const authStoreContent = fs.readFileSync(path.join(__dirname, 'stores/auth.ts'), 'utf8')

    const errorHandlingFeatures = [
        'handleAuthError',
        'handleValidationError',
        'error.value = errorInfo.message',
        'console.error',
        'throw err'
    ]

    let foundFeatures = 0

    errorHandlingFeatures.forEach(feature => {
        if (authStoreContent.includes(feature)) {
            console.log(`✅ Found error handling: ${feature}`)
            foundFeatures++
        } else {
            console.log(`❌ Missing error handling: ${feature}`)
        }
    })

    console.log(`\n📊 Error Handling: Found ${foundFeatures}/${errorHandlingFeatures.length} features`)

} catch (error) {
    console.log('❌ Error checking error handling:', error.message)
}

// Test 6: Check token management integration
console.log('\n6. Testing Token Management Integration...')

try {
    const authStoreContent = fs.readFileSync(path.join(__dirname, 'stores/auth.ts'), 'utf8')

    const tokenFeatures = [
        'api.tokenUtils.getTokens',
        'api.tokenUtils.setTokens',
        'api.tokenUtils.clearTokens',
        'api.tokenUtils.isTokenExpired',
        'api.refreshTokens',
        'clearAuthState'
    ]

    let foundFeatures = 0

    tokenFeatures.forEach(feature => {
        if (authStoreContent.includes(feature)) {
            console.log(`✅ Found token management: ${feature}`)
            foundFeatures++
        } else {
            console.log(`❌ Missing token management: ${feature}`)
        }
    })

    console.log(`\n📊 Token Management: Found ${foundFeatures}/${tokenFeatures.length} features`)

} catch (error) {
    console.log('❌ Error checking token management:', error.message)
}

console.log('\n🏁 Authentication Composables Test Complete')
console.log('='.repeat(50))
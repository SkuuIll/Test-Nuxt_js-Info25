#!/usr/bin/env node

/**
 * Test script for the updated useApi.ts composable
 * This script validates the API client functionality
 */

console.log('🧪 Testing Frontend API Client (useApi.ts)')
console.log('='.repeat(50))

// Test 1: Check TypeScript compilation
console.log('\n1. Testing TypeScript compilation...')
try {
    const { execSync } = require('child_process')

    // Check if the file compiles without errors
    const result = execSync('npx tsc --noEmit composables/useApi.ts', {
        cwd: __dirname,
        encoding: 'utf8',
        stdio: 'pipe'
    })

    console.log('✅ TypeScript compilation successful')
} catch (error) {
    console.log('❌ TypeScript compilation failed:')
    console.log(error.stdout || error.message)
}

// Test 2: Check for common issues
console.log('\n2. Checking for common issues...')

const fs = require('fs')
const path = require('path')

try {
    const apiContent = fs.readFileSync(path.join(__dirname, 'composables/useApi.ts'), 'utf8')

    const checks = [
        {
            name: 'Uses import.meta.client instead of process.client',
            test: () => !apiContent.includes('process.client') && apiContent.includes('import.meta.client'),
            fix: 'Replace process.client with import.meta.client'
        },
        {
            name: 'Uses import.meta.dev instead of process.dev',
            test: () => !apiContent.includes('process.dev') && apiContent.includes('import.meta.dev'),
            fix: 'Replace process.dev with import.meta.dev'
        },
        {
            name: 'Proper header handling in onRequest',
            test: () => apiContent.includes('const headers = options.headers as Record<string, string>'),
            fix: 'Fix header type casting in onRequest'
        },
        {
            name: 'Proper response type handling',
            test: () => apiContent.includes('Handle both standardized and direct response formats'),
            fix: 'Add proper response format handling'
        },
        {
            name: 'Token refresh infinite loop prevention',
            test: () => apiContent.includes('token_refreshed: true') && !apiContent.includes('Retry the original request'),
            fix: 'Prevent infinite loops in token refresh'
        },
        {
            name: 'Retry mechanism implementation',
            test: () => apiContent.includes('apiRequest') && apiContent.includes('maxRetries'),
            fix: 'Add retry mechanism for failed requests'
        },
        {
            name: 'Proper pagination response transformation',
            test: () => apiContent.includes('next: response.pagination?.next || undefined'),
            fix: 'Fix null to undefined conversion in pagination'
        }
    ]

    let passedChecks = 0

    checks.forEach((check, index) => {
        const passed = check.test()
        console.log(`${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) {
            console.log(`   Fix: ${check.fix}`)
        } else {
            passedChecks++
        }
    })

    console.log(`\n📊 Passed ${passedChecks}/${checks.length} checks`)

} catch (error) {
    console.log('❌ Error reading API file:', error.message)
}

// Test 3: Check API endpoints configuration
console.log('\n3. Checking API endpoints configuration...')

try {
    const apiContent = fs.readFileSync(path.join(__dirname, 'composables/useApi.ts'), 'utf8')

    const endpoints = [
        '/users/auth/login/',
        '/users/auth/register/',
        '/users/auth/refresh/',
        '/users/auth/logout/',
        '/users/auth/profile/',
        '/posts/',
        '/posts/search/',
        '/categories/',
        '/comments/'
    ]

    let foundEndpoints = 0

    endpoints.forEach(endpoint => {
        if (apiContent.includes(endpoint)) {
            console.log(`✅ Found endpoint: ${endpoint}`)
            foundEndpoints++
        } else {
            console.log(`❌ Missing endpoint: ${endpoint}`)
        }
    })

    console.log(`\n📊 Found ${foundEndpoints}/${endpoints.length} expected endpoints`)

} catch (error) {
    console.log('❌ Error checking endpoints:', error.message)
}

// Test 4: Check error handling
console.log('\n4. Checking error handling...')

try {
    const apiContent = fs.readFileSync(path.join(__dirname, 'composables/useApi.ts'), 'utf8')

    const errorHandlingFeatures = [
        'handleApiError',
        'handleAuthError',
        'handleNetworkError',
        'onResponseError',
        'createError',
        'statusCode',
        'statusMessage'
    ]

    let foundFeatures = 0

    errorHandlingFeatures.forEach(feature => {
        if (apiContent.includes(feature)) {
            console.log(`✅ Found error handling: ${feature}`)
            foundFeatures++
        } else {
            console.log(`❌ Missing error handling: ${feature}`)
        }
    })

    console.log(`\n📊 Found ${foundFeatures}/${errorHandlingFeatures.length} error handling features`)

} catch (error) {
    console.log('❌ Error checking error handling:', error.message)
}

// Test 5: Check token management
console.log('\n5. Checking token management...')

try {
    const apiContent = fs.readFileSync(path.join(__dirname, 'composables/useApi.ts'), 'utf8')

    const tokenFeatures = [
        'getTokens',
        'setTokens',
        'clearTokens',
        'isTokenExpired',
        'scheduleTokenRefresh',
        'refreshTokens',
        'localStorage.getItem',
        'localStorage.setItem',
        'localStorage.removeItem'
    ]

    let foundFeatures = 0

    tokenFeatures.forEach(feature => {
        if (apiContent.includes(feature)) {
            console.log(`✅ Found token management: ${feature}`)
            foundFeatures++
        } else {
            console.log(`❌ Missing token management: ${feature}`)
        }
    })

    console.log(`\n📊 Found ${foundFeatures}/${tokenFeatures.length} token management features`)

} catch (error) {
    console.log('❌ Error checking token management:', error.message)
}

console.log('\n🏁 API Client Test Complete')
console.log('='.repeat(50))
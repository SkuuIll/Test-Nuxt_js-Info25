#!/usr/bin/env node

/**
 * Test script for frontend CORS functionality
 * This script validates the CORS composable and configuration
 */

console.log('🧪 Testing Frontend CORS Functionality')
console.log('='.repeat(50))

const fs = require('fs')
const path = require('path')

// Test 1: Check useCors composable
console.log('\n1. Testing useCors Composable...')

try {
    const corsComposableContent = fs.readFileSync(path.join(__dirname, 'composables/useCors.ts'), 'utf8')

    const corsChecks = [
        {
            name: 'CORS configuration interface',
            test: () => corsComposableContent.includes('CorsConfig') && corsComposableContent.includes('credentials'),
            fix: 'Add CORS configuration interface'
        },
        {
            name: 'CORS error handling',
            test: () => corsComposableContent.includes('CorsError') && corsComposableContent.includes('handleCorsError'),
            fix: 'Add CORS error handling'
        },
        {
            name: 'Origin validation',
            test: () => corsComposableContent.includes('isOriginAllowed') && corsComposableContent.includes('getCurrentOrigin'),
            fix: 'Add origin validation functionality'
        },
        {
            name: 'CORS headers creation',
            test: () => corsComposableContent.includes('createCorsHeaders') && corsComposableContent.includes('Origin'),
            fix: 'Add CORS headers creation'
        },
        {
            name: 'CORS connection testing',
            test: () => corsComposableContent.includes('testCorsConnection') && corsComposableContent.includes('preflight'),
            fix: 'Add CORS connection testing'
        },
        {
            name: 'CORS-aware fetch wrapper',
            test: () => corsComposableContent.includes('corsAwareFetch') && corsComposableContent.includes('credentials'),
            fix: 'Add CORS-aware fetch wrapper'
        },
        {
            name: 'CORS validation system',
            test: () => corsComposableContent.includes('validateCorsSetup') && corsComposableContent.includes('recommendations'),
            fix: 'Add CORS validation system'
        },
        {
            name: 'Debug information',
            test: () => corsComposableContent.includes('getCorsDebugInfo') && corsComposableContent.includes('currentOrigin'),
            fix: 'Add CORS debug information'
        }
    ]

    let passedChecks = 0

    corsChecks.forEach((check, index) => {
        const passed = check.test()
        console.log(`${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) {
            console.log(`   Fix: ${check.fix}`)
        } else {
            passedChecks++
        }
    })

    console.log(`\n📊 useCors Composable: Passed ${passedChecks}/${corsChecks.length} checks`)

} catch (error) {
    console.log('❌ Error reading useCors composable:', error.message)
}

// Test 2: Check Nuxt configuration
console.log('\n2. Testing Nuxt CORS Configuration...')

try {
    const nuxtConfigContent = fs.readFileSync(path.join(__dirname, 'nuxt.config.ts'), 'utf8')

    const nuxtChecks = [
        {
            name: 'API base URL configuration',
            test: () => nuxtConfigContent.includes('apiBase') && nuxtConfigContent.includes('API_BASE_URL'),
            fix: 'Add API base URL configuration'
        },
        {
            name: 'WebSocket base URL configuration',
            test: () => nuxtConfigContent.includes('wsBase') && nuxtConfigContent.includes('WS_BASE_URL'),
            fix: 'Add WebSocket base URL configuration'
        },
        {
            name: 'CORS enabled flag',
            test: () => nuxtConfigContent.includes('corsEnabled') && nuxtConfigContent.includes('CORS_ENABLED'),
            fix: 'Add CORS enabled flag'
        },
        {
            name: 'Site URL configuration',
            test: () => nuxtConfigContent.includes('siteUrl') && nuxtConfigContent.includes('SITE_URL'),
            fix: 'Add site URL configuration'
        }
    ]

    let passedChecks = 0

    nuxtChecks.forEach((check, index) => {
        const passed = check.test()
        console.log(`${passed ? '✅' : '❌'} ${check.name}`)
        if (!passed) {
            console.log(`   Fix: ${check.fix}`)
        } else {
            passedChecks++
        }
    })

    console.log(`\n📊 Nuxt Configuration: Passed ${passedChecks}/${nuxtChecks.length} checks`)

} catch (error) {
    console.log('❌ Error reading Nuxt configuration:', error.message)
}

// Test 3: Check CORS utility functions
console.log('\n3. Testing CORS Utility Functions...')

try {
    const corsComposableContent = fs.readFileSync(path.join(__dirname, 'composables/useCors.ts'), 'utf8')

    const utilityFunctions = [
        'getCurrentOrigin',
        'isOriginAllowed',
        'createCorsHeaders',
        'testCorsConnection',
        'handleCorsError',
        'corsAwareFetch',
        'validateCorsSetup',
        'getCorsDebugInfo'
    ]

    let foundFunctions = 0

    utilityFunctions.forEach(func => {
        if (corsComposableContent.includes(func)) {
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

// Test 4: Check CORS configuration constants
console.log('\n4. Testing CORS Configuration Constants...')

try {
    const corsComposableContent = fs.readFileSync(path.join(__dirname, 'composables/useCors.ts'), 'utf8')

    const configConstants = [
        'credentials: true',
        'Content-Type',
        'Accept',
        'X-Requested-With',
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS'
    ]

    let foundConstants = 0

    configConstants.forEach(constant => {
        if (corsComposableContent.includes(constant)) {
            console.log(`✅ Found configuration: ${constant}`)
            foundConstants++
        } else {
            console.log(`❌ Missing configuration: ${constant}`)
        }
    })

    console.log(`\n📊 Configuration Constants: Found ${foundConstants}/${configConstants.length} constants`)

} catch (error) {
    console.log('❌ Error checking configuration constants:', error.message)
}

// Test 5: Check error handling types
console.log('\n5. Testing CORS Error Handling Types...')

try {
    const corsComposableContent = fs.readFileSync(path.join(__dirname, 'composables/useCors.ts'), 'utf8')

    const errorTypes = [
        'CorsError',
        'cors',
        'network',
        'server',
        'handleApiError',
        'TypeError',
        'CORS policy blocked'
    ]

    let foundTypes = 0

    errorTypes.forEach(type => {
        if (corsComposableContent.includes(type)) {
            console.log(`✅ Found error handling: ${type}`)
            foundTypes++
        } else {
            console.log(`❌ Missing error handling: ${type}`)
        }
    })

    console.log(`\n📊 Error Handling Types: Found ${foundTypes}/${errorTypes.length} types`)

} catch (error) {
    console.log('❌ Error checking error handling types:', error.message)
}

// Test 6: Check allowed origins configuration
console.log('\n6. Testing Allowed Origins Configuration...')

try {
    const corsComposableContent = fs.readFileSync(path.join(__dirname, 'composables/useCors.ts'), 'utf8')

    const allowedOrigins = [
        'localhost:3000',
        '127.0.0.1:3000',
        'localhost:8080',
        '127.0.0.1:8080',
        'config.public.siteUrl'
    ]

    let foundOrigins = 0

    allowedOrigins.forEach(origin => {
        if (corsComposableContent.includes(origin)) {
            console.log(`✅ Found allowed origin: ${origin}`)
            foundOrigins++
        } else {
            console.log(`❌ Missing allowed origin: ${origin}`)
        }
    })

    console.log(`\n📊 Allowed Origins: Found ${foundOrigins}/${allowedOrigins.length} origins`)

} catch (error) {
    console.log('❌ Error checking allowed origins:', error.message)
}

// Test 7: Check integration with error handler
console.log('\n7. Testing Error Handler Integration...')

try {
    const corsComposableContent = fs.readFileSync(path.join(__dirname, 'composables/useCors.ts'), 'utf8')

    const integrationFeatures = [
        'useErrorHandler',
        'handleApiError',
        'console.error',
        'originalError',
        'context'
    ]

    let foundFeatures = 0

    integrationFeatures.forEach(feature => {
        if (corsComposableContent.includes(feature)) {
            console.log(`✅ Found integration feature: ${feature}`)
            foundFeatures++
        } else {
            console.log(`❌ Missing integration feature: ${feature}`)
        }
    })

    console.log(`\n📊 Error Handler Integration: Found ${foundFeatures}/${integrationFeatures.length} features`)

} catch (error) {
    console.log('❌ Error checking error handler integration:', error.message)
}

console.log('\n🏁 Frontend CORS Test Complete')
console.log('='.repeat(50))
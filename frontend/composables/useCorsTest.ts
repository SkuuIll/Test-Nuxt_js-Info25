/**
 * Composable for testing CORS configuration
 * Provides utilities to test CORS functionality from the frontend
 */

interface CorsTestResult {
    success: boolean
    status: number
    headers: Record<string, string>
    data?: any
    error?: string
    timing: number
}

interface CorsTestSuite {
    testName: string
    description: string
    results: CorsTestResult[]
    passed: number
    failed: number
    totalTime: number
}

export const useCorsTest = () => {
    const config = useRuntimeConfig()
    const api = useApi()

    // State
    const isRunning = ref(false)
    const currentTest = ref<string>('')
    const testResults = ref<CorsTestSuite[]>([])
    const overallResults = ref({
        totalTests: 0,
        passed: 0,
        failed: 0,
        totalTime: 0
    })

    // Test endpoints
    const testEndpoints = [
        '/api/v1/cors-test/',
        '/api/v1/posts/',
        '/api/v1/dashboard/auth/login/',
        '/api/v1/users/profile/',
        '/api/v1/media/upload/'
    ]

    // Test origins to simulate different scenarios
    const testOrigins = [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://example.com',
        'https://malicious-site.com'
    ]

    /**
     * Run a single CORS test
     */
    const runSingleTest = async (
        endpoint: string,
        method: string = 'GET',
        headers: Record<string, string> = {},
        body?: any
    ): Promise<CorsTestResult> => {
        const startTime = performance.now()

        try {
            const response = await fetch(`${config.public.apiBase}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: body ? JSON.stringify(body) : undefined,
                credentials: 'include' // Test with credentials
            })

            const endTime = performance.now()
            const responseHeaders: Record<string, string> = {}

            // Extract response headers
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value
            })

            let data: any = null
            try {
                data = await response.json()
            } catch {
                data = await response.text()
            }

            return {
                success: response.ok,
                status: response.status,
                headers: responseHeaders,
                data,
                timing: endTime - startTime
            }
        } catch (error: any) {
            const endTime = performance.now()

            return {
                success: false,
                status: 0,
                headers: {},
                error: error.message,
                timing: endTime - startTime
            }
        }
    }

    /**
     * Test preflight requests (OPTIONS)
     */
    const testPreflightRequests = async (): Promise<CorsTestSuite> => {
        currentTest.value = 'Preflight Requests'
        const results: CorsTestResult[] = []

        for (const endpoint of testEndpoints) {
            const result = await runSingleTest(endpoint, 'OPTIONS', {
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, Authorization'
            })

            results.push(result)
        }

        const passed = results.filter(r => r.success).length
        const failed = results.length - passed
        const totalTime = results.reduce((sum, r) => sum + r.timing, 0)

        return {
            testName: 'Preflight Requests',
            description: 'Test CORS preflight (OPTIONS) requests',
            results,
            passed,
            failed,
            totalTime
        }
    }

    /**
     * Test simple CORS requests
     */
    const testSimpleRequests = async (): Promise<CorsTestSuite> => {
        currentTest.value = 'Simple Requests'
        const results: CorsTestResult[] = []

        for (const endpoint of testEndpoints) {
            const result = await runSingleTest(endpoint, 'GET')
            results.push(result)
        }

        const passed = results.filter(r => r.success || r.status < 500).length
        const failed = results.length - passed
        const totalTime = results.reduce((sum, r) => sum + r.timing, 0)

        return {
            testName: 'Simple Requests',
            description: 'Test simple CORS GET requests',
            results,
            passed,
            failed,
            totalTime
        }
    }

    /**
     * Test requests with custom headers
     */
    const testCustomHeaders = async (): Promise<CorsTestSuite> => {
        currentTest.value = 'Custom Headers'
        const results: CorsTestResult[] = []

        const customHeaders = [
            { 'X-API-Key': 'test-key' },
            { 'X-Requested-With': 'XMLHttpRequest' },
            { 'X-CSRFToken': 'test-csrf-token' },
            { 'X-Dashboard-Token': 'test-dashboard-token' },
            { 'Authorization': 'Bearer test-token' }
        ]

        for (const headers of customHeaders) {
            const result = await runSingleTest('/api/v1/cors-test/', 'GET', headers)
            results.push(result)
        }

        const passed = results.filter(r => r.success || r.status < 500).length
        const failed = results.length - passed
        const totalTime = results.reduce((sum, r) => sum + r.timing, 0)

        return {
            testName: 'Custom Headers',
            description: 'Test requests with custom headers',
            results,
            passed,
            failed,
            totalTime
        }
    }

    /**
     * Test credentialed requests
     */
    const testCredentialedRequests = async (): Promise<CorsTestSuite> => {
        currentTest.value = 'Credentialed Requests'
        const results: CorsTestResult[] = []

        // Test with various authentication methods
        const authHeaders = [
            { 'Authorization': 'Bearer test-token' },
            { 'Cookie': 'sessionid=test-session' },
            { 'X-CSRFToken': 'test-csrf', 'Cookie': 'csrftoken=test-csrf' }
        ]

        for (const headers of authHeaders) {
            const result = await runSingleTest('/api/v1/cors-test/', 'GET', headers)
            results.push(result)
        }

        const passed = results.filter(r => {
            // Check if Access-Control-Allow-Credentials is present
            return r.headers['access-control-allow-credentials'] === 'true'
        }).length

        const failed = results.length - passed
        const totalTime = results.reduce((sum, r) => sum + r.timing, 0)

        return {
            testName: 'Credentialed Requests',
            description: 'Test requests with credentials (cookies, auth headers)',
            results,
            passed,
            failed,
            totalTime
        }
    }

    /**
     * Test POST requests with data
     */
    const testPostRequests = async (): Promise<CorsTestSuite> => {
        currentTest.value = 'POST Requests'
        const results: CorsTestResult[] = []

        const testData = {
            test: true,
            message: 'CORS test data',
            timestamp: Date.now()
        }

        // Test POST to CORS test endpoint
        const result = await runSingleTest('/api/v1/cors-test/', 'POST', {
            'Content-Type': 'application/json'
        }, testData)

        results.push(result)

        const passed = results.filter(r => r.success || r.status < 500).length
        const failed = results.length - passed
        const totalTime = results.reduce((sum, r) => sum + r.timing, 0)

        return {
            testName: 'POST Requests',
            description: 'Test CORS POST requests with JSON data',
            results,
            passed,
            failed,
            totalTime
        }
    }

    /**
     * Test CORS headers validation
     */
    const testCorsHeaders = async (): Promise<CorsTestSuite> => {
        currentTest.value = 'CORS Headers Validation'
        const results: CorsTestResult[] = []

        const result = await runSingleTest('/api/v1/cors-test/', 'GET')

        // Validate required CORS headers
        const requiredHeaders = [
            'access-control-allow-origin',
            'access-control-allow-credentials',
            'access-control-allow-methods',
            'access-control-allow-headers'
        ]

        const headerValidation = {
            success: true,
            status: result.status,
            headers: result.headers,
            data: {
                validHeaders: [] as string[],
                missingHeaders: [] as string[],
                headerValues: {} as Record<string, string>
            },
            timing: result.timing
        }

        for (const header of requiredHeaders) {
            if (result.headers[header]) {
                headerValidation.data.validHeaders.push(header)
                headerValidation.data.headerValues[header] = result.headers[header]
            } else {
                headerValidation.data.missingHeaders.push(header)
                headerValidation.success = false
            }
        }

        results.push(headerValidation)

        return {
            testName: 'CORS Headers Validation',
            description: 'Validate presence of required CORS headers',
            results,
            passed: headerValidation.success ? 1 : 0,
            failed: headerValidation.success ? 0 : 1,
            totalTime: result.timing
        }
    }

    /**
     * Run comprehensive CORS test suite
     */
    const runFullTestSuite = async () => {
        if (isRunning.value) return

        isRunning.value = true
        testResults.value = []
        overallResults.value = { totalTests: 0, passed: 0, failed: 0, totalTime: 0 }

        try {
            console.log('🧪 Starting comprehensive CORS test suite...')

            // Run all test suites
            const testSuites = [
                await testPreflightRequests(),
                await testSimpleRequests(),
                await testCustomHeaders(),
                await testCredentialedRequests(),
                await testPostRequests(),
                await testCorsHeaders()
            ]

            testResults.value = testSuites

            // Calculate overall results
            overallResults.value = testSuites.reduce((acc, suite) => ({
                totalTests: acc.totalTests + suite.results.length,
                passed: acc.passed + suite.passed,
                failed: acc.failed + suite.failed,
                totalTime: acc.totalTime + suite.totalTime
            }), { totalTests: 0, passed: 0, failed: 0, totalTime: 0 })

            console.log('✅ CORS test suite completed:', overallResults.value)

        } catch (error) {
            console.error('❌ CORS test suite failed:', error)
        } finally {
            isRunning.value = false
            currentTest.value = ''
        }
    }

    /**
     * Test specific endpoint
     */
    const testEndpoint = async (endpoint: string, method: string = 'GET') => {
        const result = await runSingleTest(endpoint, method)

        console.log(`CORS test for ${method} ${endpoint}:`, {
            success: result.success,
            status: result.status,
            corsHeaders: Object.keys(result.headers)
                .filter(key => key.toLowerCase().startsWith('access-control-'))
                .reduce((acc, key) => ({ ...acc, [key]: result.headers[key] }), {}),
            timing: `${result.timing.toFixed(2)}ms`
        })

        return result
    }

    /**
     * Get CORS configuration from server
     */
    const getCorsConfiguration = async () => {
        try {
            const result = await runSingleTest('/api/v1/cors-test/', 'GET')

            if (result.success && result.data) {
                return {
                    serverInfo: result.data.server_info || {},
                    corsHeaders: Object.keys(result.headers)
                        .filter(key => key.toLowerCase().startsWith('access-control-'))
                        .reduce((acc, key) => ({ ...acc, [key]: result.headers[key] }), {}),
                    debugInfo: result.data.debug || null
                }
            }

            return null
        } catch (error) {
            console.error('Failed to get CORS configuration:', error)
            return null
        }
    }

    /**
     * Generate CORS test report
     */
    const generateTestReport = () => {
        if (testResults.value.length === 0) {
            return null
        }

        const report = {
            timestamp: new Date().toISOString(),
            summary: overallResults.value,
            testSuites: testResults.value.map(suite => ({
                name: suite.testName,
                description: suite.description,
                passed: suite.passed,
                failed: suite.failed,
                totalTime: suite.totalTime,
                successRate: ((suite.passed / suite.results.length) * 100).toFixed(1) + '%',
                averageTime: (suite.totalTime / suite.results.length).toFixed(2) + 'ms'
            })),
            recommendations: generateRecommendations()
        }

        return report
    }

    /**
     * Generate recommendations based on test results
     */
    const generateRecommendations = () => {
        const recommendations: string[] = []

        if (overallResults.value.failed > 0) {
            recommendations.push('Some CORS tests failed. Check server configuration.')
        }

        if (overallResults.value.totalTime > 5000) {
            recommendations.push('CORS requests are taking longer than expected. Consider optimizing middleware.')
        }

        const credentialSuite = testResults.value.find(s => s.testName === 'Credentialed Requests')
        if (credentialSuite && credentialSuite.failed > 0) {
            recommendations.push('Credential-based requests are failing. Ensure CORS_ALLOW_CREDENTIALS is properly configured.')
        }

        const headerSuite = testResults.value.find(s => s.testName === 'CORS Headers Validation')
        if (headerSuite && headerSuite.failed > 0) {
            recommendations.push('Required CORS headers are missing. Check CORS middleware configuration.')
        }

        if (recommendations.length === 0) {
            recommendations.push('All CORS tests passed! Configuration looks good.')
        }

        return recommendations
    }

    return {
        // State
        isRunning: readonly(isRunning),
        currentTest: readonly(currentTest),
        testResults: readonly(testResults),
        overallResults: readonly(overallResults),

        // Methods
        runFullTestSuite,
        testEndpoint,
        getCorsConfiguration,
        generateTestReport,

        // Individual test methods
        testPreflightRequests,
        testSimpleRequests,
        testCustomHeaders,
        testCredentialedRequests,
        testPostRequests,
        testCorsHeaders
    }
}
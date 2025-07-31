/**
 * API Testing and Validation Composable
 * Provides comprehensive testing utilities for API endpoints
 */

interface TestResult {
    endpoint: string
    method: string
    status: 'success' | 'error' | 'warning'
    statusCode?: number
    responseTime: number
    error?: string
    data?: any
    timestamp: Date
}

interface EndpointTest {
    name: string
    endpoint: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    headers?: Record<string, string>
    body?: any
    expectedStatus?: number
    expectedFields?: string[]
    requiresAuth?: boolean
    timeout?: number
}

interface TestSuite {
    name: string
    description: string
    tests: EndpointTest[]
    setup?: () => Promise<void>
    teardown?: () => Promise<void>
}

export const useApiTesting = () => {
    const { api } = useApi()
    const { getTokens } = useAuth()

    // Test state
    const testResults = ref<TestResult[]>([])
    const isRunningTests = ref(false)
    const currentTest = ref<string | null>(null)
    const testProgress = ref(0)
    const testSuites = ref<TestSuite[]>([])

    /**
     * Run a single endpoint test
     */
    const runEndpointTest = async (test: EndpointTest): Promise<TestResult> => {
        const startTime = Date.now()
        currentTest.value = test.name

        try {
            console.log(`🧪 Testing: ${test.name} (${test.method} ${test.endpoint})`)

            // Prepare headers
            const headers: Record<string, string> = { ...test.headers }

            // Add auth headers if required
            if (test.requiresAuth) {
                const tokens = getTokens()
                if (tokens?.access) {
                    headers.Authorization = `Bearer ${tokens.access}`
                } else {
                    throw new Error('Authentication required but no token available')
                }
            }

            // Make the API request
            const response = await api(test.endpoint, {
                method: test.method,
                headers,
                body: test.body,
                timeout: test.timeout || 10000
            })

            const responseTime = Date.now() - startTime

            // Validate response
            const validationErrors = validateResponse(response, test)

            const result: TestResult = {
                endpoint: test.endpoint,
                method: test.method,
                status: validationErrors.length > 0 ? 'warning' : 'success',
                statusCode: 200, // Assuming success if no error thrown
                responseTime,
                data: response,
                timestamp: new Date(),
                error: validationErrors.length > 0 ? validationErrors.join(', ') : undefined
            }

            console.log(`✅ Test passed: ${test.name} (${responseTime}ms)`)
            return result

        } catch (error: any) {
            const responseTime = Date.now() - startTime

            const result: TestResult = {
                endpoint: test.endpoint,
                method: test.method,
                status: 'error',
                statusCode: error.status || error.statusCode,
                responseTime,
                error: error.message || 'Unknown error',
                timestamp: new Date()
            }

            console.error(`❌ Test failed: ${test.name} - ${error.message}`)
            return result
        }
    }

    /**
     * Validate API response against expected criteria
     */
    const validateResponse = (response: any, test: EndpointTest): string[] => {
        const errors: string[] = []

        // Check expected fields
        if (test.expectedFields) {
            for (const field of test.expectedFields) {
                if (!hasNestedProperty(response, field)) {
                    errors.push(`Missing expected field: ${field}`)
                }
            }
        }

        // Additional validation based on endpoint patterns
        if (test.endpoint.includes('/posts/') && test.method === 'GET') {
            validatePostResponse(response, errors)
        } else if (test.endpoint.includes('/users/') && test.method === 'GET') {
            validateUserResponse(response, errors)
        } else if (test.endpoint.includes('/dashboard/')) {
            validateDashboardResponse(response, errors)
        }

        return errors
    }

    /**
     * Validate post response structure
     */
    const validatePostResponse = (response: any, errors: string[]) => {
        const requiredFields = ['id', 'title', 'content', 'created_at']

        if (Array.isArray(response.results)) {
            // Paginated response
            if (!response.count && response.count !== 0) {
                errors.push('Missing count field in paginated response')
            }

            response.results.forEach((post: any, index: number) => {
                requiredFields.forEach(field => {
                    if (!post[field]) {
                        errors.push(`Post ${index}: Missing required field ${field}`)
                    }
                })
            })
        } else if (response.id) {
            // Single post response
            requiredFields.forEach(field => {
                if (!response[field]) {
                    errors.push(`Missing required field ${field}`)
                }
            })
        }
    }

    /**
     * Validate user response structure
     */
    const validateUserResponse = (response: any, errors: string[]) => {
        const requiredFields = ['id', 'username', 'email']

        if (Array.isArray(response.results)) {
            response.results.forEach((user: any, index: number) => {
                requiredFields.forEach(field => {
                    if (!user[field]) {
                        errors.push(`User ${index}: Missing required field ${field}`)
                    }
                })
            })
        } else if (response.id) {
            requiredFields.forEach(field => {
                if (!response[field]) {
                    errors.push(`Missing required field ${field}`)
                }
            })
        }
    }

    /**
     * Validate dashboard response structure
     */
    const validateDashboardResponse = (response: any, errors: string[]) => {
        // Dashboard responses should have consistent structure
        if (response.results && !Array.isArray(response.results)) {
            errors.push('Dashboard results should be an array')
        }

        if (response.results && !response.count && response.count !== 0) {
            errors.push('Dashboard paginated responses should include count')
        }
    }

    /**
     * Check if object has nested property
     */
    const hasNestedProperty = (obj: any, path: string): boolean => {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined
        }, obj) !== undefined
    }

    /**
     * Run a test suite
     */
    const runTestSuite = async (suite: TestSuite): Promise<TestResult[]> => {
        console.log(`🧪 Running test suite: ${suite.name}`)

        const suiteResults: TestResult[] = []

        try {
            // Run setup if provided
            if (suite.setup) {
                console.log('🔧 Running test suite setup...')
                await suite.setup()
            }

            // Run all tests in the suite
            for (let i = 0; i < suite.tests.length; i++) {
                const test = suite.tests[i]
                testProgress.value = ((i + 1) / suite.tests.length) * 100

                const result = await runEndpointTest(test)
                suiteResults.push(result)

                // Small delay between tests to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100))
            }

            // Run teardown if provided
            if (suite.teardown) {
                console.log('🧹 Running test suite teardown...')
                await suite.teardown()
            }

        } catch (error) {
            console.error(`❌ Test suite failed: ${suite.name}`, error)
        }

        return suiteResults
    }

    /**
     * Run all registered test suites
     */
    const runAllTests = async (): Promise<void> => {
        if (isRunningTests.value) {
            console.warn('⚠️ Tests are already running')
            return
        }

        isRunningTests.value = true
        testResults.value = []
        testProgress.value = 0

        try {
            console.log('🚀 Starting comprehensive API tests...')

            for (const suite of testSuites.value) {
                const suiteResults = await runTestSuite(suite)
                testResults.value.push(...suiteResults)
            }

            // Generate test report
            generateTestReport()

        } catch (error) {
            console.error('❌ Test execution failed:', error)
        } finally {
            isRunningTests.value = false
            currentTest.value = null
            testProgress.value = 100
        }
    }

    /**
     * Generate comprehensive test report
     */
    const generateTestReport = () => {
        const totalTests = testResults.value.length
        const passedTests = testResults.value.filter(r => r.status === 'success').length
        const failedTests = testResults.value.filter(r => r.status === 'error').length
        const warningTests = testResults.value.filter(r => r.status === 'warning').length

        const avgResponseTime = totalTests > 0
            ? testResults.value.reduce((sum, r) => sum + r.responseTime, 0) / totalTests
            : 0

        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                warnings: warningTests,
                successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
                avgResponseTime: Math.round(avgResponseTime)
            },
            details: testResults.value,
            timestamp: new Date()
        }

        console.log('📊 Test Report:', report.summary)

        // Log failed tests
        if (failedTests > 0) {
            console.group('❌ Failed Tests:')
            testResults.value
                .filter(r => r.status === 'error')
                .forEach(r => {
                    console.error(`${r.method} ${r.endpoint}: ${r.error}`)
                })
            console.groupEnd()
        }

        // Log warnings
        if (warningTests > 0) {
            console.group('⚠️ Tests with Warnings:')
            testResults.value
                .filter(r => r.status === 'warning')
                .forEach(r => {
                    console.warn(`${r.method} ${r.endpoint}: ${r.error}`)
                })
            console.groupEnd()
        }

        return report
    }

    /**
     * Register predefined test suites
     */
    const registerDefaultTestSuites = () => {
        // Authentication Tests
        testSuites.value.push({
            name: 'Authentication',
            description: 'Test authentication endpoints',
            tests: [
                {
                    name: 'Login',
                    endpoint: '/api/v1/auth/login/',
                    method: 'POST',
                    body: {
                        username: 'testuser',
                        password: 'testpass123'
                    },
                    expectedFields: ['access', 'refresh', 'user']
                },
                {
                    name: 'Token Refresh',
                    endpoint: '/api/v1/auth/token/refresh/',
                    method: 'POST',
                    expectedFields: ['access']
                },
                {
                    name: 'User Profile',
                    endpoint: '/api/v1/auth/user/',
                    method: 'GET',
                    requiresAuth: true,
                    expectedFields: ['id', 'username', 'email']
                }
            ]
        })

        // Posts API Tests
        testSuites.value.push({
            name: 'Posts API',
            description: 'Test posts CRUD operations',
            tests: [
                {
                    name: 'List Posts',
                    endpoint: '/api/v1/posts/',
                    method: 'GET',
                    expectedFields: ['results', 'count']
                },
                {
                    name: 'Get Post Detail',
                    endpoint: '/api/v1/posts/1/',
                    method: 'GET',
                    expectedFields: ['id', 'title', 'content', 'author']
                },
                {
                    name: 'Search Posts',
                    endpoint: '/api/v1/posts/?search=test',
                    method: 'GET',
                    expectedFields: ['results', 'count']
                },
                {
                    name: 'Filter Posts by Category',
                    endpoint: '/api/v1/posts/?category=1',
                    method: 'GET',
                    expectedFields: ['results', 'count']
                }
            ]
        })

        // Dashboard Tests
        testSuites.value.push({
            name: 'Dashboard API',
            description: 'Test dashboard functionality',
            tests: [
                {
                    name: 'Dashboard Stats',
                    endpoint: '/api/v1/dashboard/stats/',
                    method: 'GET',
                    requiresAuth: true,
                    expectedFields: ['posts_count', 'users_count']
                },
                {
                    name: 'Dashboard Posts',
                    endpoint: '/api/v1/dashboard/posts/',
                    method: 'GET',
                    requiresAuth: true,
                    expectedFields: ['results', 'count']
                },
                {
                    name: 'Dashboard Users',
                    endpoint: '/api/v1/dashboard/users/',
                    method: 'GET',
                    requiresAuth: true,
                    expectedFields: ['results', 'count']
                }
            ]
        })

        // Categories Tests
        testSuites.value.push({
            name: 'Categories API',
            description: 'Test categories endpoints',
            tests: [
                {
                    name: 'List Categories',
                    endpoint: '/api/v1/categories/',
                    method: 'GET',
                    expectedFields: ['results']
                },
                {
                    name: 'Get Category Detail',
                    endpoint: '/api/v1/categories/1/',
                    method: 'GET',
                    expectedFields: ['id', 'name', 'slug']
                }
            ]
        })
    }

    /**
     * Test specific endpoint with custom parameters
     */
    const testEndpoint = async (
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
        options: {
            body?: any
            headers?: Record<string, string>
            requiresAuth?: boolean
            expectedFields?: string[]
        } = {}
    ): Promise<TestResult> => {
        const test: EndpointTest = {
            name: `Custom Test: ${method} ${endpoint}`,
            endpoint,
            method,
            ...options
        }

        return await runEndpointTest(test)
    }

    /**
     * Get test statistics
     */
    const getTestStats = () => {
        const total = testResults.value.length
        const passed = testResults.value.filter(r => r.status === 'success').length
        const failed = testResults.value.filter(r => r.status === 'error').length
        const warnings = testResults.value.filter(r => r.status === 'warning').length

        const avgResponseTime = total > 0
            ? testResults.value.reduce((sum, r) => sum + r.responseTime, 0) / total
            : 0

        const slowestTest = testResults.value.reduce((slowest, current) =>
            current.responseTime > (slowest?.responseTime || 0) ? current : slowest
            , null as TestResult | null)

        const fastestTest = testResults.value.reduce((fastest, current) =>
            current.responseTime < (fastest?.responseTime || Infinity) ? current : fastest
            , null as TestResult | null)

        return {
            total,
            passed,
            failed,
            warnings,
            successRate: total > 0 ? (passed / total) * 100 : 0,
            avgResponseTime: Math.round(avgResponseTime),
            slowestTest,
            fastestTest,
            recentTests: testResults.value.slice(0, 10)
        }
    }

    /**
     * Clear test results
     */
    const clearTestResults = () => {
        testResults.value = []
        testProgress.value = 0
        currentTest.value = null
    }

    // Initialize default test suites
    registerDefaultTestSuites()

    return {
        // State
        testResults: readonly(testResults),
        isRunningTests: readonly(isRunningTests),
        currentTest: readonly(currentTest),
        testProgress: readonly(testProgress),
        testSuites: readonly(testSuites),

        // Methods
        runEndpointTest,
        runTestSuite,
        runAllTests,
        testEndpoint,
        generateTestReport,
        getTestStats,
        clearTestResults,

        // Utilities
        registerDefaultTestSuites
    }
}
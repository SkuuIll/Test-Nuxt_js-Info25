# Error Handling System

## Overview

The error handling system provides comprehensive error management, recovery mechanisms, and user-friendly error reporting throughout the application.

## Architecture

### Components

#### ErrorBoundary
A Vue component that catches JavaScript errors anywhere in the child component tree.

**Location**: `components/ErrorBoundary.vue`

**Features**:
- Catches unhandled component errors
- Displays user-friendly error messages
- Provides retry functionality
- Logs errors for debugging
- Graceful degradation

**Usage**:
```vue
<template>
  <ErrorBoundary>
    <YourComponent />
  </ErrorBoundary>
</template>
```

#### EnhancedImage
An image component with comprehensive error handling and fallback mechanisms.

**Location**: `components/EnhancedImage.vue`

**Features**:
- Multiple fallback strategies
- IPX optimization error handling
- Loading states
- Retry functionality
- Accessibility support

### Composables

#### useErrorRecovery
Main composable for error handling and recovery.

**Location**: `composables/useErrorRecovery.ts`

**API**:
```typescript
interface ErrorRecovery {
  // State
  hasError: Ref<boolean>
  errorMessage: Ref<string>
  retryCount: Ref<number>
  isRecovering: Ref<boolean>
  recoveryActions: Ref<RecoveryAction[]>
  
  // Methods
  handleError(error: Error, type: ErrorType, context?: any): Promise<void>
  clearError(): void
  getErrorStats(): ErrorStats
}
```

#### useMediaErrorHandler
Specialized composable for handling media file errors.

**Location**: `composables/useMediaErrorHandler.ts`

**Features**:
- Image loading error detection
- IPX optimization fallbacks
- Placeholder generation
- Retry with exponential backoff
- Error statistics

#### useErrorHandler
Global error handler for application-wide error management.

**Location**: `composables/useErrorHandler.ts`

**Features**:
- Error classification
- User-friendly message mapping
- Context-aware error handling
- Integration with toast system

## Error Types

### Classification System
```typescript
type ErrorType = 'network' | 'auth' | 'validation' | 'server' | 'client' | 'media'

interface ErrorInfo {
  type: ErrorType
  severity: 'low' | 'medium' | 'high'
  recoverable: boolean
  userMessage: string
  technicalMessage: string
  context?: any
}
```

### Error Categories

#### Network Errors
- Connection timeouts
- DNS resolution failures
- CORS issues
- Rate limiting

#### Authentication Errors
- Invalid credentials
- Token expiration
- Permission denied
- Session timeout

#### Validation Errors
- Form validation failures
- Data format errors
- Required field missing
- Invalid input values

#### Server Errors
- 500 Internal Server Error
- 503 Service Unavailable
- Database connection issues
- API endpoint failures

#### Media Errors
- Image loading failures
- IPX optimization errors
- Unsupported formats
- File size limits

## Recovery Mechanisms

### Automatic Recovery
```typescript
// Network errors - automatic retry
const handleNetworkError = async (error: Error) => {
  await retry(originalRequest, {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  })
}

// Auth errors - redirect to login
const handleAuthError = (error: Error) => {
  navigateTo('/login')
  toast.authError('Please log in again')
}
```

### User-Initiated Recovery
```typescript
// Recovery actions provided to user
const recoveryActions = [
  {
    label: 'Retry',
    type: 'primary',
    action: () => retryOperation(),
    icon: 'refresh'
  },
  {
    label: 'Go Home',
    type: 'secondary',
    action: () => navigateTo('/'),
    icon: 'home'
  }
]
```

## Usage Examples

### Basic Error Handling
```typescript
const errorRecovery = useErrorRecovery()

try {
  await riskyOperation()
} catch (error) {
  await errorRecovery.handleError(error, 'network', {
    operation: 'fetchUserData',
    userId: user.id
  })
}
```

### Component Error Boundary
```vue
<template>
  <ErrorBoundary @retry="handleRetry">
    <UserProfile :user-id="userId" />
  </ErrorBoundary>
</template>

<script setup>
const handleRetry = () => {
  // Retry logic
  location.reload()
}
</script>
```

### Media Error Handling
```vue
<template>
  <EnhancedImage
    :src="imageUrl"
    :fallback-src="fallbackUrl"
    alt="User avatar"
    @error="handleImageError"
    @load="handleImageLoad"
  />
</template>

<script setup>
const handleImageError = (error) => {
  console.warn('Image failed to load:', error)
}

const handleImageLoad = () => {
  console.log('Image loaded successfully')
}
</script>
```

## Global Error Handling

### Plugin Setup
```typescript
// plugins/error-handler.client.ts
export default defineNuxtPlugin(() => {
  const errorHandler = useErrorHandler()
  
  // Global error handler
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, 'client')
  })
  
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason, 'promise')
  })
  
  // Vue error handler
  const nuxtApp = useNuxtApp()
  nuxtApp.vueApp.config.errorHandler = (error, context) => {
    errorHandler.handleError(error, 'vue', context)
  }
})
```

### Error Page
```vue
<!-- error.vue -->
<template>
  <div class="error-page">
    <div class="error-content">
      <h1>{{ error.statusCode }}</h1>
      <p>{{ error.statusMessage }}</p>
      
      <div class="error-actions">
        <button @click="handleError" class="btn-primary">
          Try Again
        </button>
        <NuxtLink to="/" class="btn-secondary">
          Go Home
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['error'])

const handleError = async () => {
  await clearError({ redirect: '/' })
}
</script>
```

## Error Logging

### Client-Side Logging
```typescript
const logError = (error: Error, context: any) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context
  }
  
  // Send to logging service
  $fetch('/api/errors', {
    method: 'POST',
    body: errorLog
  }).catch(() => {
    // Fallback: store locally
    localStorage.setItem('pendingErrors', JSON.stringify([errorLog]))
  })
}
```

### Error Statistics
```typescript
const errorStats = useErrorRecovery().getErrorStats()

console.log({
  total: errorStats.total,
  byType: errorStats.byType,
  bySeverity: errorStats.bySeverity,
  recent: errorStats.recent
})
```

## User Experience

### Error Messages
```typescript
const ERROR_MESSAGES = {
  network: {
    title: 'Connection Problem',
    message: 'Please check your internet connection and try again.',
    action: 'Retry'
  },
  auth: {
    title: 'Authentication Required',
    message: 'Please log in to continue.',
    action: 'Log In'
  },
  validation: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'Fix Errors'
  }
}
```

### Progressive Enhancement
```typescript
// Graceful degradation for JavaScript errors
const withFallback = (operation: () => void, fallback: () => void) => {
  try {
    operation()
  } catch (error) {
    console.warn('Operation failed, using fallback:', error)
    fallback()
  }
}
```

## Testing

### Error Simulation
```typescript
// Test error handling
describe('Error Handling', () => {
  it('handles network errors', async () => {
    const mockError = new Error('Network timeout')
    mockError.name = 'NetworkError'
    
    const errorRecovery = useErrorRecovery()
    await errorRecovery.handleError(mockError, 'network')
    
    expect(errorRecovery.hasError.value).toBe(true)
    expect(errorRecovery.recoveryActions.value).toContainEqual(
      expect.objectContaining({ label: 'Retry' })
    )
  })
})
```

### Component Testing
```typescript
// Test error boundary
describe('ErrorBoundary', () => {
  it('catches component errors', () => {
    const ThrowingComponent = {
      render() {
        throw new Error('Test error')
      }
    }
    
    const wrapper = mount(ErrorBoundary, {
      slots: {
        default: ThrowingComponent
      }
    })
    
    expect(wrapper.find('.error-message').exists()).toBe(true)
  })
})
```

## Performance

### Error Handling Overhead
- **Minimal Runtime Impact**: Error handlers only active during errors
- **Efficient Logging**: Batched error reports
- **Memory Management**: Automatic cleanup of old error logs
- **Lazy Loading**: Error components loaded on demand

### Optimization Strategies
```typescript
// Debounced error reporting
const debouncedErrorReport = debounce((errors: Error[]) => {
  reportErrors(errors)
}, 1000)

// Error deduplication
const deduplicateErrors = (errors: Error[]) => {
  const seen = new Set()
  return errors.filter(error => {
    const key = `${error.name}:${error.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
```

## Configuration

### Error Handling Settings
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      errorReporting: {
        enabled: true,
        endpoint: '/api/errors',
        maxRetries: 3,
        batchSize: 10
      }
    }
  }
})
```

### Environment-Specific Behavior
```typescript
const isDevelopment = process.env.NODE_ENV === 'development'

const handleError = (error: Error) => {
  if (isDevelopment) {
    // Show detailed error in development
    console.error('Detailed error:', error)
    showDetailedError(error)
  } else {
    // Show user-friendly error in production
    showUserFriendlyError(error)
    reportError(error)
  }
}
```

## Best Practices

### Error Handling Guidelines
1. **Fail Gracefully**: Always provide fallback behavior
2. **User-Friendly Messages**: Avoid technical jargon
3. **Actionable Errors**: Provide clear next steps
4. **Context Preservation**: Maintain user's work when possible
5. **Progressive Enhancement**: Work without JavaScript

### Code Examples
```typescript
// Good: Specific error handling
try {
  const data = await fetchUserData(userId)
  return data
} catch (error) {
  if (error.status === 404) {
    throw new UserNotFoundError(`User ${userId} not found`)
  } else if (error.status === 403) {
    throw new PermissionError('Access denied')
  } else {
    throw new NetworkError('Failed to fetch user data')
  }
}

// Good: Recovery actions
const handleError = (error: Error) => {
  const recovery = useErrorRecovery()
  recovery.handleError(error, 'network', {
    retryAction: () => fetchUserData(userId),
    fallbackAction: () => showCachedData(),
    escalationAction: () => contactSupport()
  })
}
```

## Troubleshooting

### Common Issues
1. **Errors Not Caught**: Check error boundary placement
2. **Recovery Not Working**: Verify recovery action implementation
3. **Performance Issues**: Check error logging frequency
4. **User Confusion**: Review error message clarity

### Debug Tools
```typescript
// Error debugging
window.debugErrors = () => {
  const stats = useErrorRecovery().getErrorStats()
  console.table(stats.recent)
}

// Error simulation
window.simulateError = (type: ErrorType) => {
  const error = new Error(`Simulated ${type} error`)
  useErrorRecovery().handleError(error, type)
}
```
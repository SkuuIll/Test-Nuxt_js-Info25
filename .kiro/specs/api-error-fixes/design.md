# Design Document

## Overview

Este documento describe el diseño técnico para corregir los errores de API y conexiones entre el backend Django y el frontend Nuxt.js. La solución se enfoca en estandarizar las APIs, mejorar el manejo de errores, corregir la autenticación y asegurar la consistencia en las respuestas.

## Architecture

### Backend API Structure
```
/api/v1/
├── posts/                    # Posts endpoints
│   ├── GET /                 # List posts (with pagination, filters)
│   ├── POST /                # Create post (staff only)
│   ├── GET /{id}/            # Get post by ID
│   ├── PUT /{id}/            # Update post (author/staff)
│   ├── DELETE /{id}/         # Delete post (author/staff)
│   ├── GET /featured/        # Featured posts
│   ├── GET /search/          # Search posts
│   └── GET /{id}/comments/   # Post comments
├── categories/               # Categories endpoints
│   ├── GET /                 # List categories
│   ├── GET /{id}/            # Get category by ID
│   └── GET /{id}/posts/      # Category posts
├── users/                    # User endpoints
│   └── auth/
│       ├── POST /login/      # User login
│       ├── POST /register/   # User registration
│       ├── POST /refresh/    # Token refresh
│       ├── POST /logout/     # User logout
│       └── GET /profile/     # User profile
└── dashboard/                # Dashboard endpoints
    ├── auth/
    │   ├── POST /login/      # Dashboard login
    │   ├── POST /refresh/    # Dashboard token refresh
    │   └── POST /logout/     # Dashboard logout
    ├── stats/                # Dashboard statistics
    └── api/                  # Dashboard CRUD operations
        ├── posts/            # Dashboard posts management
        ├── users/            # Dashboard users management
        └── comments/         # Dashboard comments management
```

### Frontend API Layer Structure
```
composables/
├── useApi.ts                 # Main API client
├── useAuth.ts                # User authentication
├── useDashboardAuth.ts       # Dashboard authentication
├── useDashboardPosts.ts      # Dashboard posts management
├── useDashboardUsers.ts      # Dashboard users management
└── useDashboardComments.ts   # Dashboard comments management
```

## Components and Interfaces

### 1. API Response Standardization

#### Standard API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  errors?: Record<string, string[]>  // Validation errors
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number
  next: string | null
  previous: string | null
  page_size: number
  current_page: number
}
```

#### Error Response Format
```typescript
interface ErrorResponse {
  success: false
  error: string
  message: string
  status_code: number
  details?: any
}
```

### 2. Authentication System

#### JWT Token Management
```typescript
interface AuthTokens {
  access: string
  refresh: string
  expires_in: number
}

interface TokenManager {
  getTokens(): AuthTokens | null
  setTokens(tokens: AuthTokens): void
  clearTokens(): void
  isTokenExpired(token: string): boolean
  refreshToken(): Promise<AuthTokens>
}
```

#### Authentication Flow
1. User provides credentials
2. Backend validates and returns JWT tokens
3. Frontend stores tokens securely
4. Automatic token refresh before expiration
5. Graceful logout on refresh failure

### 3. API Client Architecture

#### Base API Client
```typescript
class ApiClient {
  private baseURL: string
  private tokenManager: TokenManager
  
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>>
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>>
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>>
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>>
  async delete<T>(url: string): Promise<ApiResponse<T>>
}
```

#### Request Interceptors
- Add Authorization header automatically
- Handle token refresh on 401 errors
- Log requests in development mode
- Transform request data format

#### Response Interceptors
- Standardize response format
- Handle common error scenarios
- Log responses in development mode
- Transform response data format

### 4. Backend API Views Structure

#### Base API View Classes
```python
class StandardAPIView(APIView):
    """Base view with standardized response format"""
    
    def success_response(self, data=None, message=None, status=200):
        return Response({
            'success': True,
            'data': data,
            'message': message
        }, status=status)
    
    def error_response(self, error, message=None, status=400):
        return Response({
            'success': False,
            'error': error,
            'message': message or error
        }, status=status)
```

#### Pagination Class
```python
class StandardPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'success': True,
            'data': data,
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'page_size': self.page_size,
            'current_page': self.page.number
        })
```

## Data Models

### Post Model Serialization
```python
class PostSerializer(serializers.ModelSerializer):
    autor = UserBasicSerializer(read_only=True)
    categoria = CategorySerializer(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Post
        fields = [
            'id', 'titulo', 'contenido', 'imagen', 'status',
            'featured', 'autor', 'categoria', 'fecha_creacion',
            'fecha_publicacion', 'fecha_actualizacion', 'comments_count'
        ]
```

### User Model Serialization
```python
class UserSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    
    def get_permissions(self, obj):
        if hasattr(obj, 'dashboardpermission'):
            return DashboardPermissionSerializer(obj.dashboardpermission).data
        return None
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'permissions']
```

## Error Handling

### Backend Error Handling
```python
class APIErrorHandler:
    @staticmethod
    def handle_validation_error(serializer):
        return Response({
            'success': False,
            'error': 'Validation failed',
            'errors': serializer.errors
        }, status=400)
    
    @staticmethod
    def handle_not_found():
        return Response({
            'success': False,
            'error': 'Resource not found'
        }, status=404)
    
    @staticmethod
    def handle_permission_denied():
        return Response({
            'success': False,
            'error': 'Permission denied'
        }, status=403)
```

### Frontend Error Handling
```typescript
class ErrorHandler {
  static handleApiError(error: any): string {
    if (error.status === 401) return 'No autorizado'
    if (error.status === 403) return 'Sin permisos'
    if (error.status === 404) return 'Recurso no encontrado'
    if (error.status === 500) return 'Error del servidor'
    return error.data?.message || 'Error desconocido'
  }
  
  static showUserFriendlyError(error: any) {
    const message = this.handleApiError(error)
    // Show toast notification
    useToast().error('Error', message)
  }
}
```

## Testing Strategy

### Backend API Testing
1. **Unit Tests**: Test individual API views and serializers
2. **Integration Tests**: Test complete API workflows
3. **Authentication Tests**: Test JWT token lifecycle
4. **Permission Tests**: Test access control

### Frontend API Testing
1. **Composable Tests**: Test API composables with mocked responses
2. **Error Handling Tests**: Test error scenarios
3. **Authentication Flow Tests**: Test login/logout/refresh flows
4. **E2E Tests**: Test complete user workflows

### Test Data Management
- Use factories for consistent test data
- Mock external dependencies
- Test with various user permission levels
- Test pagination and filtering

## Implementation Phases

### Phase 1: Backend API Standardization
1. Fix URL routing inconsistencies
2. Standardize response formats
3. Implement proper error handling
4. Fix authentication endpoints

### Phase 2: Frontend API Client
1. Update useApi composable
2. Implement proper error handling
3. Fix authentication flows
4. Update dashboard composables

### Phase 3: Dashboard Integration
1. Fix dashboard authentication
2. Implement dashboard CRUD operations
3. Fix statistics endpoints
4. Test dashboard workflows

### Phase 4: Testing and Validation
1. Comprehensive API testing
2. Frontend integration testing
3. User acceptance testing
4. Performance optimization

## Security Considerations

### CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only in development
```

### JWT Security
- Short access token lifetime (15-60 minutes)
- Longer refresh token lifetime (7 days)
- Token rotation on refresh
- Blacklist tokens on logout

### API Security
- Rate limiting on authentication endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection in responses
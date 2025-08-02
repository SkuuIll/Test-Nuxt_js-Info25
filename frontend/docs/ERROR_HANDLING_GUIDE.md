# Error Handling Guide

Guía completa del sistema de manejo y recuperación de errores.

## 🎯 Descripción General

El sistema de manejo de errores proporciona captura automática, clasificación inteligente y recuperación automática de errores en toda la aplicación. Incluye un Error Boundary, manejo global de errores y páginas de error personalizadas.

## 🚀 Inicio Rápido

### Uso Básico
```typescript
// En cualquier componente
const { handleError, clearError, hasError } = useErrorRecovery()

try {
  await operacionRiesgosa()
} catch (error) {
  handleError(error, 'Contexto de la operación')
}
```

### Error Boundary
```vue
<template>
  <ErrorBoundary>
    <ComponenteQuePodriaFallar />
  </ErrorBoundary>
</template>
```

## 📋 Tipos de Errores Manejados

### 🌐 NETWORK - Errores de Red
```typescript
// Detectado automáticamente
const networkError = { name: 'NetworkError' }
// O cuando navigator.onLine === false
```

**Acciones de Recuperación:**
- Reintentar operación
- Verificar conexión
- Reportar problema

### 🔌 API - Errores de Servidor
```typescript
// Errores HTTP con códigos de estado
const apiError = { 
  status: 500, 
  message: 'Internal Server Error' 
}
```

**Clasificación por Código:**
- `401` → AUTHENTICATION
- `403` → PERMISSION  
- `400-499` → VALIDATION
- `500+` → API

**Acciones de Recuperación:**
- Reintentar (para errores 5xx)
- Recargar página
- Ir al login (401)
- Reportar problema

### 🔐 AUTHENTICATION - Errores de Autenticación
```typescript
// Error 401 - Sesión expirada
const authError = { status: 401 }
```

**Acciones de Recuperación:**
- Redirigir al login
- Refrescar tokens
- Limpiar sesión

### 🚫 PERMISSION - Errores de Permisos
```typescript
// Error 403 - Acceso denegado
const permissionError = { status: 403 }
```

**Acciones de Recuperación:**
- Ir al inicio
- Contactar administrador
- Reportar problema

### ✅ VALIDATION - Errores de Validación
```typescript
// Errores de datos del usuario
const validationError = {
  status: 400,
  data: {
    errors: {
      email: ['Email es requerido'],
      password: ['Contraseña muy corta']
    }
  }
}
```

**Acciones de Recuperación:**
- Mostrar errores en formulario
- Guiar corrección de datos

### 💧 HYDRATION - Errores de Hidratación
```typescript
// Errores de SSR/hidratación
const hydrationError = new Error('Hydration mismatch')
```

**Acciones de Recuperación:**
- Recargar página
- Forzar renderizado cliente
- Reportar problema

### 💥 JAVASCRIPT - Errores de Runtime
```typescript
// Errores de JavaScript
const jsError = new Error('Cannot read property of undefined')
```

**Acciones de Recuperación:**
- Reintentar operación
- Recargar página
- Reportar problema

## 🔧 API Completa

### Composable useErrorRecovery()

```typescript
interface ErrorRecoveryAPI {
  // Estado
  hasError: Readonly<Ref<boolean>>
  errorMessage: Readonly<Ref<string>>
  retryCount: Readonly<Ref<number>>
  isRecovering: Readonly<Ref<boolean>>
  recoveryActions: Readonly<Ref<RecoveryAction[]>>
  
  // Métodos principales
  handleError(error: any, context?: string): AppError
  clearError(): void
  attemptRecovery(error: AppError): Promise<void>
  
  // Utilidades
  getErrorStats(): ErrorStats
  classifyError(error: any): ErrorType
  extractErrorMessage(error: any): string
}
```

### Configuración
```typescript
const errorRecovery = useErrorRecovery({
  enableAutoRecovery: true,      // Recuperación automática
  maxRetryAttempts: 3,           // Máximo reintentos
  retryDelay: 1000,              // Delay entre reintentos (ms)
  enableErrorReporting: true,    // Reportar errores al backend
  enableUserFeedback: true       // Permitir feedback del usuario
})
```

## 🎭 Casos de Uso Comunes

### 1. Manejo de Errores de API
```typescript
const { handleError } = useErrorRecovery()

const fetchData = async () => {
  try {
    const response = await api.getData()
    return response.data
  } catch (error) {
    // El error se clasifica automáticamente y se muestran acciones apropiadas
    handleError(error, 'Fetching user data')
    throw error // Re-throw si necesitas manejar localmente
  }
}
```

### 2. Formularios con Validación
```typescript
const { handleError, clearError } = useErrorRecovery()

const submitForm = async (formData) => {
  clearError() // Limpiar errores previos
  
  try {
    await api.submitForm(formData)
    success('Formulario enviado')
  } catch (error) {
    if (error.status === 400) {
      // Error de validación - se muestran los campos con error
      handleError(error, 'Form validation')
    } else {
      // Otros errores - se muestran acciones de recuperación
      handleError(error, 'Form submission')
    }
  }
}
```

### 3. Operaciones con Retry Automático
```typescript
const { handleError } = useErrorRecovery({
  enableAutoRecovery: true,
  maxRetryAttempts: 3,
  retryDelay: 1000
})

const uploadFile = async (file) => {
  try {
    return await api.uploadFile(file)
  } catch (error) {
    // Se reintentará automáticamente hasta 3 veces
    handleError(error, 'File upload')
    throw error
  }
}
```

### 4. Error Boundary para Componentes
```vue
<template>
  <ErrorBoundary 
    :auto-recover="true"
    :max-retries="2"
    :enable-feedback="true"
    @error="onComponentError"
  >
    <ComplexComponent />
  </ErrorBoundary>
</template>

<script setup>
const onComponentError = (error) => {
  console.log('Component error captured:', error)
  // Opcional: logging adicional o acciones personalizadas
}
</script>
```

## 🎨 Personalización

### Acciones de Recuperación Personalizadas
```typescript
const { handleError } = useErrorRecovery()

// Personalizar acciones para un error específico
const customError = {
  ...error,
  customActions: [
    {
      label: 'Ir a configuración',
      action: () => navigateTo('/settings'),
      type: 'primary'
    },
    {
      label: 'Contactar soporte',
      action: () => window.open('/support'),
      type: 'secondary'
    }
  ]
}

handleError(customError, 'Custom error context')
```

### Mensajes de Error Personalizados
```typescript
const customErrorMessages = {
  NETWORK: 'Problemas de conexión detectados',
  API: 'El servidor está experimentando problemas',
  AUTHENTICATION: 'Tu sesión ha expirado',
  // ...
}

const { handleError } = useErrorRecovery({
  customMessages: customErrorMessages
})
```

## 🔍 Monitoreo y Estadísticas

### Obtener Estadísticas
```typescript
const { getErrorStats } = useErrorRecovery()

const stats = getErrorStats()
console.log('Error Statistics:', {
  total: stats.total,
  byType: stats.byType,
  bySeverity: stats.bySeverity,
  recent: stats.recent
})
```

### Estadísticas Disponibles
```typescript
interface ErrorStats {
  total: number
  byType: Record<ErrorType, number>
  bySeverity: Record<Severity, number>
  recent: AppError[]
}
```

### Página de Monitoreo
Visita `/test-error-handling` para:
- Ver estadísticas en tiempo real
- Probar diferentes tipos de errores
- Verificar acciones de recuperación
- Monitorear rendimiento del sistema

## 🚨 Plugin Global de Errores

### Configuración Automática
El plugin se configura automáticamente y captura:

```typescript
// Errores de Vue
nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
  handleError(error, `Vue Error: ${info}`)
}

// Promise rejections no manejadas
window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason, 'Unhandled Promise Rejection')
})

// Errores de JavaScript
window.addEventListener('error', (event) => {
  handleError(event.error, 'JavaScript Error')
})
```

### Desactivar Captura Global
```typescript
// En nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      errorHandling: {
        enableGlobalCapture: false
      }
    }
  }
})
```

## 📄 Página de Error Personalizada

### Características
- Diseño responsive y atractivo
- Mensajes contextuales por tipo de error
- Sugerencias útiles para el usuario
- Búsqueda integrada (para errores 404)
- Enlaces a páginas populares
- Botón de reporte de problemas

### Personalización
```vue
<!-- error.vue -->
<template>
  <div class="error-page">
    <!-- Tu diseño personalizado -->
  </div>
</template>

<script setup>
// Props automáticas del error
const props = defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
}>()
</script>
```

## 🔄 Recuperación Automática

### Estrategias por Tipo de Error

#### Errores de Red
1. Verificar conectividad
2. Reintentar con backoff exponencial
3. Mostrar estado offline
4. Reanudar cuando vuelva la conexión

#### Errores de API
1. Reintentar para errores 5xx
2. Refrescar tokens para 401
3. Redirigir para 403
4. Mostrar validación para 400

#### Errores de Hidratación
1. Forzar renderizado cliente
2. Recargar página si persiste
3. Reportar para análisis

### Configurar Recuperación
```typescript
const { handleError } = useErrorRecovery({
  enableAutoRecovery: true,
  recoveryStrategies: {
    NETWORK: {
      maxRetries: 5,
      retryDelay: 2000,
      backoffMultiplier: 1.5
    },
    API: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    }
  }
})
```

## 🐛 Debugging

### Modo Desarrollo
```typescript
// Información adicional en desarrollo
if (process.env.NODE_ENV === 'development') {
  const errorDetails = {
    stack: error.stack,
    componentTrace: info,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  }
  console.error('Detailed Error Info:', errorDetails)
}
```

### Herramientas de Debug
```typescript
// En consola del navegador (desarrollo)
window.__errorDebug = {
  stats: () => getErrorStats(),
  clear: () => clearErrorHistory(),
  simulate: (type) => simulateError(type),
  test: () => runErrorTests()
}
```

## 📊 Mejores Prácticas

### ✅ Hacer
```typescript
// Proporcionar contexto útil
handleError(error, 'User profile update - step 2 of 3')

// Limpiar errores cuando sea apropiado
onBeforeRouteLeave(() => {
  clearError()
})

// Usar tipos específicos para mejor UX
if (error.status === 401) {
  // Manejar específicamente errores de autenticación
}
```

### ❌ Evitar
```typescript
// Contexto genérico o sin contexto
handleError(error) // ❌
handleError(error, 'error') // ❌

// Manejar todos los errores igual
catch (error) {
  showError('Error') // ❌ Muy genérico
}

// No limpiar errores
// Los errores se acumulan y confunden al usuario
```

## 🔗 Integración con Otros Sistemas

### Con Sistema de Toast
```typescript
// Los errores automáticamente muestran toasts apropiados
const { handleError } = useErrorRecovery()
const { success } = useToast()

try {
  await operation()
  success('Operación exitosa')
} catch (error) {
  // Automáticamente muestra toast de error con acciones
  handleError(error, 'Operation context')
}
```

### Con Stores Pinia
```typescript
// En un store
export const useDataStore = defineStore('data', () => {
  const { handleError } = useErrorRecovery()
  
  const fetchData = async () => {
    try {
      const data = await api.getData()
      return data
    } catch (error) {
      handleError(error, 'Data store - fetch data')
      throw error
    }
  }
  
  return { fetchData }
})
```

## 📚 Recursos Adicionales

- [Documentación completa](./APP_FIXES_DOCUMENTATION.md)
- [Página de pruebas](/test-error-handling)
- [Código fuente](../composables/useErrorRecovery.ts)
- [Tests](../tests/composables/useErrorRecovery.test.ts)

---

¡El sistema de manejo de errores está listo para mantener tu aplicación estable! 🛡️
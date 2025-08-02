# Media Error Handling Guide

Guía completa del sistema de manejo de errores de archivos multimedia.

## 🎯 Descripción General

El sistema de manejo de errores de medios proporciona fallbacks automáticos, recuperación inteligente y monitoreo de rendimiento para todas las imágenes y archivos multimedia de la aplicación.

## 🚀 Inicio Rápido

### Componente EnhancedImage
```vue
<template>
  <EnhancedImage
    src="/mi-imagen.jpg"
    alt="Descripción de la imagen"
    fallback-src="/placeholder.jpg"
    :retry-attempts="3"
    :show-retry-button="true"
  />
</template>
```

### Composable useMediaErrorHandler
```typescript
const {
  handleMediaError,
  testImageLoad,
  getErrorStats
} = useMediaErrorHandler({
  retryAttempts: 3,
  retryDelay: 1000,
  enableLogging: true
})
```

## 📋 Tipos de Errores de Medios

### 🔧 IPX - Errores de Optimización
```typescript
// URLs IPX que fallan en optimización
const ipxUrl = '/_ipx/f_webp/w_300/imagen.jpg'
```

**Estrategia de Recuperación:**
1. Detectar URL IPX automáticamente
2. Extraer URL original sin optimización
3. Cargar imagen original como fallback
4. Reportar fallo de optimización

### 🌐 NETWORK - Errores de Red
```typescript
// Detectado cuando navigator.onLine === false
// O cuando falla la carga por conectividad
```

**Estrategia de Recuperación:**
1. Reintentar con backoff exponencial
2. Verificar conectividad
3. Usar imagen en caché si disponible
4. Mostrar placeholder de "sin conexión"

### 🚫 NOT_FOUND - Imagen No Encontrada
```typescript
// Imagen con naturalWidth === 0 && naturalHeight === 0
// O error 404 del servidor
```

**Estrategia de Recuperación:**
1. Intentar fallback personalizado
2. Usar fallback contextual (avatar, post, etc.)
3. Generar placeholder dinámico
4. Mostrar mensaje de "imagen no disponible"

### 🔒 CORS - Errores de Permisos
```typescript
// Imágenes de dominios externos sin CORS
const corsUrl = 'https://external-domain.com/image.jpg'
```

**Estrategia de Recuperación:**
1. Usar proxy si está configurado
2. Fallback a imagen local
3. Mostrar placeholder con mensaje de permisos

### ❓ UNKNOWN - Errores Desconocidos
```typescript
// Cualquier otro tipo de error de carga
```

**Estrategia de Recuperación:**
1. Aplicar estrategias genéricas
2. Usar fallback por defecto
3. Reportar para análisis

## 🎨 Componente EnhancedImage

### Props Completas
```typescript
interface EnhancedImageProps {
  // Básicas
  src: string
  alt: string
  fallbackSrc?: string
  
  // Diseño
  aspectRatio?: string
  containerClass?: string
  imageClass?: string
  width?: number | string
  height?: number | string
  sizes?: string
  srcset?: string
  
  // Comportamiento
  lazyLoading?: boolean
  retryAttempts?: number
  retryDelay?: number
  showRetryButton?: boolean
  showReportButton?: boolean
  fadeInOnLoad?: boolean
  
  // UI
  showLoadingText?: boolean
  loadingText?: string
  errorMessage?: string
  
  // Debug
  showDebugInfo?: boolean
  
  // Callbacks
  onErrorReport?: (error: ErrorReport) => void
}
```

### Eventos
```typescript
interface EnhancedImageEvents {
  load: [event: Event]           // Imagen cargada exitosamente
  error: [error: Event]          // Error de carga
  click: [event: Event]          // Click en imagen
  retry: [attempt: number]       // Intento de retry
  fallback: [fallbackSrc: string] // Usando fallback
}
```

### Ejemplos de Uso

#### Imagen Básica con Fallback
```vue
<EnhancedImage
  src="/imagen-principal.jpg"
  alt="Imagen principal del artículo"
  fallback-src="/placeholder-articulo.jpg"
/>
```

#### Imagen con Retry Personalizado
```vue
<EnhancedImage
  src="/imagen-importante.jpg"
  alt="Imagen importante"
  :retry-attempts="5"
  :retry-delay="2000"
  :show-retry-button="true"
  error-message="Error al cargar imagen importante"
/>
```

#### Avatar con Contexto
```vue
<EnhancedImage
  src="/avatars/usuario-123.jpg"
  alt="Avatar de usuario"
  container-class="w-12 h-12 rounded-full"
  image-class="w-full h-full object-cover"
  aspect-ratio="1/1"
/>
```

#### Imagen con Acciones Personalizadas
```vue
<EnhancedImage
  src="/imagen-critica.jpg"
  alt="Imagen crítica"
  :show-report-button="true"
  :on-error-report="handleErrorReport"
  @error="onImageError"
  @fallback="onFallbackUsed"
/>

<script setup>
const handleErrorReport = (report) => {
  console.log('Error report:', report)
  // Enviar reporte al sistema de monitoreo
}

const onImageError = (error) => {
  console.log('Image error:', error)
  // Logging personalizado
}

const onFallbackUsed = (fallbackSrc) => {
  console.log('Using fallback:', fallbackSrc)
  // Métricas de fallback
}
</script>
```

## 🔧 Composable useMediaErrorHandler

### API Completa
```typescript
interface MediaErrorHandlerAPI {
  // Estado
  errorHistory: Readonly<Ref<MediaError[]>>
  retryCount: Readonly<Ref<number>>
  isRetrying: Readonly<Ref<boolean>>
  
  // Métodos principales
  handleMediaError(src: string, event?: Event, context?: string): Promise<string | null>
  retryWithBackoff(src: string): Promise<string | null>
  testImageLoad(src: string): Promise<boolean>
  
  // Utilidades
  resetErrorState(): void
  getErrorStats(): ErrorStats
  preloadImages(srcs: string[]): Promise<void>
  
  // Clasificación
  classifyError(src: string, event?: Event): ErrorType
  generateFallbackStrategies(src: string, context?: string): FallbackStrategy[]
  getErrorMessage(errorType: ErrorType): string
}
```

### Configuración
```typescript
const mediaErrorHandler = useMediaErrorHandler({
  retryAttempts: 3,              // Número de reintentos
  retryDelay: 1000,              // Delay base entre reintentos
  enableLogging: true,           // Habilitar logging
  onError: (error) => {          // Callback de error
    console.log('Media error:', error)
  },
  onRetry: (attempt) => {        // Callback de retry
    console.log('Retry attempt:', attempt)
  },
  onFallback: (fallbackSrc) => { // Callback de fallback
    console.log('Using fallback:', fallbackSrc)
  }
})
```

### Uso Manual
```typescript
const { handleMediaError, testImageLoad } = useMediaErrorHandler()

// Manejar error manualmente
const handleImageError = async (src, event) => {
  const fallbackSrc = await handleMediaError(src, event, 'User profile image')
  
  if (fallbackSrc) {
    console.log('Using fallback:', fallbackSrc)
  } else {
    console.log('All fallback strategies failed')
  }
}

// Probar si una imagen carga
const checkImage = async (src) => {
  const canLoad = await testImageLoad(src)
  console.log(`Image ${src} can load:`, canLoad)
}
```

## 🎭 Estrategias de Fallback

### 1. Fallback IPX
```typescript
// Para URLs IPX que fallan
const ipxUrl = '/_ipx/f_webp/w_300/imagen.jpg'
const originalUrl = '/imagen.jpg' // Extraído automáticamente
```

### 2. Fallback Personalizado
```typescript
// Fallback específico proporcionado por el desarrollador
<EnhancedImage
  src="/imagen-principal.jpg"
  fallback-src="/mi-fallback-personalizado.jpg"
/>
```

### 3. Fallback Contextual
```typescript
// Basado en el contexto de la imagen
const contextFallbacks = {
  avatar: '/images/default-avatar.svg',
  post: '/images/post-placeholder.svg',
  category: '/images/category-placeholder.svg',
  general: '/images/placeholder.svg'
}

// Detectado automáticamente por el alt text
<EnhancedImage
  src="/missing-avatar.jpg"
  alt="Avatar de usuario" // → Usa fallback de avatar
/>
```

### 4. Placeholder Generado
```typescript
// Placeholder dinámico como último recurso
const generatePlaceholder = (width, height, text) => {
  // Genera SVG con dimensiones y texto específicos
  return `data:image/svg+xml;base64,${encodedSvg}`
}
```

## 📊 Monitoreo Global

### Plugin de Monitoreo
El plugin captura automáticamente todos los errores de imágenes:

```typescript
// Configuración automática
document.addEventListener('error', (event) => {
  if (event.target instanceof HTMLImageElement) {
    handleGlobalImageError(event)
  }
}, true)
```

### Estadísticas Disponibles
```typescript
interface GlobalMediaStats {
  totalErrors: number
  errorsByType: Record<string, number>
  errorsByDomain: Record<string, number>
  recentErrors: MediaError[]
  performanceMetrics: {
    averageLoadTime: number
    slowestLoad: number
    fastestLoad: number
    totalLoads: number
    failureRate: number
  }
}
```

### Acceso a Estadísticas
```typescript
// En desarrollo
const stats = window.__mediaErrorDebug.stats()
console.log('Media Error Statistics:', stats)

// En código
const { $mediaError } = useNuxtApp()
const stats = $mediaError.getErrorStats()
```

### Insights de Rendimiento
```typescript
const insights = $mediaError.getPerformanceInsights()
// Ejemplo de insights:
// [
//   { type: 'warning', message: 'High failure rate: 15.2%' },
//   { type: 'error', message: 'Multiple IPX optimization failures: 8 errors' }
// ]
```

## 🔍 Debugging y Desarrollo

### Modo Debug
```vue
<EnhancedImage
  src="/test-image.jpg"
  alt="Test image"
  :show-debug-info="true"
/>
```

Muestra información como:
- URL actual
- Número de intentos
- Si es URL IPX
- Fallback usado

### Página de Pruebas
Visita `/test-media-errors` para:
- Probar diferentes tipos de errores
- Ver estadísticas en tiempo real
- Verificar estrategias de fallback
- Monitorear rendimiento

### Herramientas de Debug
```typescript
// En consola del navegador (desarrollo)
window.__mediaErrorDebug = {
  stats: () => getErrorStats(),
  insights: () => getPerformanceInsights(),
  clear: () => clearErrorHistory(),
  test: (src) => testImageLoad(src)
}
```

## ⚡ Optimizaciones de Rendimiento

### Lazy Loading Inteligente
```vue
<EnhancedImage
  src="/imagen-grande.jpg"
  alt="Imagen grande"
  :lazy-loading="true"
  loading="lazy"
/>
```

### Preloading de Imágenes Críticas
```typescript
const { preloadImages } = useMediaErrorHandler()

// Precargar imágenes importantes
await preloadImages([
  '/hero-image.jpg',
  '/logo.svg',
  '/critical-banner.jpg'
])
```

### Intersection Observer
```typescript
// Configurado automáticamente para lazy loading
const observer = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      // Iniciar carga de imagen
    }
  },
  { rootMargin: '50px' }
)
```

## 🎨 Personalización de UI

### Estados de Carga
```vue
<EnhancedImage
  src="/imagen.jpg"
  alt="Mi imagen"
  :show-loading-text="true"
  loading-text="Cargando imagen especial..."
/>
```

### Estados de Error
```vue
<EnhancedImage
  src="/imagen.jpg"
  alt="Mi imagen"
  error-message="No se pudo cargar la imagen del producto"
  :show-retry-button="true"
  :show-report-button="true"
/>
```

### Estilos Personalizados
```css
/* Personalizar placeholder de carga */
.image-placeholder.loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

/* Personalizar estado de error */
.image-placeholder.error {
  border: 2px dashed #ef4444;
  background-color: #fef2f2;
}

/* Animación de fade-in */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
```

## 📱 Responsive Images

### Srcset y Sizes
```vue
<EnhancedImage
  src="/imagen-base.jpg"
  srcset="/imagen-small.jpg 480w, /imagen-medium.jpg 768w, /imagen-large.jpg 1200w"
  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
  alt="Imagen responsive"
/>
```

### Aspect Ratio
```vue
<EnhancedImage
  src="/imagen.jpg"
  alt="Imagen con ratio fijo"
  aspect-ratio="16/9"
  container-class="w-full"
/>
```

## 🔗 Integración con Otros Sistemas

### Con Sistema de Toast
```typescript
// Los errores de medios automáticamente muestran toasts
const onImageError = (error) => {
  // Toast automático basado en tipo de error
  // IPX error → "Error de optimización de imagen"
  // Network error → "Error de conexión"
  // etc.
}
```

### Con Sistema de Errores Global
```typescript
// Los errores de medios se reportan al sistema global
const { handleError } = useErrorRecovery()

const onMediaError = (mediaError) => {
  // Automáticamente clasificado y manejado
  handleError(mediaError, 'Media loading')
}
```

## 📊 Mejores Prácticas

### ✅ Hacer
```vue
<!-- Proporcionar alt text descriptivo -->
<EnhancedImage
  src="/producto-123.jpg"
  alt="Zapatos deportivos Nike Air Max en color azul"
  fallback-src="/placeholder-producto.jpg"
/>

<!-- Usar aspect ratio para evitar layout shift -->
<EnhancedImage
  src="/banner.jpg"
  alt="Banner promocional"
  aspect-ratio="21/9"
/>

<!-- Configurar retry apropiado para imágenes críticas -->
<EnhancedImage
  src="/logo-empresa.svg"
  alt="Logo de la empresa"
  :retry-attempts="5"
  :show-retry-button="true"
/>
```

### ❌ Evitar
```vue
<!-- Alt text genérico o vacío -->
<EnhancedImage
  src="/imagen.jpg"
  alt="imagen" <!-- ❌ Muy genérico -->
/>

<!-- Sin fallback para imágenes importantes -->
<EnhancedImage
  src="/imagen-critica.jpg"
  alt="Imagen crítica"
  <!-- ❌ Sin fallback-src -->
/>

<!-- Retry excesivo para imágenes no críticas -->
<EnhancedImage
  src="/decoracion.jpg"
  alt="Imagen decorativa"
  :retry-attempts="10" <!-- ❌ Excesivo -->
/>
```

## 🚀 Casos de Uso Avanzados

### Galería de Imágenes
```vue
<template>
  <div class="gallery">
    <EnhancedImage
      v-for="image in images"
      :key="image.id"
      :src="image.src"
      :alt="image.alt"
      :fallback-src="image.fallback"
      container-class="gallery-item"
      :lazy-loading="true"
      @error="onGalleryImageError"
    />
  </div>
</template>

<script setup>
const onGalleryImageError = (error) => {
  // Manejar errores específicos de galería
  console.log('Gallery image error:', error)
}
</script>
```

### Avatar con Iniciales
```vue
<template>
  <div class="avatar-container">
    <EnhancedImage
      :src="user.avatar"
      :alt="`Avatar de ${user.name}`"
      :fallback-src="generateInitialsAvatar(user.name)"
      container-class="w-12 h-12 rounded-full"
      aspect-ratio="1/1"
    />
  </div>
</template>

<script setup>
const generateInitialsAvatar = (name) => {
  const initials = name.split(' ').map(n => n[0]).join('')
  return `data:image/svg+xml,${encodeURIComponent(createInitialsSvg(initials))}`
}
</script>
```

## 📚 Recursos Adicionales

- [Documentación completa](./APP_FIXES_DOCUMENTATION.md)
- [Página de pruebas](/test-media-errors)
- [Código fuente](../components/EnhancedImage.vue)
- [Tests](../tests/components/EnhancedImage-improved.test.ts)

---

¡El sistema de manejo de errores de medios está listo para mantener tus imágenes siempre disponibles! 🖼️
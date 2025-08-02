# Toast System Guide

Guía completa del sistema de notificaciones toast consolidado.

## 🎯 Descripción General

El sistema de toast ha sido completamente reescrito para eliminar conflictos y proporcionar una experiencia de usuario consistente. Reemplaza `vue-toastification` con una implementación personalizada más robusta.

## 🚀 Inicio Rápido

### Uso Básico
```typescript
// En cualquier componente Vue
const { success, error, warning, info } = useToast()

// Mostrar diferentes tipos de toast
success('¡Operación completada exitosamente!')
error('Error al procesar la solicitud')
warning('Esta acción no se puede deshacer')
info('Nueva actualización disponible')
```

### Toast Personalizado
```typescript
const { showToast } = useToast()

showToast({
  type: 'success',
  title: 'Título personalizado',
  message: 'Mensaje detallado con más información',
  duration: 5000,
  persistent: false,
  actions: [
    {
      label: 'Ver detalles',
      action: () => navigateTo('/details'),
      style: 'primary'
    },
    {
      label: 'Descartar',
      action: () => console.log('Descartado'),
      style: 'secondary'
    }
  ]
})
```

## 📋 API Completa

### Composable useToast()

#### Métodos Básicos
```typescript
interface ToastMethods {
  // Métodos de conveniencia
  success(message: string, title?: string): string
  error(message: string, title?: string): string
  warning(message: string, title?: string): string
  info(message: string, title?: string): string
  
  // Método principal
  showToast(options: ToastOptions): string
  
  // Control de toasts
  remove(id: string): void
  clear(): void
  
  // Métodos específicos para autenticación
  authSuccess(message?: string): string
  authError(message?: string): string
}
```

#### Opciones de Toast
```typescript
interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number        // Duración en ms (0 = no auto-cerrar)
  persistent?: boolean     // Si true, no se cierra automáticamente
  actions?: ToastAction[]  // Botones de acción
}

interface ToastAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary'
}
```

## 🎨 Personalización

### Configuración del Contenedor
```vue
<!-- En tu layout principal -->
<ToastContainer 
  :max-toasts="5"
  :default-duration="5000"
  position="top-right"
/>
```

### Estilos Personalizados
```css
/* Personalizar colores de toast */
.toast-notification.success {
  @apply bg-green-50 border-green-400;
}

.toast-notification.error {
  @apply bg-red-50 border-red-400;
}

/* Personalizar animaciones */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}
```

## 🔧 Configuración Avanzada

### Toast con Acciones
```typescript
const { showToast } = useToast()

// Toast de confirmación
showToast({
  type: 'warning',
  title: 'Confirmar eliminación',
  message: '¿Estás seguro de que quieres eliminar este elemento?',
  persistent: true,
  actions: [
    {
      label: 'Eliminar',
      style: 'primary',
      action: async () => {
        await deleteItem()
        success('Elemento eliminado')
      }
    },
    {
      label: 'Cancelar',
      style: 'secondary',
      action: () => info('Operación cancelada')
    }
  ]
})
```

### Toast de Progreso
```typescript
// Mostrar progreso de operación
const progressToastId = showToast({
  type: 'info',
  title: 'Subiendo archivo...',
  message: 'Por favor espera mientras se sube el archivo',
  persistent: true
})

// Actualizar cuando termine
uploadFile().then(() => {
  remove(progressToastId)
  success('Archivo subido exitosamente')
}).catch(() => {
  remove(progressToastId)
  error('Error al subir archivo')
})
```

## 🎭 Casos de Uso Comunes

### 1. Feedback de Formularios
```typescript
// En un componente de formulario
const { success, error } = useToast()

const submitForm = async () => {
  try {
    await api.submitForm(formData)
    success('Formulario enviado correctamente')
    router.push('/success')
  } catch (err) {
    error('Error al enviar formulario', 'Por favor intenta nuevamente')
  }
}
```

### 2. Notificaciones de Autenticación
```typescript
// Login exitoso
const { authSuccess, authError } = useToast()

const login = async (credentials) => {
  try {
    await authStore.login(credentials)
    authSuccess('¡Bienvenido de vuelta!')
  } catch (err) {
    authError('Credenciales incorrectas')
  }
}
```

### 3. Operaciones CRUD
```typescript
const { success, error, warning } = useToast()

// Crear
const create = async (data) => {
  try {
    await api.create(data)
    success('Elemento creado exitosamente')
  } catch (err) {
    error('Error al crear elemento')
  }
}

// Eliminar con confirmación
const deleteWithConfirmation = (id) => {
  showToast({
    type: 'warning',
    title: 'Confirmar eliminación',
    message: 'Esta acción no se puede deshacer',
    persistent: true,
    actions: [
      {
        label: 'Eliminar',
        style: 'primary',
        action: () => performDelete(id)
      },
      {
        label: 'Cancelar',
        style: 'secondary',
        action: () => info('Eliminación cancelada')
      }
    ]
  })
}
```

### 4. Notificaciones de Sistema
```typescript
// Notificación de mantenimiento
showToast({
  type: 'warning',
  title: 'Mantenimiento programado',
  message: 'El sistema estará en mantenimiento mañana de 2-4 AM',
  duration: 10000,
  actions: [
    {
      label: 'Más información',
      action: () => window.open('/maintenance-info'),
      style: 'primary'
    }
  ]
})
```

## 🔍 Debugging y Desarrollo

### Modo Debug
```typescript
// En desarrollo, puedes acceder a estadísticas
if (process.env.NODE_ENV === 'development') {
  const toastStats = window.__toastDebug?.stats()
  console.log('Toast Statistics:', toastStats)
}
```

### Página de Pruebas
Visita `/test-toast` para probar todas las funcionalidades del sistema.

## ⚡ Rendimiento

### Optimizaciones Implementadas
- **Límite de toasts**: Máximo 5 toasts simultáneos
- **Cleanup automático**: Toasts antiguos se eliminan automáticamente
- **Animaciones optimizadas**: CSS transforms para mejor rendimiento
- **Event bus eficiente**: Comunicación optimizada entre componentes

### Mejores Prácticas
```typescript
// ✅ Bueno: Usar métodos de conveniencia
success('Operación exitosa')

// ❌ Evitar: Toast excesivamente largos
showToast({
  message: 'Este es un mensaje extremadamente largo que podría no caber bien en la pantalla y causar problemas de UX...'
})

// ✅ Bueno: Limpiar toasts cuando sea apropiado
const { clear } = useToast()
onBeforeRouteLeave(() => {
  clear() // Limpiar toasts al cambiar de página
})
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### Toast no aparece
```typescript
// Verificar que ToastContainer esté en el layout
// layouts/default.vue
<template>
  <div>
    <slot />
    <ToastContainer />
  </div>
</template>
```

#### Múltiples toasts del mismo tipo
```typescript
// Usar IDs para controlar toasts duplicados
let currentToastId = null

const showUniqueToast = (message) => {
  if (currentToastId) {
    remove(currentToastId)
  }
  currentToastId = success(message)
}
```

#### Toasts no se cierran
```typescript
// Verificar configuración de duración
showToast({
  message: 'Toast persistente',
  duration: 0, // 0 = no se cierra automáticamente
  persistent: true
})
```

## 🔄 Migración desde vue-toastification

### Antes (vue-toastification)
```typescript
// Código anterior
this.$toast.success('Mensaje')
this.$toast.error('Error')
```

### Después (Sistema consolidado)
```typescript
// Código nuevo
const { success, error } = useToast()
success('Mensaje')
error('Error')
```

### Cambios Principales
- ✅ **Sin conflictos** - Un solo proveedor de toast
- ✅ **Mejor TypeScript** - Tipado completo
- ✅ **Más funcionalidades** - Acciones, persistencia, etc.
- ✅ **Mejor rendimiento** - Optimizaciones implementadas

## 📚 Recursos Adicionales

- [Documentación completa](./APP_FIXES_DOCUMENTATION.md)
- [Página de pruebas](/test-toast)
- [Código fuente](../components/ToastContainer.vue)
- [Tests](../tests/components/ToastContainer-improved.test.ts)

---

¡El sistema de toast está listo para usar en producción! 🎉
# Credenciales de Login - Sistema Configurado

## ✅ Usuarios Creados y Listos

### 🔑 **Usuario Administrador**
```
URL: http://localhost:3002/login
Username: admin
Password: admin123
Permisos: Acceso completo al dashboard y admin
```

### 👤 **Usuario Regular**
```
URL: http://localhost:3002/login
Username: usuario
Password: usuario123
Permisos: Acceso limitado (solo lectura)
```

## 🚀 **URLs Importantes**

### Frontend (Nuxt)
- **Página principal**: http://localhost:3002/
- **Login**: http://localhost:3002/login
- **Admin Panel**: http://localhost:3002/admin (requiere login)
- **Dashboard**: http://localhost:3002/dashboard (requiere permisos)

### Backend (Django)
- **API Base**: http://localhost:8000/api/v1/
- **Django Admin**: http://localhost:8000/admin/
- **Dashboard API**: http://localhost:8000/api/v1/dashboard/

## 🔍 **Sistema de Logging Activo**

### Panel de Debug
- **Atajo**: `Ctrl/Cmd + Shift + D`
- **Botón**: 🐛 (esquina inferior derecha)
- **DevTools**: `Shift + Alt + D`

### Logs Visibles
- ✅ Requests de API con detalles
- ✅ Errores de autenticación
- ✅ Respuestas del servidor
- ✅ Tokens y estado de sesión
- ✅ Cambios de ruta y navegación

## 🧪 **Cómo Probar el Login**

### Paso 1: Ir a Login
```
http://localhost:3002/login
```

### Paso 2: Usar Credenciales
```
Usuario: admin
Contraseña: admin123
```

### Paso 3: Verificar Logs
- Abre la consola del navegador (F12)
- Abre el panel de debug (`Ctrl/Cmd + Shift + D`)
- Observa los logs durante el proceso de login

### Paso 4: Acceder al Admin
Después del login exitoso:
```
http://localhost:3002/admin
```

## 🔧 **Logs Esperados Durante Login**

```
🔐 Iniciando login con: { username: "admin" }
🔗 API Request: POST http://localhost:8000/api/v1/users/auth/login/ { username: "admin", password: "***" }
✅ Login exitoso, respuesta recibida: { access: "...", refresh: "..." }
💾 Tokens guardados en localStorage
👤 Obteniendo perfil de usuario...
📡 Obteniendo perfil de usuario...
✅ Perfil obtenido: { username: "admin", isStaff: true, email: "admin@test.com" }
🎉 Autenticación completada exitosamente
```

## 🚨 **Posibles Problemas y Soluciones**

### Error 401 - No autorizado
- ✅ **Verificar**: Credenciales correctas
- ✅ **Verificar**: Backend Django corriendo en puerto 8000
- ✅ **Verificar**: Usuario existe en la base de datos

### Error 403 - Acceso denegado
- ✅ **Verificar**: Usuario tiene permisos de staff
- ✅ **Verificar**: DashboardPermission configurado

### Error de conexión
- ✅ **Verificar**: Backend Django corriendo
- ✅ **Verificar**: CORS configurado correctamente
- ✅ **Verificar**: URLs de API correctas

### Token inválido
- ✅ **Solución**: Limpiar localStorage y volver a hacer login
- ✅ **Comando**: `localStorage.clear()` en consola del navegador

## 🎯 **Flujo de Autenticación**

1. **Usuario ingresa credenciales** → `/login`
2. **Frontend envía request** → `POST /api/v1/users/auth/login/`
3. **Backend valida credenciales** → Django Auth
4. **Backend retorna tokens** → JWT Access + Refresh
5. **Frontend guarda tokens** → localStorage
6. **Frontend obtiene perfil** → `GET /api/v1/users/auth/profile/`
7. **Frontend actualiza estado** → Pinia Store
8. **Redirección exitosa** → `/admin` o página solicitada

## 📊 **Estado Actual del Sistema**

- ✅ **Backend Django**: Corriendo y funcional
- ✅ **Frontend Nuxt**: Corriendo en puerto 3002
- ✅ **Base de datos**: Configurada con usuarios
- ✅ **API Endpoints**: Funcionando correctamente
- ✅ **Sistema de logging**: Activo y capturando eventos
- ✅ **Autenticación JWT**: Configurada y operativa
- ✅ **Middlewares**: Configurados para proteger rutas
- ✅ **Permisos**: Sistema de roles implementado

---

**¡Todo está listo para usar!** 🚀

Usa las credenciales `admin / admin123` para acceder al sistema completo.
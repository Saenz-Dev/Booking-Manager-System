# Configuración de Recuperación de Contraseña

## Estado Actual
La funcionalidad de recuperación de contraseña está **completamente implementada** en el frontend Angular.

### ✅ Componentes Implementados
1. **Componente Angular** (`recuperar-contrasena.ts`):
   - Paso 1: Solicitud de recuperación por email
   - Paso 2: Validación de token
   - Paso 3: Restablecer contraseña

2. **Template HTML** (`recuperar-contrasena.html`):
   - Interfaz de 3 pasos con validación visual
   - Contador de tiempo de expiración
   - Mostrar/ocultar contraseña
   - Indicadores de requisitos

3. **Servicio de Login** (`login.service.ts`):
   - `forgotPassword()` - POST `/login/forgot-password`
   - `verifyResetToken()` - GET `/login/verify-reset-token?token=`
   - `resetPassword()` - POST `/login/reset-password`

4. **Estilos CSS**:
   - Diseño responsive
   - Animaciones y transiciones
   - Mensajes de error/éxito

---

## Configuración del Backend

### Error Actual
```
EMAIL_SEND_FAILED: No se pudo enviar el correo de recuperación
```

**Causa**: El backend está en modo producción intentando enviar correos, pero SMTP no está configurado.

### Solución para Desarrollo

**En el backend** (`config/config.php`), cambiar a:

```php
// ✅ Modo Desarrollo: Devuelve token en la respuesta
define('RESET_TOKEN_RETURN_IN_RESPONSE', true);
```

Cuando está en `true`:
- El token se devuelve en la respuesta JSON
- El frontend lo recibe automáticamente
- No requiere SMTP configurado
- Perfecto para testing local

### Configuración para Producción

**En el backend** (`config/config.php`), cambiar a:

```php
// Modo Producción: Envía token por correo
define('RESET_TOKEN_RETURN_IN_RESPONSE', false);

// Configurar SMTP
define('EMAIL_SMTP_HOST', 'smtp.gmail.com');
define('EMAIL_SMTP_PORT', 587);
define('EMAIL_SMTP_AUTH', true);
define('EMAIL_SMTP_SECURE', 'tls');
define('EMAIL_SMTP_USERNAME', 'tu-email@gmail.com');
define('EMAIL_SMTP_PASSWORD', 'tu-contraseña-app'); // App password, no contraseña normal
define('EMAIL_FROM_ADDRESS', 'tu-email@gmail.com');
define('EMAIL_FROM_NAME', 'Microservices Reservas');
```

---

## Flujo Completo de Uso

### Paso 1: Solicitar Recuperación
```
Usuario → Ingresa email → Click "Enviar enlace"
↓
Backend: POST /login/forgot-password
↓
MODO DESARROLLO:
  Respuesta: { reset_token: "jwt...", expires_in: 900 }
  Frontend: Recibe token automáticamente
  
MODO PRODUCCIÓN:
  Respuesta: { message: "Revisa tu email" }
  Backend: Envía token por correo
```

### Paso 2: Validar Token
```
Frontend: GET /login/verify-reset-token?token=jwt
↓
Backend: Valida token
Respuesta: { correo: "user@example.com", expira_en_segundos: 892 }
```

### Paso 3: Restablecer Contraseña
```
Frontend: POST /login/reset-password
Body: { token: "jwt", nueva_contrasena: "MiPassword123" }
↓
Backend: Valida y actualiza contraseña
Respuesta: { message: "Contraseña actualizada exitosamente" }
↓
Frontend: Redirige a login
```

---

## Requisitos de Contraseña Validados

El frontend valida en tiempo real:
- ✓ Mínimo 6 caracteres
- ✓ Al menos 1 letra mayúscula
- ✓ Al menos 1 número

El backend también valida estos requisitos.

---

## Testing Local

### 1. Asegúrate de que el backend está corriendo:
```bash
# Backend debe estar escuchando en http://localhost/microservices/gateway/
```

### 2. Cambiar backend a modo desarrollo:
```php
define('RESET_TOKEN_RETURN_IN_RESPONSE', true);
```

### 3. Acceder a la página:
```
http://localhost:4200/recuperar-contrasena
```

### 4. Ingresar cualquier email válido:
```
saenzm963@gmail.com
```

### 5. El token se mostrará automáticamente (si el backend lo devuelve)

---

## URLs Endpoints

- **Base Gateway**: `http://localhost/microservices/gateway/`
- **Solicitar recuperación**: `POST /login/forgot-password`
- **Validar token**: `GET /login/verify-reset-token?token={token}`
- **Restablecer**: `POST /login/reset-password`

---

## Códigos de Error Esperados

| Código | Descripción |
|--------|-------------|
| `EMAIL_SEND_FAILED` | No se puede enviar correo (falta SMTP) |
| `EMAIL_CONFIGURATION_ERROR` | SMTP no configurado |
| `INVALID_PASSWORD` | Contraseña no cumple requisitos |
| `SAME_PASSWORD` | Nueva contraseña igual a la anterior |
| `INVALID_RESET_TOKEN` | Token inválido o expirado |

---

## Próximos Pasos

1. **✅ Comunicar al equipo del backend** que configure `RESET_TOKEN_RETURN_IN_RESPONSE = true` para desarrollo
2. **✅ O configurar SMTP en el backend** si quieres enviar correos reales
3. **✅ Probar el flujo completo** una vez el backend esté configurado
4. **Opcional**: Agregar pruebas unitarias/e2e

---

## Archivos Modificados

- `src/app/components/recuperar-contrasena/recuperar-contrasena.ts` - Lógica completa
- `src/app/components/recuperar-contrasena/recuperar-contrasena.html` - Interfaz 3 pasos
- `src/app/components/recuperar-contrasena/recuperar-contrasena.css` - Estilos
- `src/app/services/login.service.ts` - 3 nuevos métodos


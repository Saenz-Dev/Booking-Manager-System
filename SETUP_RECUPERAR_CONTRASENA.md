# 🔧 Guía de Configuración - Recuperación de Contraseña

## Estado Actual

✅ **Frontend Angular**: Completamente implementado y funcionando
❌ **Backend**: Necesita configuración en `config.php`

### Mensaje de Error Actual
```
El servidor no tiene configurado SMTP. 
Cambia RESET_TOKEN_RETURN_IN_RESPONSE a true en desarrollo.
```

**Código de Error**: `EMAIL_CONFIGURATION_ERROR`

---

## ✅ Lo que Está Funcionando en el Frontend

El sistema frontend tiene **3 pasos** implementados:

### Paso 1: Solicitar Recuperación de Contraseña
- ✓ Validación de email en cliente
- ✓ Envío POST a `/login/forgot-password`
- ✓ Manejo de errores específicos (EMAIL_SEND_FAILED, EMAIL_CONFIGURATION_ERROR, etc.)

### Paso 2: Validar Token de Recuperación
- ✓ Ingreso de token manualmente (en producción) o automático (en desarrollo)
- ✓ Validación GET a `/login/verify-reset-token?token=`
- ✓ Contador de tiempo en vivo (15 minutos)
- ✓ Manejo de tokens expirados

### Paso 3: Restablecer Contraseña
- ✓ Validación en tiempo real de requisitos
- ✓ Visualización de requisitos cumplidos
- ✓ POST a `/login/reset-password`
- ✓ Redireccionamiento automático a login tras éxito

---

## 🔴 Lo que Necesitas Hacer - Configurar el Backend

### Paso 1: Localiza el Archivo de Configuración

```bash
# En el backend (login-service)
nano config/config.php
# o
# c:\path\to\login-service\config\config.php
```

### Paso 2: Para Desarrollo (Recomendado para Testing)

Busca esta línea:
```php
define('RESET_TOKEN_RETURN_IN_RESPONSE', false);
```

**Cambialo a:**
```php
define('RESET_TOKEN_RETURN_IN_RESPONSE', true);
```

✅ **Ahora el sistema funcionará así:**
- El usuario solicita recuperación
- El backend devuelve el token en la respuesta JSON
- El frontend lo recibe automáticamente
- No requiere SMTP configurado
- Perfecto para testing local

### Paso 3: Reinicia el Backend

```bash
# Reinicia tu servidor web (Apache/Nginx) o PHP
sudo systemctl restart apache2
# o
sudo systemctl restart nginx
```

### Paso 4: Prueba Nuevamente

1. Abre `http://localhost:4200/recuperar-contrasena`
2. Ingresa: `saenzm963@gmail.com`
3. Click en "Enviar enlace"
4. ✅ Deberías ver el **Paso 2** con el token recibido automáticamente

---

## 📧 Configuración para Producción (Opcional)

Si necesitas enviar correos reales en producción, configura SMTP en `config/config.php`:

```php
// ❌ Modo Producción (DESACTIVA el retorno de token en respuesta)
define('RESET_TOKEN_RETURN_IN_RESPONSE', false);

// REEMPLAZA ESTOS VALORES
define('EMAIL_SMTP_HOST', 'smtp.gmail.com');
define('EMAIL_SMTP_PORT', 587);
define('EMAIL_SMTP_AUTH', true);
define('EMAIL_SMTP_SECURE', 'tls');
define('EMAIL_SMTP_USERNAME', 'TU_EMAIL@gmail.com');      // ← REEMPLAZA
define('EMAIL_SMTP_PASSWORD', 'TU_APP_PASSWORD');          // ← REEMPLAZA (16 caracteres)
define('EMAIL_FROM_ADDRESS', 'TU_EMAIL@gmail.com');        // ← DEBE SER IGUAL A USERNAME
define('EMAIL_FROM_NAME', 'Microservices Reservas');
define('RESET_PASSWORD_URL', 'https://tudominio.com/recuperar-contrasena');  // ← REEMPLAZA
```

### Obtener Contraseña de Aplicación Google

1. Ve a: https://myaccount.google.com
2. Seguridad → Verificación en 2 pasos → Activa si no está activa
3. Ve a: https://myaccount.google.com/apppasswords
4. Selecciona: **"Mail"** y **tu sistema operativo**
5. Google generará una contraseña de **16 caracteres**
6. Cópiala exactamente en `EMAIL_SMTP_PASSWORD` (sin espacios)

⚠️ **Importante**: 
- `EMAIL_FROM_ADDRESS` debe ser **IDÉNTICO** a `EMAIL_SMTP_USERNAME`
- Usa la **contraseña de aplicación** de Google (16 caracteres), NO tu contraseña de cuenta

---

## 🧪 Prueba del Flujo Completo (Desarrollo)

Una vez hayas cambiado `RESET_TOKEN_RETURN_IN_RESPONSE = true`:

### 1️⃣ Solicitar Recuperación
```bash
curl -X POST "http://localhost/microservices/gateway/login/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"correo": "saenzm963@gmail.com"}'
```

**Respuesta esperada:**
```json
{
  "status": 200,
  "message": "Si el correo existe, recibirás instrucciones para recuperar la contraseña",
  "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

⚠️ **Guarda el `reset_token`**

---

### 2️⃣ Validar Token (Opcional)
```bash
curl -X GET "http://localhost/microservices/gateway/login/verify-reset-token?token=PEGA_TU_TOKEN"
```

**Respuesta esperada:**
```json
{
  "status": 200,
  "message": "Token de recuperación válido",
  "data": {
    "correo": "saenzm963@gmail.com",
    "expira_en_segundos": 892
  }
}
```

---

### 3️⃣ Restablecer Contraseña
```bash
curl -X POST "http://localhost/microservices/gateway/login/reset-password" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "PEGA_TU_TOKEN",
    "nueva_contrasena": "NuevaContra123"
  }'
```

**Requisitos de Contraseña:**
- Mínimo 6 caracteres
- Al menos 1 mayúscula
- Al menos 1 número

**Respuesta esperada:**
```json
{
  "status": 200,
  "message": "Contraseña actualizada exitosamente"
}
```

---

### 4️⃣ Verificar que el Login Funciona
```bash
curl -X POST "http://localhost/microservices/gateway/login" \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "saenzm963@gmail.com",
    "contrasena": "NuevaContra123"
  }'
```

---

## 🧪 Prueba en la Interfaz Angular

Una vez configurado el backend:

1. Abre http://localhost:4200/recuperar-contrasena
2. Ingresa: `saenzm963@gmail.com`
3. Click: "Enviar enlace"
4. **Resultado esperado:**
   - ✅ Paso 2 mostrado automáticamente
   - ✅ Token recibido y mostrado
   - ✅ Contador de 15 minutos activo

5. Click: "Validar token"
6. **Resultado esperado:**
   - ✅ Paso 3 mostrado
   - ✅ Formulario de nueva contraseña

7. Ingresa: `NuevaContra123`
8. Confirma: `NuevaContra123`
9. Click: "Actualizar contraseña"
10. **Resultado esperado:**
    - ✅ Mensaje de éxito
    - ✅ Redireccionamiento a `/login` en 2 segundos
    - ✅ Puedes hacer login con la nueva contraseña

---

## 📋 Resumen de Configuración

| Parámetro | Desarrollo | Producción |
|-----------|-----------|-----------|
| **RESET_TOKEN_RETURN_IN_RESPONSE** | `true` | `false` |
| **EMAIL_SMTP_HOST** | - | `smtp.gmail.com` |
| **EMAIL_SMTP_PORT** | - | `587` |
| **EMAIL_SMTP_USERNAME** | - | tu@gmail.com |
| **EMAIL_SMTP_PASSWORD** | - | Contraseña app (16 chars) |
| **RESET_PASSWORD_URL** | `http://localhost:4200/recuperar-contrasena` | `https://tudominio.com/recuperar-contrasena` |

---

## 🐛 Solución de Problemas

### Error: "EMAIL_CONFIGURATION_ERROR"
**Causa**: `RESET_TOKEN_RETURN_IN_RESPONSE` está en `false` en desarrollo

**Solución**: Cambialo a `true` en `config/config.php`

---

### Error: "EMAIL_SEND_FAILED"
**Causa**: SMTP configurado pero las credenciales son incorrectas

**Soluciones:**
1. Verifica que 2FA esté habilitado en tu cuenta de Google
2. Regenera la contraseña de aplicación en https://myaccount.google.com/apppasswords
3. Verifica que `EMAIL_FROM_ADDRESS` = `EMAIL_SMTP_USERNAME`
4. Prueba que sean iguales: `usuario@gmail.com` (sin caracteres especiales)

---

### Error: "INVALID_PASSWORD"
**Causa**: Contraseña no cumple requisitos

**Requisitos:**
- ✅ Mínimo 6 caracteres
- ✅ Al menos 1 mayúscula (A-Z)
- ✅ Al menos 1 número (0-9)

**Ejemplos válidos:**
- `Contraseña123`
- `Miapp2025`
- `NewPass001`

---

### Error: "SAME_PASSWORD"
**Causa**: Usaste la misma contraseña que antes

**Solución**: Ingresa una contraseña completamente diferente

---

### Token Expirado
**Causa**: Pasaron más de 15 minutos desde que solicitaste la recuperación

**Solución**: Solicita un nuevo token haciendo clic en "Volver" → "Enviar enlace"

---

## ✅ Checklist Final

- [ ] Localizaste el archivo `config/config.php` del backend
- [ ] Cambiaste `RESET_TOKEN_RETURN_IN_RESPONSE` a `true` (desarrollo)
- [ ] Reiniciaste el backend (Apache/Nginx/PHP)
- [ ] Abriste `http://localhost:4200/recuperar-contrasena`
- [ ] Ingresaste `saenzm963@gmail.com`
- [ ] Click en "Enviar enlace"
- [ ] Viste el token recibido automáticamente
- [ ] Completaste los 3 pasos del flujo
- [ ] Pudiste hacer login con la nueva contraseña

---

## 📞 Próximos Pasos

Después de configurar el backend:

1. **Testing Completo**: Prueba el flujo de recuperación varias veces
2. **Producción**: Configura SMTP con tu email real
3. **Seguridad**: Revisa las notas de seguridad en la guía principal
4. **Documentación**: Comparte estas instrucciones con tu equipo

---

## 📚 Archivos Modificados en Frontend

- ✅ `src/app/components/recuperar-contrasena/recuperar-contrasena.ts` - 3 pasos con validación
- ✅ `src/app/components/recuperar-contrasena/recuperar-contrasena.html` - UI con contador
- ✅ `src/app/components/recuperar-contrasena/recuperar-contrasena.css` - Estilos modernos
- ✅ `src/app/services/login.service.ts` - 3 métodos HTTP

Todo está listo. Solo configura el backend. 🚀


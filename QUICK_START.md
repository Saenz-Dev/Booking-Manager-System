# ⚡ QUICK START - Recuperación de Contraseña

## 🎯 TL;DR (Demasiado Largo; No Leí)

El frontend está **completamente implementado**. Solo necesitas configurar el backend (1-2 minutos).

---

## 📋 2 Opciones Disponibles

### ✅ Opción 1: Desarrollo (Testing Local) - MÁS FÁCIL

El token se devuelve en la respuesta HTTP (perfecto para testing):

```bash
# Solo prueba directamente - ¡ya está listo!
curl -X POST "http://localhost/microservices/login-service/index.php/login/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"correo": "usuario@example.com"}'
```

**Respuesta:**
```json
{
  "status": 200,
  "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

✅ El token está en la respuesta. Listo para usar en frontend.

---

### 🚀 Opción 2: Producción (Gmail SMTP) - RECOMENDADO

Los emails se envían automáticamente a Gmail:

#### **Paso 1: Habilitar 2FA en Google**
1. Ve a https://myaccount.google.com/security
2. Busca "Verificación en 2 pasos" → Activar

#### **Paso 2: Generar Contraseña de Aplicación**
1. Ve a https://myaccount.google.com/apppasswords
2. Selecciona: **"Correo"** y **"Windows"** → Generar
3. Google te dará una contraseña de **16 caracteres**
4. 📋 **Cópiala exactamente**

#### **Paso 3: Actualizar config.php**
En `login-service/config/config.php`:

```php
define('RESET_TOKEN_RETURN_IN_RESPONSE', false);          // ✅ Cambiar a false
define('EMAIL_SMTP_USERNAME', 'tu-email@gmail.com');     // ✅ Tu Gmail
define('EMAIL_SMTP_PASSWORD', 'abcd efgh ijkl mnop');    // ✅ Contraseña de 16 chars
define('EMAIL_FROM_ADDRESS', 'tu-email@gmail.com');      // ✅ IGUAL a USERNAME
```

#### **Paso 4: Probar**
```bash
curl -X POST "http://localhost/microservices/login-service/index.php/login/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"correo": "usuario@gmail.com"}'
```

**Resultado:**
- ✅ Respuesta: `"status": 200` (sin token en respuesta)
- ✅ **Email recibido en Gmail** con enlace de recuperación
- ✅ El usuario hace clic en el enlace o copia el token

---

## 🧪 Prueba en el Frontend

### Con Opción 1 (Desarrollo - Token en Respuesta)

1. Abre: `http://localhost:4200/recuperar-contrasena`
2. Ingresa: `saenzm963@gmail.com`
3. Click: "Enviar enlace"
4. **Resultado:**
   - ✅ Paso 2 automáticamente
   - ✅ Token mostrado
   - ✅ Contador de 15 minutos
   - ✅ Continúa a Paso 3
   - ✅ Nueva contraseña → Login

### Con Opción 2 (Producción - Gmail)

1. Abre: `http://localhost:4200/recuperar-contrasena`
2. Ingresa: `saenzm963@gmail.com`
3. Click: "Enviar enlace"
4. **Resultado:**
   - ✅ Mensaje: "Revisa tu correo"
   - ✅ Paso 2 mostrado (para ingresar token)
5. **Revisa tu Gmail:**
   - ✅ Email de "Microservices Reservas"
   - ✅ Enlace con token: `http://localhost:4200/recuperar-contrasena?token=xxx`
   - ✅ Click en enlace o copia token
6. **Continúa en Frontend:**
   - ✅ Paso 3: Nueva contraseña
   - ✅ Login con nueva contraseña

---

## ⚠️ Si Hay Error

### "EMAIL_CONFIGURATION_ERROR"
Significa que SMTP no está configurado correctamente.

**Soluciones:**
- Verifica que 2FA esté activado en Google
- Usa la contraseña de 16 caracteres exacta de app passwords
- EMAIL_FROM_ADDRESS = EMAIL_SMTP_USERNAME (DEBE SER IGUAL)
- `RESET_TOKEN_RETURN_IN_RESPONSE = false` (para enviar emails)

### "EMAIL_SEND_FAILED"
La conexión a Gmail falló.

**Soluciones:**
- 2FA debe estar ACTIVO
- Credenciales correctas (contraseña de aplicación, no de Google)
- Verifica SMTP_HOST='smtp.gmail.com', PORT=587, SECURE='tls'

---

## ✅ Checklist Rápido

- [ ] Backend ejecutándose: http://localhost/microservices/gateway/ ✓
- [ ] Frontend accesible: http://localhost:4200/recuperar-contrasena ✓
- [ ] **Opción 1 (Dev)**: Token en respuesta → ¡Listo!
- [ ] **Opción 2 (Prod)**: Gmail configurado → ¡Listo!

---

## 📚 Documentación Completa

| Archivo | Uso |
|---------|-----|
| **GUIA_RECUPERACION_COMPLETA.md** | Guía técnica exhaustiva (TODO) |
| **CONFIGURACION_SMTP.md** | Setup detallado de Gmail |
| **TROUBLESHOOTING.md** | Problemas y soluciones |

---

## 🎉 ¡Listo!

**Opción 1:** Prueba ya mismo sin configurar nada (token en respuesta)  
**Opción 2:** Configura Gmail en 2 minutos (emails reales)

¡Elige la que prefieras y empieza! 🚀


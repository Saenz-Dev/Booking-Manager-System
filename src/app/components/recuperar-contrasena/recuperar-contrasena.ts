import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

import { NotificacionesService } from '../../services/notificaciones.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css'
})
export class RecuperarContrasena {
  // Estado del formulario
  paso: number = 1; // 1: Email, 2: Token, 3: Nueva contraseña
  
  // Paso 1
  email: string = '';
  resetToken: string = '';
  
  // Paso 2
  token: string = '';
  
  // Paso 3
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';
  mostrarContrasena: boolean = false;
  
  // Estados
  cargando: boolean = false;
  mensaje: string = '';
  error: string = '';
  tiempoExpiracion: number = 0;
  contadorTiempo: any = null;

  constructor(
    private _notificacionesService: NotificacionesService,
    private _loginService: LoginService,
    private _router: Router
  ) {}

  // ===== PASO 1: Solicitar Recuperación =====
  enviarRecuperacion() {
    this.error = '';
    this.mensaje = '';

    if (!this.email) {
      this.error = 'Debes ingresar un correo electrónico.';
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    if (!emailValido) {
      this.error = 'Ingresa un correo con formato válido.';
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    this.cargando = true;

    this._loginService.forgotPassword(this.email).subscribe(
      (response: any) => {
        this.cargando = false;
        console.log('forgotPassword response:', response);
        
        // Verificar que sea una respuesta exitosa (status 200)
        if (response?.status === 200) {
          // Si el servidor devuelve el token en desarrollo (RESET_TOKEN_RETURN_IN_RESPONSE=true)
          if (response.reset_token) {
            this.resetToken = response.reset_token;
            this.tiempoExpiracion = response.expires_in || 900;
            this.iniciarContador();
            this.paso = 2;
            this.mensaje = `Token recibido: ${response.reset_token.substring(0, 20)}...`;
            this._notificacionesService.success('Token de recuperación recibido (Modo Desarrollo)', 'Éxito');
          } else {
            // En producción (RESET_TOKEN_RETURN_IN_RESPONSE=false), el token se envía por correo
            this.mensaje = 'Si el correo existe en el sistema, recibirás instrucciones por correo electrónico para recuperar tu contraseña.';
            this._notificacionesService.success('Revisa tu correo para continuar', 'Recuperación solicitada');
            // Mostrar paso 2 para que ingrese el token manualmente
            this.paso = 2;
            this.tiempoExpiracion = 900; // 15 minutos por defecto
            this.iniciarContador();
          }
        } else {
          // Manejar diferentes tipos de errores según los códigos de la guía
          let mensajeError = 'Error al solicitar recuperación.';
          
          if (response?.status === 0) {
            mensajeError = 'No se puede conectar al servidor. ¿Está ejecutándose el backend en http://localhost/microservices/gateway/?';
          } else if (response?.status === 400) {
            // Errores de validación
            if (response?.code === 'INVALID_EMAIL') {
              mensajeError = 'El email no tiene un formato válido.';
            } else {
              mensajeError = response?.error || 'Solicitud inválida.';
            }
          } else if (response?.status === 404) {
            mensajeError = 'El servidor no encontró el endpoint de recuperación. Verifica la configuración del backend.';
          } else if (response?.status === 500) {
            // Errores del servidor
            if (response?.code === 'EMAIL_SEND_FAILED') {
              mensajeError = `No se pudo enviar correo: ${response.error}. ¿Está SMTP configurado?`;
            } else if (response?.code === 'EMAIL_CONFIGURATION_ERROR') {
              mensajeError = 'El servidor no tiene configurado SMTP. Cambia RESET_TOKEN_RETURN_IN_RESPONSE a true en desarrollo.';
            } else if (response?.code === 'USER_NOT_FOUND') {
              mensajeError = 'Usuario no encontrado en la base de datos.';
            } else {
              mensajeError = response?.error || 'Error en el servidor.';
            }
          } else if (response?.message) {
            mensajeError = response.message;
          }
          
          this.error = mensajeError;
          this._notificacionesService.error(this.error, 'Error');
          console.error('forgotPassword error:', response);
        }
      },
      (error: any) => {
        this.cargando = false;
        console.error('HTTP error:', error);
        
        let mensajeError = 'Error de conexión. Por favor, intenta más tarde.';
        
        if (error.status === 0) {
          mensajeError = 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.';
        } else if (error.status === 404) {
          mensajeError = 'El endpoint de recuperación no existe. Verifica la URL del backend.';
        } else if (error.status === 500) {
          mensajeError = error.error?.error || 'Error interno del servidor.';
        }
        
        this.error = mensajeError;
        this._notificacionesService.error(this.error, 'Error');
      }
    );
  }

  // ===== PASO 2: Validar Token =====
  validarToken() {
    this.error = '';
    this.mensaje = '';

    if (!this.token && !this.resetToken) {
      this.error = 'Debes ingresar el token de recuperación.';
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    const tokenAUsar = this.resetToken || this.token;
    this.cargando = true;

    this._loginService.verifyResetToken(tokenAUsar).subscribe(
      (response: any) => {
        this.cargando = false;

        if (response.status === 200) {
          this.token = tokenAUsar;
          this.tiempoExpiracion = response.data?.expira_en_segundos || 0;
          
          // Validar que el token no esté expirado
          if (this.tiempoExpiracion <= 0) {
            this.error = 'El token ha expirado. Por favor, solicita uno nuevo.';
            this._notificacionesService.error(this.error, 'Token expirado');
            this.paso = 1;
            return;
          }
          
          this.iniciarContador();
          this.paso = 3;
          this.mensaje = `Token válido para: ${response.data?.correo}. Expira en ${this.formatearTiempo(this.tiempoExpiracion)}.`;
          this._notificacionesService.success('Token validado correctamente', 'Éxito');
        } else {
          let mensajeError = 'Token inválido o expirado.';
          
          if (response?.status === 400 && response?.code === 'INVALID_EMAIL') {
            mensajeError = 'El email en el token no es válido.';
          }
          
          this.error = mensajeError;
          this._notificacionesService.error(this.error, 'Token inválido');
          console.error('verifyResetToken error:', response);
        }
      },
      (error: any) => {
        this.cargando = false;
        
        if (error.status === 401) {
          this.error = 'Token inválido o expirado.';
        } else if (error.status === 400) {
          this.error = 'Token faltante o formato incorrecto.';
        } else {
          this.error = 'Error al validar token. Por favor, intenta más tarde.';
        }
        
        this._notificacionesService.error(this.error, 'Error');
        console.error('Error:', error);
      }
    );
  }

  // ===== PASO 3: Restablecer Contraseña =====
  restablecerContrasena() {
    this.error = '';
    this.mensaje = '';

    if (!this.nuevaContrasena) {
      this.error = 'Debes ingresar una nueva contraseña.';
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.error = 'Las contraseñas no coinciden.';
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    // Validar requisitos de contraseña
    if (this.nuevaContrasena.length < 6) {
      this.error = 'La contraseña debe tener mínimo 6 caracteres.';
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    if (!/[A-Z]/.test(this.nuevaContrasena)) {
      this.error = 'La contraseña debe contener al menos una letra mayúscula.';
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    if (!/[0-9]/.test(this.nuevaContrasena)) {
      this.error = 'La contraseña debe contener al menos un número.';
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    this.cargando = true;

    this._loginService.resetPassword(this.token, this.nuevaContrasena).subscribe(
      (response: any) => {
        this.cargando = false;
        console.log('resetPassword response:', response);

        if (response?.status === 200) {
          this.mensaje = '✓ Contraseña actualizada exitosamente. Redirigiendo a login...';
          this._notificacionesService.success('Tu contraseña ha sido restablecida correctamente', 'Éxito');
          
          // Limpiar contador
          if (this.contadorTiempo) {
            clearInterval(this.contadorTiempo);
          }
          
          // Redirigir a login después de 2 segundos
          setTimeout(() => {
            this._router.navigate(['/login']);
          }, 2000);
        } else {
          // Manejar errores específicos según la guía
          let mensajeError = 'Error al restablecer contraseña.';
          
          if (response?.status === 400) {
            // Errores de validación
            if (response?.code === 'INVALID_PASSWORD') {
              mensajeError = 'La nueva contraseña debe tener mínimo 6 caracteres, una letra mayúscula y un número.';
            } else if (response?.code === 'SAME_PASSWORD') {
              mensajeError = 'La nueva contraseña debe ser diferente a la contraseña anterior.';
            } else if (response?.code === 'INVALID_EMAIL') {
              mensajeError = 'El email en el token no es válido.';
            } else {
              mensajeError = response?.error || 'Contraseña inválida.';
            }
          } else if (response?.status === 401) {
            if (response?.code === 'INVALID_RESET_TOKEN') {
              mensajeError = 'Token inválido o expirado. Por favor, solicita uno nuevo.';
            } else {
              mensajeError = 'No autorizado. Token inválido o expirado.';
            }
          } else if (response?.status === 404) {
            if (response?.code === 'USER_NOT_FOUND') {
              mensajeError = 'Usuario no encontrado en la base de datos.';
            } else {
              mensajeError = 'Recurso no encontrado.';
            }
          } else {
            mensajeError = response?.error || 'Error al restablecer contraseña.';
          }
          
          this.error = mensajeError;
          this._notificacionesService.error(this.error, 'Error');
          console.error('resetPassword error:', response);
        }
      },
      (error: any) => {
        this.cargando = false;
        console.error('HTTP error:', error);
        
        let mensajeError = 'Error al restablecer contraseña.';
        
        if (error.status === 400) {
          // Errores de validación HTTP
          if (error.error?.code === 'INVALID_PASSWORD') {
            mensajeError = 'Contraseña no válida. Requiere: 6+ caracteres, 1 mayúscula, 1 número.';
          } else if (error.error?.code === 'SAME_PASSWORD') {
            mensajeError = 'La nueva contraseña debe ser diferente a la anterior.';
          } else {
            mensajeError = error.error?.error || 'Solicitud inválida.';
          }
        } else if (error.status === 401) {
          mensajeError = 'Token inválido o expirado. Por favor, solicita uno nuevo.';
        } else if (error.status === 404) {
          mensajeError = 'Usuario no encontrado en la base de datos.';
        } else if (error.status === 0) {
          mensajeError = 'No se puede conectar al servidor.';
        } else if (error.status === 500) {
          mensajeError = error.error?.error || 'Error interno del servidor.';
        }
        
        this.error = mensajeError;
        this._notificacionesService.error(this.error, 'Error');
      }
    );
  }

  // ===== Utilidades =====
  iniciarContador() {
    if (this.contadorTiempo) {
      clearInterval(this.contadorTiempo);
    }

    this.contadorTiempo = setInterval(() => {
      this.tiempoExpiracion--;
      if (this.tiempoExpiracion <= 0) {
        clearInterval(this.contadorTiempo);
        this.error = 'El token ha expirado. Por favor, solicita uno nuevo.';
        this._notificacionesService.error(this.error, 'Token expirado');
        this.volver();
      }
    }, 1000);
  }

  formatearTiempo(segundos: number): string {
    const minutos = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${minutos}:${secs < 10 ? '0' : ''}${secs}`;
  }

  volver() {
    if (this.contadorTiempo) {
      clearInterval(this.contadorTiempo);
    }

    if (this.paso === 1) {
      this._router.navigate(['/login']);
    } else {
      this.paso--;
      this.error = '';
      this.mensaje = '';
    }
  }

  toggleMostrarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  ngOnDestroy() {
    if (this.contadorTiempo) {
      clearInterval(this.contadorTiempo);
    }
  }
}

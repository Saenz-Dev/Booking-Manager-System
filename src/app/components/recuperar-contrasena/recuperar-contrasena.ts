import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { NotificacionesService } from '../../services/notificaciones.service';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.html',
  styleUrl: './recuperar-contrasena.css'
})
export class RecuperarContrasena {
  email: string = '';
  mensaje: string = '';
  error: string = '';

  constructor(private _notificacionesService: NotificacionesService) {}

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

    this.mensaje = 'Si el correo existe en el sistema, enviaremos instrucciones de recuperación.';
    this._notificacionesService.success('Revisa tu correo para continuar', 'Recuperación');
  }
}

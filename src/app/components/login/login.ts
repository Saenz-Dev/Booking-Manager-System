import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { NotificacionesService } from '../../services/notificaciones.service';
import { NotificacionesComponent } from "../notificaciones/notificaciones";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, NotificacionesComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [NotificacionesService]
})
export class Login {

  email: string = "";
  password: string = "";
  error: string = "";

  constructor(
    private router: Router,
    private _notificacionesService: NotificacionesService
  ) { }

  iniciarSesion() {
    if (!this.email || !this.password) {
      this.error = "Todos los campos son obligatorios";
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    if (this.email === "admin@admin.com" && this.password === "1234") {
      this.router.navigate(['/inicio']);
    } else {
      this.error = "Credenciales incorrectas";
      this._notificacionesService.error(this.error, 'Error');
    }

  }

}
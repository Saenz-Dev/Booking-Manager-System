import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { NotificacionesService } from '../../services/notificaciones.service';
import { NotificacionesComponent } from "../notificaciones/notificaciones";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, NotificacionesComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  providers: [NotificacionesService]
})
export class Login implements OnInit {

  email: string = "";
  password: string = "";
  error: string = "";
  isFullBg: boolean = false;

  constructor(
    private router: Router,
    private _notificacionesService: NotificacionesService
  ) { }

  ngOnInit(): void {
    // Filtramos solo NavigationEnd para evitar errores
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        // Si la ruta es /registrar, expandimos el fondo
        this.isFullBg = navEnd.urlAfterRedirects === '/registrar';
      });
  }

  iniciarSesion() {
    if (!this.email || !this.password) {
      this.error = "Todos los campos son obligatorios";
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    if (this.email === "admin@admin.com" && this.password === "1234") {
      this.error = "";
      this.router.navigate(['/inicio']);
    } else {
      this.error = "Credenciales incorrectas";
      this._notificacionesService.error(this.error, 'Error');
    }
  }
}
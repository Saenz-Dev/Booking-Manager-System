import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { NotificacionesService } from '../../services/notificaciones.service';
import { LoginService } from '../../services/login.service';
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
    private _notificacionesService: NotificacionesService,
    private _loginService: LoginService
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

    this._loginService.login(this.email, this.password).subscribe((result: any) => {
      if (result.code === 200) {
        this.error = "";
        this._notificacionesService.success('Bienvenido', 'Éxito');
        setTimeout(() => {
          this.router.navigate(['/inicio']);
        }, 2500);
        return;
      }

      this.error = result.message;
      this._notificacionesService.error(result.data, 'Error');
    },
      error => {
        console.log('Error en la solicitud de login:', error.error.data);
        this.error = 'Error al conectar con el servidor';
        this._notificacionesService.error(error.error.data, 'Error');
      });
  }
}
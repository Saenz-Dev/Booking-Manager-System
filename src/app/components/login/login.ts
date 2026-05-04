import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { NotificacionesService } from '../../services/notificaciones.service';
import { UserService } from '../../services/users.service';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  providers: [LoginService]
})
export class Login implements OnInit {

  // Campos del formulario de acceso.
  email: string = "";
  password: string = "";
  error: string = "";
  isFullBg: boolean = false;

  constructor(
    private router: Router,
    private _notificacionesService: NotificacionesService,
    private _loginService: LoginService,
    private _userService: UserService
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

  // Valida credenciales y crea la sesión local.
  iniciarSesion() {
    if (!this.email || !this.password) {
      this.error = "Todos los campos son obligatorios";
      this._notificacionesService.error(this.error, 'Error');
      return;
    }

    this._loginService.login(this.email, this.password).subscribe((result: any) => {
      if (result.status == 200) {
        console.log('Entra');
        console.log('Login exitoso:', result);
        this.error = "";
        this._notificacionesService.success('Bienvenido', 'Éxito');
        console.log(result);
        localStorage.setItem('cuenta', result.usuario.correo);
        localStorage.setItem('id_usuario', result.usuario.id_usuario);
        localStorage.setItem('token', result.token);
        this._userService.getUsuarioId(localStorage.getItem('cuenta') ?? '').subscribe((userResult: any) => {
          if (userResult.status == 200) {
            localStorage.setItem('nombres', userResult.nombres);
            localStorage.setItem('apellidos', userResult.apellidos);
            this.router.navigate(['/inicio']);
          }
        });
        return;
      }

      this.error = result.message;
      this._notificacionesService.error(result.data, 'Error');
    },
      error => {
        console.log('Error en la solicitud de login:', error.error.data);
        this.error = 'Ha ocurrido un error';
        this._notificacionesService.error(error.error.data, 'Error');
      });
  }

  irARecuperacion(): void {
    this.router.navigate(['/recuperar-contrasena']);
  }
}
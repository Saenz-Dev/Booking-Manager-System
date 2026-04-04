import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email: string = "";
  password: string = "";
  error: string = "";

  constructor(private router: Router) {}

  iniciarSesion() {

  if (!this.email || !this.password) {
    this.error = "Todos los campos son obligatorios";
    return;
  }

  if (this.email === "admin@admin.com" && this.password === "1234") {
    this.router.navigate(['/inicio']);
  } else {
    this.error = "Credenciales incorrectas";
  }

}

}
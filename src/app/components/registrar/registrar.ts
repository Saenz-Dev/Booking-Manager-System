import { Component } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AsyncValidatorFn } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { Route, Router, ActivatedRoute, RouterLink } from '@angular/router';

import { NotificacionesService } from '../../services/notificaciones.service';
import { UserService } from '../../services/users.service';
import { CuentasService } from '../../services/cuentas.service';
import { Usuario } from '../../modelo/usuario';
import { Cuenta } from '../../modelo/cuenta';
import { catchError, map, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-registrar',
  imports: [ReactiveFormsModule, NgIf, RouterLink,],
  templateUrl: './registrar.html',
  providers: [UserService, CuentasService],
  styleUrl: './registrar.css'
})
export class Registrar {

  // Formulario reactivo y modelo temporal de usuario.
  registroForm: FormGroup;
  usuario: Usuario;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private _userService: UserService,
    private _cuentasService: CuentasService,
    private _notificacionesService: NotificacionesService,
  ) {
    this.registroForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      tipo_documento: ['', Validators.required],
      numero_documento: ['', [Validators.required, Validators.pattern(/^[0-9]{6,12}$/)], [this.validarExistenciaNumeroIdentificacion()]],
      fecha_nacimiento: ['', [Validators.required, this.mayorDe18Anios()]],
      ciudad: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/), Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email], [this.validarExistenciaCorreo()]],
      telefono: ['', [Validators.required, Validators.pattern(/^3[0-9]{9}$/)]],
      contrasena: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9]).{6,}$/)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordsIguales
    });
    this.usuario = new Usuario(0, '', '', '', '', 0, '', new Date(), 1, 2, new Cuenta(0, '', '', 0));
  }

  // Arma el payload final usando los datos del formulario.
  getBodyUsuario() {
    const form = this.registroForm.value;
    return {
      nombres: form.nombres,
      apellidos: form.apellidos,
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento,
      fecha_nacimiento: form.fecha_nacimiento,
      ciudad: form.ciudad,
      telefono: form.telefono,
      correo: form.correo,
      contrasena: form.contrasena,
      estado: 1,
      id_rol: 2
    };
  }

  ngOnInit() {

    this.registroForm.get('fecha_nacimiento')?.valueChanges.subscribe(() => {
      this.registroForm.get('fecha_nacimiento')?.updateValueAndValidity();
    });
  }

  mayorDe18Anios(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const fechaNacimiento = new Date(control.value + 'T00:00:00');
      const hoy = new Date();

      let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

      const mesActual = hoy.getMonth();
      const diaActual = hoy.getDate();
      const mesNacimiento = fechaNacimiento.getMonth();
      const diaNacimiento = fechaNacimiento.getDate();

      if (mesActual < mesNacimiento ||
        (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
        edad--;
      }

      return edad >= 18 ? null : { mayorDe18: { valor: edad, requerido: 18 } };
    };
  }

  validarExistenciaCorreo(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);

      const correoIngresado = String(control.value).trim().toLowerCase();

      return this._cuentasService.getCuentaCorreoSinToken(correoIngresado).pipe(
        map((response: any) => {
          if (response.status == 200) {
            return correoIngresado === response.correo ? { correoExistente: true } : null;
          }
          return null;
        }),
        catchError(() => of(null))
      );
    };
  }

  validarExistenciaNumeroIdentificacion(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);

      const numero_documento = String(control.value).trim().toLowerCase();

      return this._userService.getUsuarioSinToken(Number(numero_documento)).pipe(
        map((response: any) => {
            if (response.status == 200) {
            return numero_documento === response.numero_documento ? { numero_documentoExistente: true } : null;
          }
          return null;
        }),
        catchError(() => of(null))
      );
    };
  }

  passwordsIguales(group: FormGroup) {
    const pass = group.get('contrasena')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { noSonIguales: true };
  }

  // Envía el registro y luego crea la cuenta asociada.
  onSubmit() {
    if (this.registroForm.invalid) {
      return;
    }
    const bodyUsuario = this.getBodyUsuario();

    this.addPerson();
    this._notificacionesService.success('Usuario creado correctamente', 'Éxito');
    this.registrarCuenta(Number(this.getBodyUsuario().numero_documento));
    this.router.navigate(['/login']);
  }

  addPerson() {
    this._userService.addUsuarioSinToken(this.getBodyUsuario()).subscribe(
      (response: any) => {
        if (response.code != 200 && response.code != 201) {
          return;
        }
      },
      error => {
        console.error(error);
        this._notificacionesService.error('Error al registrar el usuario', 'Error');
      }
    )
  }

  addCuenta(id: number, cuenta: Cuenta) {
    console.log('Entra a addCuenta: ' + id);
    this._cuentasService.addCuentaSinToken(id, cuenta).subscribe(
      (response: any) => {
        console.log('Entra a addCuenta')
        if (response.code != 200 && response.code != 201) {
          this._notificacionesService.error('Error al registrar la cuenta', 'Error');
          return;
        }
        this._notificacionesService.success('Cuenta registrada correctamente', 'Éxito');
      },
      error => {
        console.error(error);
        this._notificacionesService.error('Error al registrar la cuenta', 'Error');
      }
    )
  }

  registrarCuenta(numero_identificacion: number) {
    console.log(numero_identificacion);
    this._userService.getUsuarioSinToken(numero_identificacion).subscribe(
      (response: any) => {
        if (response.code == 200) {

          console.log('Data usuario: ' + response.data);
          this.addCuenta(response.data.id_usuario, this.usuario.cuenta);
          console.log('Cuenta registrada');
          return;
        }
      }
    );
  }


  // validarMatchPasswords(control: AbstractControl): ValidationErrors | null {
  //   const password = control.get('password')?.value;
  //   const verifyPassword = control.get('verifyPassword')?.value;

  //   if (password !== verifyPassword) {
  //     console.log('si hay error');
  //     return { noIguales: true };
  //   }

  //   return null;
  // }
}

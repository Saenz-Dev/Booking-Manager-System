import { Component } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-registrar',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './registrar.html',
})
export class Registrar {

  registroForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.registroForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      tipoDocumento: ['', Validators.required],
      documento: ['', [Validators.required, Validators.pattern(/^[0-9]{6,12}$/)]],
      fechaNacimiento: ['', [Validators.required, this.mayorDe18Anios()]],
      ciudad: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/), Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9]).{6,}$/)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordsIguales
    });
  }

  ngOnInit() {
    this.registroForm.get('fechaNacimiento')?.valueChanges.subscribe(() => {
      this.registroForm.get('fechaNacimiento')?.updateValueAndValidity();
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

  passwordsIguales(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { noSonIguales: true };
  }

  onSubmit() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    console.log(this.registroForm.value);
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
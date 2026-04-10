import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { catchError, map, of } from 'rxjs';
import { NotificacionesService } from '../../services/notificaciones.service';
import { UserService } from '../../services/users.service';

@Component({
    selector: 'app-editar-usuario',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './editar-usuario.html',
    styleUrl: './editar-usuario.css'
})
export class EditarUsuarioComponent implements OnInit {
    @Output() profileUpdated = new EventEmitter<{ nombres: string; apellidos: string }>();

    isEditingProfile = false;
    isLoadingProfile = false;
    profileUserId = '';
    profileForm: FormGroup;
    profileData = {
        nombres: '',
        apellidos: '',
        correo: '',
        telefono: '',
        fechaNacimiento: '',
        tipoDocumento: '',
        numeroDocumento: '',
        ciudad: ''
    };

    constructor(
        private fb: FormBuilder,
        private _notificacionesService: NotificacionesService,
        private _userService: UserService
    ) {
        this.profileForm = this.crearFormularioPerfil();
    }

    ngOnInit(): void {
        this.profileUserId = localStorage.getItem('id_usuario') ?? '';

        this.profileData.correo = localStorage.getItem('cuenta') ?? '';
        this.profileData.nombres = localStorage.getItem('nombres') ?? '';
        this.profileData.apellidos = localStorage.getItem('apellidos') ?? '';

        this.cargarPerfilUsuario();
    }

    get nombreControl() { return this.profileForm.get('nombres'); }
    get apellidoControl() { return this.profileForm.get('apellidos'); }
    get telefonoControl() { return this.profileForm.get('telefono'); }
    get fechaNacimientoControl() { return this.profileForm.get('fechaNacimiento'); }
    get tipoDocumentoControl() { return this.profileForm.get('tipoDocumento'); }
    get numeroDocumentoControl() { return this.profileForm.get('numeroDocumento'); }
    get ciudadControl() { return this.profileForm.get('ciudad'); }
    get canSaveProfile(): boolean {
        return this.isEditingProfile && this.profileForm.valid && !this.profileForm.pending;
    }

    activarEdicionPerfil(): void {
        this.isEditingProfile = true;
        this.profileForm.enable({ emitEvent: false });
        this.profileForm.get('correo')?.disable({ emitEvent: false });
    }

    cancelarEdicionPerfil(): void {
        this.isEditingProfile = false;
        this.sincronizarFormularioPerfil();
        this.cargarPerfilUsuario();
    }

    guardarPerfil(): void {
        if (!this.profileUserId) {
            this._notificacionesService.warning('No se encontró el usuario de la sesión.', 'Perfil');
            return;
        }

        this.profileForm.markAllAsTouched();
        if (!this.canSaveProfile) {
            this._notificacionesService.warning('Revisa los campos marcados antes de guardar.', 'Perfil');
            return;
        }

        const valores = this.profileForm.getRawValue();

        const payload = {
            nombres: valores.nombres,
            apellidos: valores.apellidos,
            telefono: valores.telefono,
            fecha_nacimiento: valores.fechaNacimiento,
            tipo_documento: valores.tipoDocumento,
            numero_documento: valores.numeroDocumento,
            ciudad: valores.ciudad,
            estado: 1,
            id_rol: 2,
            id: this.profileUserId
        };

        this._userService.actualizarUsuarioId(this.profileUserId, payload).subscribe({
            next: (result: any) => {
                console.log(result);
                if (result?.code && result.code !== 200) {
                    this._notificacionesService.error('No fue posible actualizar el perfil.', 'Perfil');
                    return;
                }

                this.profileData = { ...this.profileData, ...valores };
                localStorage.setItem('nombres', valores.nombres);
                localStorage.setItem('apellidos', valores.apellidos);
                this.profileUpdated.emit({ nombres: valores.nombres, apellidos: valores.apellidos });
                this.isEditingProfile = false;
                this.profileForm.disable({ emitEvent: false });
                this.profileForm.get('correo')?.disable({ emitEvent: false });
                this._notificacionesService.success('Perfil actualizado correctamente.', 'Perfil');
            },
            error: () => {
                this._notificacionesService.error('No fue posible actualizar el perfil.', 'Perfil');
            }
        });
    }

    private crearFormularioPerfil(): FormGroup {
        return this.fb.group({
            nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
            apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
            correo: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
            telefono: ['', [Validators.required, Validators.pattern(/^3[0-9]{9}$/)]],
            fechaNacimiento: ['', [Validators.required]],
            tipoDocumento: ['', [Validators.required]],
            numeroDocumento: ['', [Validators.required, Validators.pattern(/^[0-9]{6,12}$/)], [this.validarNumeroDocumentoUnicoEnPerfil()]],
            ciudad: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
        });
    }

    private validarNumeroDocumentoUnicoEnPerfil(): AsyncValidatorFn {
        return (control: AbstractControl) => {
            if (!control.value) {
                return of(null);
            }

            const numeroIngresado = String(control.value).trim().toLowerCase();
            const numeroActual = String(this.profileData.numeroDocumento ?? '').trim().toLowerCase();

            if (!numeroIngresado || numeroIngresado === numeroActual) {
                return of(null);
            }

            return this._userService.getUsuarioSinToken(Number(numeroIngresado)).pipe(
                map((response: any): ValidationErrors | null => {
                    if (!response?.data) {
                        return null;
                    }

                    const usuarioEncontrado = response.data;
                    const mismoDocumento = String(usuarioEncontrado.numero_documento ?? '').trim().toLowerCase() === numeroIngresado;
                    const esMismoUsuario = String(usuarioEncontrado.id_usuario ?? '') === String(this.profileUserId ?? '');

                    return mismoDocumento && !esMismoUsuario ? { numeroDocumentoExistente: true } : null;
                }),
                catchError(() => of(null))
            );
        };
    }

    private sincronizarFormularioPerfil(): void {
        this.profileForm.reset({
            nombres: this.profileData.nombres,
            apellidos: this.profileData.apellidos,
            correo: this.profileData.correo,
            telefono: this.profileData.telefono,
            fechaNacimiento: this.profileData.fechaNacimiento,
            tipoDocumento: this.profileData.tipoDocumento,
            numeroDocumento: this.profileData.numeroDocumento,
            ciudad: this.profileData.ciudad
        }, { emitEvent: false });
        this.profileForm.disable({ emitEvent: false });
        this.profileForm.get('correo')?.disable({ emitEvent: false });
    }

    private cargarPerfilUsuario(): void {
        if (!this.profileUserId) {
            return;
        }

        this.isLoadingProfile = true;
        this._userService.getUsuarioId(this.profileUserId).subscribe({
            next: (userResult: any) => {
                this.isLoadingProfile = false;
                if (userResult?.code !== 200 || !userResult?.data) {
                    return;
                }

                const usuario = userResult.data;
                this.profileData = {
                    nombres: usuario.nombres ?? '',
                    apellidos: usuario.apellidos ?? '',
                    correo: usuario.cuenta?.correo ?? this.profileData.correo,
                    telefono: usuario.telefono ? String(usuario.telefono) : '',
                    fechaNacimiento: this.normalizarFecha(usuario.fecha_nacimiento),
                    tipoDocumento: usuario.tipo_documento ?? '',
                    numeroDocumento: usuario.numero_documento ?? '',
                    ciudad: usuario.ciudad ?? ''
                };

                this.sincronizarFormularioPerfil();
                this.profileUpdated.emit({ nombres: this.profileData.nombres, apellidos: this.profileData.apellidos });
            },
            error: () => {
                this.isLoadingProfile = false;
                this._notificacionesService.warning('No se pudo cargar el perfil completo.', 'Perfil');
            }
        });
    }

    private normalizarFecha(valor: string | Date | null | undefined): string {
        if (!valor) {
            return '';
        }

        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) {
            return '';
        }

        return fecha.toISOString().split('T')[0];
    }
}

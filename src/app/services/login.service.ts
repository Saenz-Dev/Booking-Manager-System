import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { GLOBAL } from './global';

export interface LoginResult {
    success: boolean;
    message: string;
    cuenta?: any;
}

@Injectable({
    providedIn: 'root'
})
export class LoginService {
    // URL base del backend.
    private readonly url: string;

    constructor(private _http: HttpClient) {
        this.url = GLOBAL.url;
    }

    // Envia credenciales al endpoint de login.
    login(correo: string, contrasena: string) {
        let headers = { 'headers': { 'Content-Type': 'application/json' } };
        return this._http.post(this.url + 'login', { "correo": correo, "contrasena": contrasena }, headers).pipe(
            map(response => { return response })
        );
    }

    // Solicita recuperación de contraseña
    forgotPassword(correo: string): Observable<any> {
        let headers = { 'headers': { 'Content-Type': 'application/json' } };
        return this._http.post(this.url + 'login/forgot-password', { "correo": correo }, headers).pipe(
            map(response => { 
                console.log('forgotPassword response:', response);
                return response;
            }),
            catchError(error => {
                console.error('Error en forgotPassword:', error);
                console.error('Error status:', error.status);
                console.error('Error response:', error.error);
                
                // Devolver el error para que sea manejado por el componente
                return of({
                    status: error.status || 500,
                    message: error.error?.message || error.message || 'Error al solicitar recuperación',
                    code: error.error?.code,
                    error: error.error
                });
            })
        );
    }

    // Valida el token de recuperación
    verifyResetToken(token: string): Observable<any> {
        return this._http.get(this.url + `login/verify-reset-token?token=${token}`).pipe(
            map(response => { 
                console.log('verifyResetToken response:', response);
                return response;
            }),
            catchError(error => {
                console.error('Error en verifyResetToken:', error);
                console.error('Error status:', error.status);
                console.error('Error response:', error.error);
                
                return of({
                    status: error.status || 500,
                    message: error.error?.message || error.message || 'Error al validar token',
                    code: error.error?.code,
                    error: error.error
                });
            })
        );
    }

    // Restablece la contraseña con el token
    resetPassword(token: string, nuevaContrasena: string): Observable<any> {
        let headers = { 'headers': { 'Content-Type': 'application/json' } };
        return this._http.post(this.url + 'login/reset-password', { 
            "token": token, 
            "nueva_contrasena": nuevaContrasena 
        }, headers).pipe(
            map(response => { 
                console.log('resetPassword response:', response);
                return response;
            }),
            catchError(error => {
                console.error('Error en resetPassword:', error);
                console.error('Error status:', error.status);
                console.error('Error response:', error.error);
                
                return of({
                    status: error.status || 500,
                    message: error.error?.message || error.message || 'Error al restablecer contraseña',
                    code: error.error?.code,
                    error: error.error
                });
            })
        );
    }
}

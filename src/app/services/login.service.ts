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
}

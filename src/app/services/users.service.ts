import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpResponse } from "@angular/common/http";
import 'rxjs/internal/operators/map';
import { map } from 'rxjs';
import { Usuario } from "../modelo/usuario";
import { GLOBAL } from "./global";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    // URL base del módulo de usuarios.
    public url: string;
    public filesUpload: any;
    public resultUpload: any;

    constructor(
        public _http: HttpClient
    ) {
        this.url = GLOBAL.url;
    }

    getUsuariosSinToken() {
        return this._http.get(this.url + 'usuarios').pipe(
            map(response => { return response })
        )
    }


    getUsuarioSinToken(numero_identificacion: number) {
        let params = {
            'numero_documento': numero_identificacion
        }
        console.log(params);
        return this._http.get(this.url + 'usuarios', { params }).pipe(
            map(response => {
                return response
            })
        )
    }

    getUsuarioId(id_usuario: string) {
        let params = {
            'id_usuario': id_usuario
        }
        console.log(params);
        return this._http.get(this.url + 'usuarios', { params }).pipe(
            map(response => {
                console.log(response);
                return response
            })
        )
    }

    // Actualiza datos de perfil del usuario actual.
    actualizarUsuarioId(id_usuario: string, datos: any) {
        let params = {
            'id': id_usuario
        }
        let options = {
            params,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token') ?? ''
            }
        }

        return this._http.put(this.url + 'usuarios', datos, options).pipe(
            map(response => {
                return response
            })
        )
    }

    addUsuarioSinToken(usuario: any) {
        // let body = {
        //     'nombres': usuario.nombres,
        //     'apellidos': usuario.apellidos,
        //     'tipo_documento': usuario.tipo_documento,
        //     'numero_documento': usuario.numero_documento,
        //     'telefono': usuario.telefono,
        //     'ciudad': usuario.ciudad,
        //     'fecha_nacimiento': usuario.fecha_nacimiento,
        //     'estado': usuario.estado,
        //     'id_rol': usuario.id_rol,
        //     'cuenta': {
        //         'correo': usuario.cuenta.correo,
        //         'contrasena': usuario.cuenta.contrasena,
        //         'estado_sesion': usuario.cuenta.estado_sesion
        //     }
        // }

        let options = {
            'headers': {
                'Content-Type': 'application/json'
            }
        }
        return this._http.post(this.url + 'usuarios', usuario, options).pipe(
            map(response => { return response })
        );
    }

    getUsuarios(/*token: any*/) {
        // let headers = new HttpHeaders({ 'Authorization': token });
        // let options = {
        //     'headers': headers
        // }
        return this._http.get(this.url + 'usuarios').pipe(
            map(response => {
                console.log(response);
                return response
            })
        );
    }

    getUsuario(numero_identificacion: number) {
        let params = {
            'id': numero_identificacion
        }
        console.log(params);
        return this._http.get(this.url + 'usuarios', { params }).pipe(
            map(response => { return response })
        )
    }

    addPerson(usuario: Usuario) {
        let body = {
            'nombres': usuario.nombres,
            'apellidos': usuario.apellidos,
            'tipo_documento': usuario.tipo_documento,
            'numero_documento': usuario.numero_documento,
            'telefono': usuario.telefono,
            'ciudad': usuario.ciudad,
            'fecha_nacimiento': usuario.fecha_nacimiento,
            'estado': usuario.estado,
            'id_rol': usuario.id_rol,
            'cuenta': {
                'correo': usuario.cuenta.correo,
                'contrasena': usuario.cuenta.contrasena,
                'estado_sesion': usuario.cuenta.estado_sesion
            }
        }
        console.log(body);
        let options = {
            'headers': {
                'Content-Type': 'application/json'
            }
            // new HttpHeaders({ 'Authorization': token }),

        }
        return this._http.post(this.url + 'usuarios', body, options).pipe(
            map(response => { return response })
        );
    }
}

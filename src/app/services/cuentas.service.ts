import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import 'rxjs/internal/operators/map';
import { map } from 'rxjs';
import { Cuenta } from "../modelo/cuenta";
import { GLOBAL } from "./global";

@Injectable()
export class CuentasService {
    public url: string;

    constructor(
        public _http: HttpClient
    ) {
        this.url = GLOBAL.url;
    }

    getCuentas() {
        return this._http.get(this.url + 'cuentas').pipe(
            map(response => {
                console.log(response);
                return response
            })
        );
    }

    getCuenta(id: number) {
        let params = {
            'id': id
        }
        return this._http.get(this.url + 'cuentas', { params }).pipe(
            map(response => { return response })
        )
    }

    addCuenta(id_usuario: any, cuenta: Cuenta) {
        let body = {
            'correo': cuenta.correo,
            'contrasena': cuenta.contrasena,
            'estado_sesion': cuenta.estado_sesion,
            'id_usuario': id_usuario
        }
        console.log(body);
        let options = {
            'headers': {
                'Content-Type': 'application/json'
            }
        }
        return this._http.post(this.url + 'cuentas', body, options).pipe(
            map(response => { return response })
        );
    }
}
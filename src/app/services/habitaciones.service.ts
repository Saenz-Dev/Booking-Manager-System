import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
    providedIn: 'root'
})
export class HabitacionesService {
    public url: string;

    constructor(
        public _http: HttpClient
    ) {
        this.url = GLOBAL.url;
    }

    getHabitaciones() {
        const options = {
            headers: {
                'Authorization': localStorage.getItem('token') ?? ''
            }
        };
        return this._http.get(this.url + 'cabanias', options).pipe(
            map(response => {
                return response;
            })
        );
    }

    getHabitacion(id_habitacion: number) {
        const params = {
            id: id_habitacion
        };

        return this._http.get(this.url + 'cabanias', { params }).pipe(
            map(response => {
                return response;
            })
        );
    }

    postHabitacion(datos: any) {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token') ?? ''
            }
        };

        return this._http.post(this.url + 'cabanias', datos, options).pipe(
            map(response => {
                return response;
            })
        );
    }

    putHabitacion(id_habitacion: string, datos: any) {
        const params = {
            id: id_habitacion
        };

        const options = {
            params,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('token') ?? ''
            }
        };

        return this._http.put(this.url + 'cabanias', datos, options).pipe(
            map(response => {
                return response;
            })
        );
    }

    deleteHabitacion(id_habitacion: string) {
        const params = {
            id: id_habitacion
        };

        const options = {
            params,
            headers: {
                'Authorization': localStorage.getItem('token') ?? ''
            }
        };

        return this._http.delete(this.url + 'cabanias', options).pipe(
            map(response => {
                return response;
            })
        );
    }
}

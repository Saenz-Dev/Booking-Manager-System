import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
    providedIn: 'root'
})
export class HabitacionesService {
    // URL base para operaciones de cabañas.
    public url: string;

    constructor(
        public _http: HttpClient
    ) {
        this.url = GLOBAL.url;
    }

    private buildAuthHeader(): string {
        const rawToken = (localStorage.getItem('token') ?? '').trim();
        if (!rawToken) {
            return '';
        }

        return /^Bearer\s+/i.test(rawToken) ? rawToken : `Bearer ${rawToken}`;
    }

    // Obtiene el catálogo de habitaciones desde el backend.
    getHabitaciones() {
        const options = {
            headers: {
                'Authorization': this.buildAuthHeader()
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

    postReservaCabania(datos: any) {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.post(this.url + 'reservas', datos, options).pipe(
            map(response => {
                return response;
            })
        );
    }

    putReserva(datos: any) {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.put(this.url + 'reservas', datos, options).pipe(
            map(response => {
                return response;
            })
        );
    }

    getReservasByUsuario(_idUsuario?: string) {
        const options = {
            headers: {
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.get(this.url + 'reservas/mis-reservas', options).pipe(
            map(response => {
                return response;
            })
        );
    }

    getMisReservasMesas() {
        const options = {
            headers: {
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.get(this.url + 'reservas/mesas/mis-reservas', options).pipe(
            map(response => {
                return response;
            })
        );
    }

    deleteReserva(idReserva: string) {
        const params = {
            id_reserva: idReserva
        };

        const options = {
            params,
            headers: {
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.delete(this.url + 'reservas', options).pipe(
            map(response => {
                return response;
            })
        );
    }

    getDisponibilidadReserva(fechaHoraInicio: string, fechaHoraFin: string) {
        const params = {
            fecha_hora_inicio: fechaHoraInicio,
            fecha_hora_fin: fechaHoraFin,
            estado: 0  // Solo reservas confirmadas bloquean disponibilidad
        };

        const options = {
            params,
            headers: {
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.get(this.url + 'reservas/disponibilidad', options).pipe(
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

    // Métodos para mesas de restaurante
    getMesas() {
        const options = {
            headers: {
                'Authorization': this.buildAuthHeader()
            }
        };
        return this._http.get(this.url + 'mesas', options).pipe(
            map(response => {
                return response;
            })
        );
    }

    getDisponibilidadMesas(fechaHoraInicio: string, fechaHoraFin: string, idMesa?: string) {
        const params: any = {
            fecha_hora_inicio: fechaHoraInicio,
            fecha_hora_fin: fechaHoraFin
        };

        if (idMesa) {
            params.id_mesa = idMesa;
        }

        const options = {
            params,
            headers: {
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.get(this.url + 'reservas/mesas/disponibilidad', options).pipe(
            map(response => {
                return response;
            })
        );
    }

    postReservaMesa(datos: any) {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.post(this.url + 'reservas/mesas', datos, options).pipe(
            map(response => {
                return response;
            })
        );
    }

    getReservasMesas(idUsuario?: string, idReserva?: string, idMesa?: string) {
        const params: any = {};

        if (idUsuario) {
            params.id_usuario = idUsuario;
        }
        if (idReserva) {
            params.id_reserva = idReserva;
        }
        if (idMesa) {
            params.id_mesa = idMesa;
        }

        const options = {
            params,
            headers: {
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.get(this.url + 'reservas/mesas', options).pipe(
            map(response => {
                return response;
            })
        );
    }

    putReservaMesa(datos: any) {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.put(this.url + 'reservas/mesas', datos, options).pipe(
            map(response => {
                return response;
            })
        );
    }

    deleteReservaMesa(idReserva: string) {
        const params = {
            id_reserva: idReserva
        };

        const options = {
            params,
            headers: {
                'Authorization': this.buildAuthHeader()
            }
        };

        return this._http.delete(this.url + 'reservas/mesas', options).pipe(
            map(response => {
                return response;
            })
        );
    }
}

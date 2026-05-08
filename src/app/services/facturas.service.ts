import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
    providedIn: 'root'
})
export class FacturasService {
    public url: string;

    constructor(private _http: HttpClient) {
        this.url = `${GLOBAL.url}facturas`;
    }

    private buildAuthHeader(): string {
        const rawToken = (localStorage.getItem('token') ?? '').trim();
        if (!rawToken) {
            return '';
        }

        return /^Bearer\s+/i.test(rawToken) ? rawToken : `Bearer ${rawToken}`;
    }

    getFacturas(idFactura?: string, idReserva?: string) {
        const params: any = {};

        if (idFactura) {
            params.id_factura = idFactura;
        }

        if (idReserva) {
            params.id_reserva = idReserva;
        }

        const options = {
            params,
            headers: {
                Authorization: this.buildAuthHeader()
            }
        };

        return this._http.get(this.url, options).pipe(
            map((response) => {
                return response;
            })
        );
    }

    generarFactura(idReserva: number) {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.buildAuthHeader()
            }
        };

        return this._http.post(`${this.url}/generar`, { id_reserva: idReserva }, options).pipe(
            map((response) => {
                return response;
            })
        );
    }

    cambiarEstadoFactura(idFactura: number, estado: 'paga' | 'pendiente') {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.buildAuthHeader()
            }
        };

        return this._http.put(`${this.url}/estado`, { id_factura: idFactura, estado }, options).pipe(
            map((response) => {
                return response;
            })
        );
    }

    obtenerFacturaPdfHtml(idFactura: number) {
        const options = {
            params: {
                id_factura: String(idFactura)
            },
            headers: {
                Authorization: this.buildAuthHeader()
            },
            responseType: 'text' as const
        };

        return this._http.get(`${this.url}/pdf`, options);
    }

    enviarCorreoFactura(idFactura: number) {
        const body = {
            id_factura: idFactura,
            correo: localStorage.getItem('correo')??'',
            nombres: localStorage.getItem('nombres')??'',
            apellidos: localStorage.getItem('apellidos')??''
        }
        const options = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.buildAuthHeader()
            },
            body
        };

        return this._http.post(`${this.url}/enviar-correo`, body, options);
    }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TipoNotificacion = 'success' | 'error' | 'info' | 'warning';

export interface Notificacion {
    id: number;
    tipo: TipoNotificacion;
    mensaje: string;
    titulo?: string;
    duracionMs?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
    private _items = new BehaviorSubject<Notificacion[]>([]);
    readonly items$ = this._items.asObservable();

    private id = 0;

    mostrar(tipo: TipoNotificacion, mensaje: string, titulo?: string, duracionMs = 3500) {
        const nueva: Notificacion = { id: ++this.id, tipo, mensaje, titulo, duracionMs };
        const actuales = this._items.value;
        this._items.next([...actuales, nueva]);

        setTimeout(() => this.cerrar(nueva.id), duracionMs);
    }

    success(mensaje: string, titulo?: string) { this.mostrar('success', mensaje, titulo); }
    error(mensaje: string, titulo?: string) { this.mostrar('error', mensaje, titulo); }
    info(mensaje: string, titulo?: string) { this.mostrar('info', mensaje, titulo); }
    warning(mensaje: string, titulo?: string) { this.mostrar('warning', mensaje, titulo); }

    cerrar(id: number) {
        this._items.next(this._items.value.filter(x => x.id !== id));
    }
}
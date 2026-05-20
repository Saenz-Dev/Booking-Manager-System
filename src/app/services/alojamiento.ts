import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Alojamiento {
  id?: number;
  nombre: string;
  ubicacion: string;
  precio: number;
  capacidad: number;
  descripcion: string;
  imagenes: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlojamientoService {

  API = "http://localhost/Booking-Manager-System/backend-admin/";

  constructor(private http: HttpClient) {}

  obtenerAlojamientos(): Observable<Alojamiento[]> {
    return this.http.get<Alojamiento[]>(this.API + "obtener-alojamientos.php");
  }

  crearAlojamiento(data: Alojamiento) {
    return this.http.post(this.API + "crear-alojamiento.php", data);
  }

  editarAlojamiento(data: Alojamiento) {
    return this.http.post(this.API + "editar_alojamiento.php", data);
  }

  eliminarAlojamiento(id: number) {
    return this.http.post(this.API + "eliminar_alojamiento.php", {id:id});
  }

}
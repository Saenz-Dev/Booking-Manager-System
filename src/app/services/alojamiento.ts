import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GLOBAL } from './global';

export interface Alojamiento {
  id_cabania?: number | string;
  id: number;
  nombre: string;
  precio_por_persona?: number | string;
  capacidad?: number | string;
  descripcion?: string;
  ubicacion?: string;

  url_imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlojamientoService {

  API = "http://localhost/microservices/cabanias-service/index.php";

  constructor(private http: HttpClient) {}

  obtenerAlojamientos(): Observable<Alojamiento[]> {
    return this.http.get<any>(this.API + "/cabanias").pipe(
      map(response => {
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((c: any) => this.normalizarCabania(c));
        } else if (Array.isArray(response)) {
          return response.map((c: any) => this.normalizarCabania(c));
        }
        return [];
      })
    );
  }

  crearAlojamiento(data: Alojamiento) {
    // Mapear campos del formulario a los del microservicio
    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion || '',
      ubicacion: data.ubicacion || 'Sin especificar',
      capacidad: Number(data.capacidad) || 1,
      precio_por_persona: Number(data.precio_por_persona) || 0,
      url_imagen: data.url_imagen || null
    };
    return this.http.post(this.API + "/cabanias", payload);
  }

  editarAlojamiento(data: Alojamiento) {
    // Mapear campos del formulario a los del microservicio
    const payload = {
      id_cabania: data.id_cabania,
      nombre: data.nombre,
      capacidad: Number(data.capacidad) || 1,
      precio_por_persona: Number(data.precio_por_persona) || 0,
      url_imagen: data.url_imagen || null
    };
    return this.http.put(GLOBAL.url + "cabanias", payload);
  }

  eliminarAlojamiento(id: number) {
    return this.http.delete(this.API + "/cabanias?id_cabania=" + id);
  }

  private normalizarCabania(cabania: any): Alojamiento {
    return {
      id_cabania: cabania.id_cabania,
      id: Number(cabania.id_cabania),
      nombre: cabania.nombre,
      precio_por_persona: Number(cabania.precio_noche ?? cabania.precio_por_persona) || 0,
      capacidad: Number(cabania.capacidad_maxima ?? cabania.capacidad) || 0,
      descripcion: cabania.descripcion ?? '',
      ubicacion: cabania.ubicacion ?? '',
      url_imagen: cabania.url_imagen
    };
  }
}
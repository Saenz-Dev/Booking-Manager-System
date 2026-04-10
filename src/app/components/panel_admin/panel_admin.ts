import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Alojamiento {
  nombre: string;
  ubicacion: string;
  precio: number;
  capacidad: number;
  descripcion: string;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel_admin.html',
  styleUrl: './panel_admin.css'
})
export class PanelAdmin {

  seccionActual = 'dashboard';

  mostrarFormulario = false;
  editando = false;
  indexEditar: number | null = null;

  sidebarColapsado = false;

  busqueda = '';

  alojamientos: Alojamiento[] = [];

  nuevoAlojamiento: Alojamiento = {
    nombre: '',
    ubicacion: '',
    precio: 0,
    capacidad: 0,
    descripcion: ''
  };

  cambiarSeccion(seccion: string) {
    this.seccionActual = seccion;
    this.mostrarFormulario = false;
  }

  toggleSidebar() {
    this.sidebarColapsado = !this.sidebarColapsado;
  }

  mostrarCrear() {
    this.mostrarFormulario = true;
    this.editando = false;
    this.resetForm();
  }

  guardarAlojamiento() {

    if (
      !this.nuevoAlojamiento.nombre ||
      !this.nuevoAlojamiento.ubicacion ||
      !this.nuevoAlojamiento.descripcion ||
      this.nuevoAlojamiento.precio <= 0 ||
      this.nuevoAlojamiento.capacidad <= 0
    ) {
      alert("Todos los campos son obligatorios");
      return;
    }

    if (this.editando && this.indexEditar !== null) {
      this.alojamientos[this.indexEditar] = { ...this.nuevoAlojamiento };
    } else {
      this.alojamientos.push({ ...this.nuevoAlojamiento });
    }

    this.resetForm();
    this.mostrarFormulario = false;
  }

  editarAlojamiento(index: number) {
    this.nuevoAlojamiento = { ...this.alojamientos[index] };
    this.indexEditar = index;
    this.editando = true;
    this.mostrarFormulario = true;
  }

  eliminarAlojamiento(index: number) {

    if (confirm("¿Eliminar alojamiento?")) {
      this.alojamientos.splice(index, 1);
    }

  }

  resetForm() {
    this.nuevoAlojamiento = {
      nombre: '',
      ubicacion: '',
      precio: 0,
      capacidad: 0,
      descripcion: ''
    };
  }

  get alojamientosFiltrados() {

    if (!this.busqueda) return this.alojamientos;

    return this.alojamientos.filter(a =>
      a.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      a.ubicacion.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  get totalAlojamientos() {
    return this.alojamientos.length;
  }

  get capacidadTotal() {
    return this.alojamientos.reduce((acc, a) => acc + a.capacidad, 0);
  }

}
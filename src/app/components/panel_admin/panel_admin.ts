import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Alojamiento {
  id?: number;
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

export class PanelAdmin implements OnInit {

  API = "http://localhost/backend/";

  constructor(private http: HttpClient) {}

  seccionActual = 'dashboard';

  mostrarFormulario = false;
  editando = false;
  idEditar: number | null = null;

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

  ngOnInit(){
    this.cargarAlojamientos();
  }

  /* =========================
     OBTENER DATOS
  ========================= */

  cargarAlojamientos(){
    this.http.get<Alojamiento[]>(this.API + "obtener_alojamientos.php")
    .subscribe(data=>{
      this.alojamientos = data;
    });
  }

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

  /* =========================
     GUARDAR / ACTUALIZAR
  ========================= */

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

    if(this.editando){

      this.http.post(this.API + "editar_alojamiento.php", this.nuevoAlojamiento)
      .subscribe(()=>{
        this.cargarAlojamientos();
        this.resetForm();
      });

    }else{

      this.http.post(this.API + "crear_alojamiento.php", this.nuevoAlojamiento)
      .subscribe(()=>{
        this.cargarAlojamientos();
        this.resetForm();
      });

    }

    this.mostrarFormulario = false;
  }

  /* =========================
     EDITAR
  ========================= */

  editarAlojamiento(a: Alojamiento) {

    this.nuevoAlojamiento = { ...a };

    this.idEditar = a.id || null;

    this.editando = true;

    this.mostrarFormulario = true;

  }

  /* =========================
     ELIMINAR
  ========================= */

  eliminarAlojamiento(id:number){

    if(confirm("¿Eliminar alojamiento?")){

      this.http.get(this.API + "eliminar_alojamiento.php?id="+id)
      .subscribe(()=>{
        this.cargarAlojamientos();
      });

    }

  }

  /* ========================= */

  resetForm() {

    this.nuevoAlojamiento = {
      nombre: '',
      ubicacion: '',
      precio: 0,
      capacidad: 0,
      descripcion: ''
    };

  }

  /* ========================= */

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
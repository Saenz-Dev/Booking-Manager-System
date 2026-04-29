import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlojamientoService, Alojamiento } from '../../services/alojamiento';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel_admin.html',
  styleUrl: './panel_admin.css'
})
export class PanelAdminComponent implements OnInit {

  constructor(private adminService: AlojamientoService) {}

  seccionActual = 'dashboard';
  sidebarColapsado = false;

  mostrarFormulario = false;
  editando = false;
  idEditar:number|null=null;

  busqueda='';

  alojamientos:Alojamiento[]=[];

  nuevoAlojamiento:Alojamiento={
    nombre:'',
    ubicacion:'',
    precio:0,
    capacidad:0,
    descripcion:''
  };

  ngOnInit(){
    this.cargarAlojamientos();
  }

  cargarAlojamientos(){

    this.adminService.obtenerAlojamientos()
    .subscribe(data=>{
      this.alojamientos=data;
    });

  }

  cambiarSeccion(seccion:string){
    this.seccionActual=seccion;
    this.mostrarFormulario=false;
  }

  toggleSidebar(){
    this.sidebarColapsado=!this.sidebarColapsado;
  }

  mostrarCrear(){
    this.editando = false;
    this.idEditar = null;
    this.resetForm();
    this.mostrarFormulario=true;
  }

 guardarAlojamiento() {
  if (this.editando && this.idEditar !== null) {

    const datosEditar = { ...this.nuevoAlojamiento, id: this.idEditar };

    this.adminService.editarAlojamiento(datosEditar)  // ← 1 solo argumento
      .subscribe(() => {
        this.cargarAlojamientos();
        this.mostrarFormulario = false;
        this.editando = false;
        this.idEditar = null;
        this.resetForm();
      });

  } else {
    this.adminService.crearAlojamiento(this.nuevoAlojamiento)
      .subscribe(() => {
        this.cargarAlojamientos();
        this.mostrarFormulario = false;
        this.resetForm();
      });
  }
}

  editarAlojamiento(a:Alojamiento){

    this.nuevoAlojamiento={...a};
    this.idEditar=a.id || null;
    this.editando=true;
    this.mostrarFormulario=true;

  }

  eliminarAlojamiento(id:number){

    if(confirm("¿Eliminar alojamiento?")){

      this.adminService.eliminarAlojamiento(id)
      .subscribe(()=>{
        this.cargarAlojamientos();
      });

    }

  }

  resetForm(){

    this.nuevoAlojamiento={
      nombre:'',
      ubicacion:'',
      precio:0,
      capacidad:0,
      descripcion:''
    };

    this.editando = false;
    this.idEditar = null;
  }

  get alojamientosFiltrados(){

    if(!this.busqueda) return this.alojamientos;

    return this.alojamientos.filter(a=>
      a.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      a.ubicacion.toLowerCase().includes(this.busqueda.toLowerCase())
    );

  }

  get totalAlojamientos(){
    return this.alojamientos.length;
  }

  get capacidadTotal(){
    return this.alojamientos.reduce((acc,a)=>acc+a.capacidad,0);
  }

}
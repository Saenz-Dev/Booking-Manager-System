import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlojamientoService, Alojamiento } from '../../services/alojamiento';

export interface Reserva {
  id?: number;
  nombre_usuario: string;
  alojamiento_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string; // 'activa', 'completada', 'cancelada'
}

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  fecha_registro: string;
  total_reservas: number;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, DecimalPipe],
  templateUrl: './panel_admin.html',
  styleUrl: './panel_admin.css'
})
export class PanelAdminComponent implements OnInit {

  constructor(
    private adminService: AlojamientoService,
    private cdr: ChangeDetectorRef
  ) { }

  seccionActual = 'alojamientos';
  sidebarColapsado = false;

  mostrarFormulario = false;
  editando = false;
  idEditar: number | null = null;

  busqueda = '';

  alojamientos: Alojamiento[] = [];
  nuevoAlojamiento: Alojamiento = this.formVacio();

  imagenesSeleccionadas: File[] = [];
  imagenesPreview: string[] = [];

  modalVisible = false;
  modalMensaje = '';
  modalTipo: 'confirm' | 'alert' = 'alert';
  modalAccion: (() => void) | null = null;

  reservas: Reserva[] = [];
  filtroUsuario = '';
  filtroFecha = '';

  usuarios: Usuario[] = [];

  ngOnInit(): void {
    this.cargarAlojamientos();
    this.cargarReservas(); 
    this.cargarUsuarios();
  }

  // ==========================================
  // LÓGICA DE ALOJAMIENTOS
  // ==========================================
  cargarAlojamientos(): void {
    this.adminService.obtenerAlojamientos().subscribe({
      next: data => {
        this.alojamientos = data ?? [];
        this.cdr.detectChanges();
      },
      error: () => this.mostrarAlerta('Error al cargar alojamientos')
    });
  }

  parseImagenes(raw: any): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("El JSON de imágenes está corrupto o incompleto. Verifica el tipo de dato en tu BD:", raw);
      return [];
    }
  }

  cambiarSeccion(seccion: string): void {
    this.seccionActual = seccion;
    this.cancelarFormulario();
  }

  toggleSidebar(): void {
    this.sidebarColapsado = !this.sidebarColapsado;
  }

  mostrarCrear(): void {
    this.editando = false;
    this.idEditar = null;
    this.nuevoAlojamiento = this.formVacio();
    this.resetImagenes();
    this.mostrarFormulario = true;
  }

  editarAlojamiento(a: Alojamiento): void {
    this.nuevoAlojamiento = { ...a };
    this.idEditar = a.id ?? (a as any)['ID'] ?? null;
    this.editando = true;
    this.imagenesPreview = this.parseImagenes(a.imagenes);
    this.imagenesSeleccionadas = [];
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.idEditar = null;
    this.nuevoAlojamiento = this.formVacio();
    this.resetImagenes();
  }

  guardarAlojamiento(): void {
    const payload: Alojamiento = {
      ...this.nuevoAlojamiento,
      imagenes: JSON.stringify(this.imagenesPreview)
    };

    const request = this.editando && this.idEditar !== null
      ? this.adminService.editarAlojamiento({ ...payload, id: this.idEditar })
      : this.adminService.crearAlojamiento(payload);

    request.subscribe({
      next: () => {
        this.cargarAlojamientos();
        this.cancelarFormulario();
        this.mostrarAlerta(this.editando ? '✓ Actualizado correctamente' : '✓ Creado correctamente');
      },
      error: (err) => {
        console.log('ERROR COMPLETO:', err);
        this.mostrarAlerta(this.editando ? 'Error al actualizar' : 'Error al crear');
      }
    });
  }

  confirmarEliminar(id: number): void {
    this.mostrarConfirmacion(
      '¿Seguro que deseas eliminar este alojamiento?',
      () => this.eliminarAlojamiento(id)
    );
  }

  private eliminarAlojamiento(id: number): void {
    this.adminService.eliminarAlojamiento(id).subscribe({
      next: () => {
        this.cargarAlojamientos();
        this.mostrarAlerta('Eliminado correctamente');
      },
      error: () => this.mostrarAlerta('Error al eliminar')
    });
  }

  // ==========================================
  // MANEJO DE IMÁGENES ASÍNCRONAS
  // ==========================================
  onImagenesSeleccionadas(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    Array.from(input.files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        if (result) {
          this.imagenesPreview.push(result);
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files?.length) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        if (result) {
          this.imagenesPreview.push(result);
          this.cdr.detectChanges();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  eliminarImagenPreview(index: number): void {
    this.imagenesPreview = this.imagenesPreview.filter((_, i) => i !== index);
    this.cdr.detectChanges();
  }

  private resetImagenes(): void {
    this.imagenesSeleccionadas = [];
    this.imagenesPreview = [];
  }

  cargarReservas(): void {
    // Petición directa al endpoint PHP de reservas
    fetch('http://localhost/backend-admin/obtener-reservas.php')
      .then(res => res.json())
      .then(data => {
        this.reservas = data ?? [];
        this.cdr.detectChanges();
      })
      .catch(err => console.error("Error cargando reservas:", err));
  }

  calcularNoches(inicio: string, fin: string): number {
    if (!inicio || !fin) return 0;
    const fecha1 = new Date(inicio);
    const fecha2 = new Date(fin);
    const diferenciaMs = fecha2.getTime() - fecha1.getTime();
    const dias = diferenciaMs / (1000 * 60 * 60 * 24);
    return dias > 0 ? Math.ceil(dias) : 0;
  }

  cargarUsuarios(): void {
  fetch('http://localhost/backend-admin/obtener-usuarios.php') 
    .then(res => res.json())
    .then(data => {
      this.usuarios = data ?? [];
      this.cdr.detectChanges();
    })
    .catch(err => console.error("Error cargando usuarios:", err));
}

  mostrarAlerta(mensaje: string): void {
    this.modalMensaje = mensaje;
    this.modalTipo = 'alert';
    this.modalAccion = null;
    this.modalVisible = true;
  }

  mostrarConfirmacion(mensaje: string, accion: () => void): void {
    this.modalMensaje = mensaje;
    this.modalTipo = 'confirm';
    this.modalAccion = accion;
    this.modalVisible = true;
  }

  confirmarModal(): void {
    this.modalAccion?.();
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.modalAccion = null;
  }

  private formVacio(): Alojamiento {
    return {
      nombre: '',
      ubicacion: '',
      precio: 0,
      capacidad: 0,
      descripcion: '',
      imagenes: '[]'
    };
  }


  get alojamientosFiltrados(): Alojamiento[] {
    if (!this.busqueda.trim()) return this.alojamientos;
    const q = this.busqueda.toLowerCase();
    return this.alojamientos.filter(a =>
      a.nombre?.toLowerCase().includes(q) ||
      a.ubicacion?.toLowerCase().includes(q)
    );
  }

  get reservasFiltradas(): Reserva[] {
    return this.reservas.filter(r => {
      const coincideUsuario = !this.filtroUsuario.trim() || 
        r.nombre_usuario?.toLowerCase().includes(this.filtroUsuario.toLowerCase());
        
      const coincideFecha = !this.filtroFecha || 
        r.fecha_inicio === this.filtroFecha || 
        r.fecha_fin === this.filtroFecha;

      return coincideUsuario && coincideFecha;
    });
  }

  get totalAlojamientos(): number {
    return this.alojamientos.length;
  }

  get capacidadTotal(): number {
    return this.alojamientos.reduce((acc, a) => acc + (a.capacidad || 0), 0);
  }
}
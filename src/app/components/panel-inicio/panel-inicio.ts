import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacionesService } from '../../services/notificaciones.service';
import { HabitacionesService } from '../../services/habitaciones.service';
import { EditarUsuarioComponent } from '../editar-usuario/editar-usuario';
import { CrearReservaComponent } from '../crear-reserva/crear-reserva';
import { EditarReservaComponent } from '../editar-reserva/editar-reserva';

type TabName = 'reservar' | 'historial' | 'facturas' | 'perfil';

interface ReservationResult {
  message: string;
  success: boolean;
}

interface ReservaHistorial {
  id_reserva: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  id_usuario: string;
  estado: string;
  cantidad_personas: string;
  nombre_cabania?: string;
}

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [CommonModule, EditarUsuarioComponent, CrearReservaComponent, EditarReservaComponent],
  templateUrl: './panel-inicio.html',
  styleUrl: './panel-inicio.css'
})
export class PanelInicio implements OnInit {
  // Pestaña activa del panel.
  activeTab: TabName = 'reservar';
  usuarioSesion = 'Usuario';
  usuarioIniciales = 'US';

  toastMessage = '';
  toastVisible = false;
  mostrarModalCerrarSesion = false;
  mostrarModalCancelarReserva = false;
  mostrarModalEditarReserva = false;
  isCancellingReserva = false;
  isConfirmingReserva = false;
  reservaConfirmandoId: string | null = null;
  reservaSeleccionadaParaCancelar: ReservaHistorial | null = null;
  reservaSeleccionadaParaEditar: ReservaHistorial | null = null;
  reservasHistorial: ReservaHistorial[] = [];
  isLoadingHistorial = false;

  constructor(
    private router: Router,
    private _notificacionesService: NotificacionesService,
    private _habitacionesService: HabitacionesService
  ) {}

  ngOnInit(): void {
    // Verifica sesión y carga nombre del usuario.
    const token = localStorage.getItem('token');
    if (!token) {
      this._notificacionesService.warning('Debe iniciar sesión', 'Sesión');
      this.router.navigate(['/login']);
      return;
    }
    
    this.usuarioSesion = `${localStorage.getItem('nombres') ?? ''} ${localStorage.getItem('apellidos') ?? ''}`.trim() || 'Usuario';
    this.usuarioIniciales = this.obtenerIniciales(this.usuarioSesion);
    this.cargarHistorialReservas();
  }

  showTab(name: TabName): void {
    this.activeTab = name;
  }

  onReservationConfirmed(result: ReservationResult): void {
    if (result.success) {
      this._notificacionesService.success(result.message, 'Reserva');
      this.cargarHistorialReservas();
      window.setTimeout(() => this.showTab('historial'), 1800);
      return;
    }

    this._notificacionesService.warning(result.message, 'Reserva');
  }

  showInvoice(): void {
    this.showTab('facturas');
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.toastVisible = true;
    window.setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }

  abrirModalCerrarSesion(): void {
    this.mostrarModalCerrarSesion = true;
  }

  cancelarCerrarSesion(): void {
    this.mostrarModalCerrarSesion = false;
  }

  cerrarSesion(): void {
    this.mostrarModalCerrarSesion = false;
    this._notificacionesService.info('Sesión cerrada correctamente.', 'Sesión');
    localStorage.removeItem('cuenta');
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('id_cuenta');
    localStorage.removeItem('nombres');
    localStorage.removeItem('apellidos');
    this.router.navigate(['/login']);
  }

  actualizarSesionDesdePerfil(profile: { nombres: string; apellidos: string }): void {
    this.usuarioSesion = `${profile.nombres ?? ''} ${profile.apellidos ?? ''}`.trim() || 'Usuario';
    this.usuarioIniciales = this.obtenerIniciales(this.usuarioSesion);
  }

  getEstadoReservaLabel(estado: string): string {
    const estadoValue = String(estado);
    if (estadoValue === '0') {
      return 'Confirmada';
    }

    if (estadoValue === '1') {
      return 'Pendiente';
    }

    return 'Cancelada';
  }

  getEstadoReservaClass(estado: string): string {
    const estadoValue = String(estado);
    if (estadoValue === '0') {
      return 'status-confirmed';
    }

    if (estadoValue === '1') {
      return 'status-pending';
    }

    return 'status-cancelled';
  }

  getResumenReserva(reserva: ReservaHistorial): string {
    const inicio = this.formatDateLabel(reserva.fecha_hora_inicio);
    const fin = this.formatDateLabel(reserva.fecha_hora_fin);
    const noches = this.getNochesReserva(reserva.fecha_hora_inicio, reserva.fecha_hora_fin);
    const nochesLabel = noches === 1 ? '1 noche' : `${noches} noches`;
    const personas = Number(reserva.cantidad_personas);
    const personasLabel = personas === 1 ? '1 persona' : `${personas} personas`;
    const cabaniaLabel = reserva.nombre_cabania ? `Cabaña ${reserva.nombre_cabania}` : 'Cabaña sin nombre';

    return `${cabaniaLabel} · Check-in ${inicio} · Check-out ${fin} · ${nochesLabel} · ${personasLabel}`;
  }

  puedeCancelarReserva(reserva: ReservaHistorial): boolean {
    return !this.estaReservaConfirmada(reserva);
  }

  puedeConfirmarReserva(reserva: ReservaHistorial): boolean {
    return !this.estaReservaConfirmada(reserva);
  }

  estaProcesandoConfirmacion(reserva: ReservaHistorial): boolean {
    return this.isConfirmingReserva && this.reservaConfirmandoId === String(reserva.id_reserva);
  }

  modificarReserva(reserva: ReservaHistorial): void {
    if (this.estaReservaConfirmada(reserva)) {
      return;
    }

    this.reservaSeleccionadaParaEditar = reserva;
    this.mostrarModalEditarReserva = true;
  }

  cerrarModalEditarReserva(): void {
    this.mostrarModalEditarReserva = false;
    this.reservaSeleccionadaParaEditar = null;
  }

  onReservaModificada(result: ReservationResult): void {
    if (result.success) {
      this._notificacionesService.success(result.message, 'Reserva');
      this.cerrarModalEditarReserva();
      this.cargarHistorialReservas();
      return;
    }

    this._notificacionesService.warning(result.message, 'Reserva');
  }

  confirmarReserva(reserva: ReservaHistorial): void {
    if (!this.puedeConfirmarReserva(reserva) || this.isConfirmingReserva) {
      return;
    }

    const payload = {
      fecha_hora_inicio: reserva.fecha_hora_inicio,
      fecha_hora_fin: reserva.fecha_hora_fin,
      id_usuario: reserva.id_usuario,
      estado: 0,
      cantidad_personas: reserva.cantidad_personas,
      nombre_cabania: reserva.nombre_cabania ?? '',
      id_reserva: Number(reserva.id_reserva)
    };

    this.isConfirmingReserva = true;
    this.reservaConfirmandoId = String(reserva.id_reserva);
    this._habitacionesService.putReserva(payload).subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const message = String(response?.message ?? 'Reserva confirmada exitosamente');

        if (statusOk) {
          this._notificacionesService.success(message, 'Reserva');
          this.cargarHistorialReservas();
          return;
        }

        this._notificacionesService.warning(message, 'Reserva');
      },
      error: (error: any) => {
        const message = String(error?.error?.message ?? 'No fue posible confirmar la reserva');
        this._notificacionesService.warning(message, 'Reserva');
      },
      complete: () => {
        this.isConfirmingReserva = false;
        this.reservaConfirmandoId = null;
      }
    });
  }

  abrirModalCancelarReserva(reserva: ReservaHistorial): void {
    this.reservaSeleccionadaParaCancelar = reserva;
    this.mostrarModalCancelarReserva = true;
  }

  cerrarModalCancelarReserva(): void {
    if (this.isCancellingReserva) {
      return;
    }

    this.mostrarModalCancelarReserva = false;
    this.reservaSeleccionadaParaCancelar = null;
  }

  confirmarCancelarReserva(): void {
    const reserva = this.reservaSeleccionadaParaCancelar;
    if (!reserva || this.isCancellingReserva) {
      return;
    }

    this.isCancellingReserva = true;
    this._habitacionesService.deleteReserva(reserva.id_reserva).subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const message = String(response?.message ?? 'Reserva eliminada exitosamente');

        if (statusOk) {
          this._notificacionesService.success(message, 'Reserva');
          this.mostrarModalCancelarReserva = false;
          this.reservaSeleccionadaParaCancelar = null;
          this.cargarHistorialReservas();
          return;
        }

        this._notificacionesService.warning(message, 'Reserva');
      },
      error: (error: any) => {
        const message = String(error?.error?.message ?? 'No fue posible cancelar la reserva');
        this._notificacionesService.warning(message, 'Reserva');
      },
      complete: () => {
        this.isCancellingReserva = false;
      }
    });
  }

  private cargarHistorialReservas(): void {
    const idUsuario = localStorage.getItem('id_usuario') ?? '';
    if (!idUsuario) {
      this.reservasHistorial = [];
      return;
    }

    this.isLoadingHistorial = true;
    this._habitacionesService.getReservasByUsuario(idUsuario).subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const data = Array.isArray(response?.data) ? response.data : [];

        this.reservasHistorial = statusOk ? data.map((reserva: any) => this.normalizarReservaHistorial(reserva)) : [];
      },
      error: () => {
        this.reservasHistorial = [];
      },
      complete: () => {
        this.isLoadingHistorial = false;
      }
    });
  }

  private formatDateLabel(dateTime: string): string {
    const normalized = dateTime.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return dateTime;
    }

    return parsed.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short'
    });
  }

  private getNochesReserva(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio.replace(' ', 'T'));
    const fin = new Date(fechaFin.replace(' ', 'T'));
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return 0;
    }

    const diff = Math.round((fin.getTime() - inicio.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }

  private obtenerIniciales(texto: string): string {
    const partes = texto.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'US';

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase();
  }

  private normalizarReservaHistorial(reserva: any): ReservaHistorial {
    const nombreCabania =
      reserva?.nombre_cabania ??
      reserva?.nombreCabania ??
      reserva?.nombre_habitacion ??
      reserva?.nombreHabitacion ??
      reserva?.cabania ??
      '';

    return {
      id_reserva: String(reserva?.id_reserva ?? ''),
      fecha_hora_inicio: String(reserva?.fecha_hora_inicio ?? ''),
      fecha_hora_fin: String(reserva?.fecha_hora_fin ?? ''),
      id_usuario: String(reserva?.id_usuario ?? ''),
      estado: String(reserva?.estado ?? ''),
      cantidad_personas: String(reserva?.cantidad_personas ?? ''),
      nombre_cabania: String(nombreCabania)
    };
  }

  estaReservaConfirmada(reserva: ReservaHistorial): boolean {
    return String(reserva.estado) === '0';
  }
}

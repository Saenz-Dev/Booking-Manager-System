import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { NotificacionesService } from '../../services/notificaciones.service';
import { HabitacionesService } from '../../services/habitaciones.service';
import { GLOBAL } from '../../services/global';
import { EditarUsuarioComponent } from '../editar-usuario/editar-usuario';
import { CrearReservaComponent } from '../crear-reserva/crear-reserva';
import { EditarReservaComponent } from '../editar-reserva/editar-reserva';
import { FacturasService } from '../../services/facturas.service';
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
  descripcion?: string;
  nombre_cabania?: string;
  tipo_reserva: 'cabaña' | 'mesa';
  id_mesa?: string;
  nombre_mesa?: string;
}

interface FacturaHistorial {
  id_factura: string;
  numero_factura: string;
  fecha_emision: string;
  subtotal: number;
  impuestos: number;
  estado: 'paga' | 'pendiente';
  id_reserva: string;
  total: number;
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
  facturasHistorial: FacturaHistorial[] = [];
  isLoadingFacturas = false;
  isGeneratingFactura = false;
  isUpdatingFacturaEstado = false;
  facturaEstadoUpdatingId: string | null = null;
  reservaGenerandoFacturaId: string | null = null;
  private facturasUrl = `${GLOBAL.url}facturas`;
  

  constructor(
    private router: Router,
    private _notificacionesService: NotificacionesService,
    private _habitacionesService: HabitacionesService,
    private _facturasService: FacturasService,
    private _http: HttpClient
  ) { }

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

    if (name === 'facturas') {
      this.cargarFacturas();
    }
  }

  onReservationConfirmed(result: ReservationResult): void {
    if (result.success) {
      this._notificacionesService.success(result.message, 'Reserva');
      this.cargarHistorialReservas();
      this.cargarFacturas();
      this.showTab('historial');
      return;
    }

    this._notificacionesService.warning(result.message, 'Reserva');
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
    const personas = Number(reserva.cantidad_personas);
    const personasLabel = personas === 1 ? '1 persona' : `${personas} personas`;

    if (reserva.tipo_reserva === 'mesa') {
      const horaInicio = reserva.fecha_hora_inicio.split(' ')[1] ?? '00:00:00';
      const horaFin = reserva.fecha_hora_fin.split(' ')[1] ?? '00:00:00';
      const mesaNombre = reserva.id_mesa ? `Mesa ${reserva.id_mesa}` : 'Mesa sin nombre';
      return `${mesaNombre} · ${inicio} ${horaInicio.substring(0, 5)} a ${fin} ${horaFin.substring(0, 5)} · ${personasLabel}`;
    } else {
      const noches = this.getNochesReserva(reserva.fecha_hora_inicio, reserva.fecha_hora_fin);
      const nochesLabel = noches === 1 ? '1 noche' : `${noches} noches`;
      const cabaniaLabel = reserva.nombre_cabania ? `Cabaña ${reserva.nombre_cabania}` : 'Cabaña sin nombre';
      return `${cabaniaLabel} · Check-in ${inicio} · Check-out ${fin} · ${nochesLabel} · ${personasLabel}`;
    }
  }

  getTituloReserva(reserva: ReservaHistorial): string {
    const fechaReserva = this.formatDateLabel(reserva.fecha_hora_inicio);
    const tipo = reserva.tipo_reserva === 'mesa' ? 'Reserva de Mesa' : 'Reserva';
    return `${tipo} ${fechaReserva}`;
  }

  getIconoReserva(reserva: ReservaHistorial): string {
    return reserva.tipo_reserva === 'mesa' ? '🍽' : '🛏';
  }

  getTipoReservaLabel(reserva: ReservaHistorial | null): string {
    if (!reserva) {
      return 'reserva';
    }

    return reserva.tipo_reserva === 'mesa' ? 'mesa' : 'cabaña';
  }

  getTituloEdicionReserva(reserva: ReservaHistorial | null): string {
    if (!reserva) {
      return 'Modificar reserva';
    }

    return reserva.tipo_reserva === 'mesa' ? 'Modificar mesa' : 'Modificar cabaña';
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
    if (this.estaReservaConfirmada(reserva) || this.isReservationExpiredAndNotConfirmed(reserva)) {
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
      this.cargarFacturas();
      return;
    }

    this._notificacionesService.warning(result.message, 'Reserva');
  }

  confirmarReserva(reserva: ReservaHistorial): void {
    if (this.isReservationExpiredAndNotConfirmed(reserva) || !this.puedeConfirmarReserva(reserva) || this.isConfirmingReserva) {
      return;
    }

    const esMesa = reserva.tipo_reserva === 'mesa';
    const payload = esMesa
      ? {
        id_reserva: Number(reserva.id_reserva),
        fecha_hora_inicio: reserva.fecha_hora_inicio,
        fecha_hora_fin: reserva.fecha_hora_fin,
        id_usuario: reserva.id_usuario,
        estado: 0,
        cantidad_personas: reserva.cantidad_personas,
        descripcion: reserva.descripcion ?? '',
        id_mesa: reserva.id_mesa ?? ''
      }
      : {
        id_reserva: Number(reserva.id_reserva),
        fecha_hora_inicio: reserva.fecha_hora_inicio,
        fecha_hora_fin: reserva.fecha_hora_fin,
        id_usuario: reserva.id_usuario,
        estado: 0,
        cantidad_personas: reserva.cantidad_personas,
        descripcion: reserva.descripcion ?? '',
        nombre_cabania: reserva.nombre_cabania ?? ''
      };

    this.isConfirmingReserva = true;
    this.reservaConfirmandoId = String(reserva.id_reserva);
    const confirmRequest = esMesa
      ? this._habitacionesService.putReservaMesa(payload)
      : this._habitacionesService.putReserva(payload);

    confirmRequest.pipe(
      finalize(() => {
        this.isConfirmingReserva = false;
        this.reservaConfirmandoId = null;
      })
    ).subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200 || response?.success === true;
        const message = String(response?.message ?? 'Reserva confirmada exitosamente');

        if (statusOk) {
          this._notificacionesService.success(message, 'Reserva');
          this.cargarHistorialReservas();
          this.cargarFacturas();
          return;
        }

        this._notificacionesService.warning(message, 'Reserva');
      },
      error: (error: any) => {
        const message = String(error?.error?.message ?? 'No fue posible confirmar la reserva');
        this._notificacionesService.warning(message, 'Reserva');
      }
    });
  }

  abrirModalCancelarReserva(reserva: ReservaHistorial): void {
    if (this.isReservationExpiredAndNotConfirmed(reserva)) {
      return;
    }

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
    const esMesa = reserva.tipo_reserva === 'mesa';
    const deleteRequest = esMesa
      ? this._habitacionesService.deleteReservaMesa(reserva.id_reserva)
      : this._habitacionesService.deleteReserva(reserva.id_reserva);

    deleteRequest.subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const message = String(response?.message ?? 'Reserva eliminada exitosamente');

        if (statusOk) {
          this._notificacionesService.success(message, 'Reserva');
          this.mostrarModalCancelarReserva = false;
          this.reservaSeleccionadaParaCancelar = null;
          this.cargarHistorialReservas();
          this.cargarFacturas();
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
    const todasLasReservas: ReservaHistorial[] = [];
    let cargasCabañasCompleta = false;
    let cargasMesasCompleta = false;

    // Cargar reservas de cabañas del usuario autenticado
    this._habitacionesService.getReservasByUsuario(idUsuario).subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const data = Array.isArray(response?.data) ? response.data : [];

        if (statusOk) {
          const reservasCabania = data.map((reserva: any) => this.normalizarReservaHistorial(reserva, 'cabaña'));
          todasLasReservas.push(...reservasCabania);
        }

        cargasCabañasCompleta = true;
        this.finalizarCargaHistorial(todasLasReservas, cargasCabañasCompleta, cargasMesasCompleta);
      },
      error: () => {
        cargasCabañasCompleta = true;
        this.finalizarCargaHistorial(todasLasReservas, cargasCabañasCompleta, cargasMesasCompleta);
      }
    });

    // Cargar reservas de mesas del usuario autenticado
    this._habitacionesService.getMisReservasMesas().subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const data = Array.isArray(response?.data) ? response.data : [];

        if (statusOk) {
          const reservasMesas = data.map((reserva: any) => this.normalizarReservaHistorial(reserva, 'mesa'));
          todasLasReservas.push(...reservasMesas);
        }

        cargasMesasCompleta = true;
        this.finalizarCargaHistorial(todasLasReservas, cargasCabañasCompleta, cargasMesasCompleta);
      },
      error: () => {
        cargasMesasCompleta = true;
        this.finalizarCargaHistorial(todasLasReservas, cargasCabañasCompleta, cargasMesasCompleta);
      }
    });
  }

  cargarFacturas(): void {
    this.isLoadingFacturas = true;
    this._http.get(this.facturasUrl, {
      headers: {
        Authorization: this.buildAuthHeader()
      }
    }).subscribe({
      next: (response: any) => {
        const statusOk = Number(response?.status ?? response?.code ?? 200) >= 200
          && Number(response?.status ?? response?.code ?? 200) < 300;
        const data = response?.data;
        const reservasDelUsuario = new Set(this.reservasHistorial.map((reserva) => reserva.id_reserva));

        if (!statusOk) {
          this.facturasHistorial = [];
          return;
        }

        if (Array.isArray(data)) {
          this.facturasHistorial = data
            .map((factura: any) => this.normalizarFacturaHistorial(factura))
            .filter((factura: FacturaHistorial) => reservasDelUsuario.has(factura.id_reserva));
          return;
        }

        if (data && typeof data === 'object') {
          const factura = this.normalizarFacturaHistorial(data);
          this.facturasHistorial = reservasDelUsuario.has(factura.id_reserva) ? [factura] : [];
          return;
        }

        this.facturasHistorial = [];
      },
      error: () => {
        this.facturasHistorial = [];
      },
      complete: () => {
        this.isLoadingFacturas = false;
      }
    });
  }

  generarFacturaDesdeReserva(reserva: ReservaHistorial): void {
    if (this.isGeneratingFactura) {
      return;
    }

    if (!this.estaReservaConfirmada(reserva)) {
      this._notificacionesService.warning('Solo puedes facturar reservas confirmadas', 'Facturas');
      return;
    }

    this.isGeneratingFactura = true;
    this.reservaGenerandoFacturaId = reserva.id_reserva;
    this._http.post(`${this.facturasUrl}/generar`, {
      id_reserva: Number(reserva.id_reserva)
    }, {
      headers: {
        Authorization: this.buildAuthHeader(),
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        const status = Number(response?.status ?? response?.code ?? 0);
        const statusOk = status >= 200 && status < 300;
        const message = String(response?.message ?? 'Factura creada exitosamente');

        if (statusOk) {
          this._notificacionesService.success(message, 'Facturas');
          this.cargarFacturas();
          return;
        }

        this._notificacionesService.warning(message, 'Facturas');
      },
      error: (error: any) => {
        const message = String(error?.error?.message ?? 'No fue posible generar la factura');
        this._notificacionesService.warning(message, 'Facturas');
      },
      complete: () => {
        this.isGeneratingFactura = false;
        this.reservaGenerandoFacturaId = null;
      }
    });
  }

  cambiarEstadoFactura(factura: FacturaHistorial, estado: 'paga' | 'pendiente'): void {
    if (this.isUpdatingFacturaEstado || factura.estado === estado) {
      return;
    }

    this.isUpdatingFacturaEstado = true;
    this.facturaEstadoUpdatingId = factura.id_factura;

    this._http.put(`${this.facturasUrl}/estado`, {
      id_factura: Number(factura.id_factura),
      estado
    }, {
      headers: {
        Authorization: this.buildAuthHeader(),
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        const status = Number(response?.status ?? response?.code ?? 0);
        const statusOk = status >= 200 && status < 300;
        const message = String(response?.message ?? 'Estado de factura actualizado exitosamente');

        if (statusOk) {
          this._notificacionesService.success(message, 'Facturas');
          this.cargarFacturas();
          return;
        }

        this._notificacionesService.warning(message, 'Facturas');
      },
      error: (error: any) => {
        const message = String(error?.error?.message ?? 'No fue posible actualizar el estado de la factura');
        this._notificacionesService.warning(message, 'Facturas');
      },
      complete: () => {
        this.isUpdatingFacturaEstado = false;
        this.facturaEstadoUpdatingId = null;
      }
    });
  }

  verFacturaPdf(factura: FacturaHistorial): void {
    this._http.get(`${this.facturasUrl}/pdf`, {
      params: {
        id_factura: String(factura.id_factura)
      },
      headers: {
        Authorization: this.buildAuthHeader()
      },
      responseType: 'text'
    }).subscribe({
      next: (html: string) => {
        const popup = window.open('', '_blank');
        if (!popup) {
          this._notificacionesService.warning('Permite ventanas emergentes para ver/imprimir la factura', 'Facturas');
          return;
        }

        popup.document.open();
        popup.document.write(html);
        popup.document.close();
      },
      error: (error: any) => {
        const message = String(error?.error?.message ?? 'No fue posible abrir la factura para impresión');
        this._notificacionesService.warning(message, 'Facturas');
      }
    });
  }

  getReservasFacturables(): ReservaHistorial[] {
    const facturasPorReserva = new Set(this.facturasHistorial.map((factura) => factura.id_reserva));
    return this.reservasHistorial.filter((reserva) => this.estaReservaConfirmada(reserva) && !facturasPorReserva.has(reserva.id_reserva));
  }

  getFacturasDelUsuario(): FacturaHistorial[] {
    const reservasDelUsuario = new Set(this.reservasHistorial.map((reserva) => reserva.id_reserva));
    return this.facturasHistorial.filter((factura) => reservasDelUsuario.has(factura.id_reserva));
  }

  estaGenerandoFacturaReserva(reserva: ReservaHistorial): boolean {
    return this.isGeneratingFactura && this.reservaGenerandoFacturaId === reserva.id_reserva;
  }

  estaActualizandoFactura(factura: FacturaHistorial): boolean {
    return this.isUpdatingFacturaEstado && this.facturaEstadoUpdatingId === factura.id_factura;
  }

  getEstadoFacturaClass(estado: string): string {
    return estado === 'paga' ? 'status-confirmed' : 'status-pending';
  }

  formatCurrency(value: number): string {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number.isFinite(amount) ? amount : 0);
  }

  private finalizarCargaHistorial(todasLasReservas: ReservaHistorial[], cargasCabañasCompleta: boolean, cargasMesasCompleta: boolean): void {
    if (cargasCabañasCompleta && cargasMesasCompleta) {
      // Ordenar por fecha descendente
      this.reservasHistorial = todasLasReservas.sort((a, b) => {
        const fechaA = new Date(a.fecha_hora_inicio.replace(' ', 'T')).getTime();
        const fechaB = new Date(b.fecha_hora_inicio.replace(' ', 'T')).getTime();
        return fechaB - fechaA;
      });
      this.isLoadingHistorial = false;
    }
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

  private normalizarReservaHistorial(reserva: any, tipoReserva: 'cabaña' | 'mesa'): ReservaHistorial {
    const nombreCabania =
      reserva?.nombre_cabania ??
      reserva?.nombreCabania ??
      reserva?.nombre_habitacion ??
      reserva?.nombreHabitacion ??
      reserva?.cabania ??
      '';

    const nombreMesa =
      reserva?.nombre ??
      reserva?.numero ??
      '';

    return {
      id_reserva: String(reserva?.id_reserva ?? ''),
      fecha_hora_inicio: String(reserva?.fecha_hora_inicio ?? ''),
      fecha_hora_fin: String(reserva?.fecha_hora_fin ?? ''),
      id_usuario: String(reserva?.id_usuario ?? ''),
      estado: String(reserva?.estado ?? ''),
      cantidad_personas: String(reserva?.cantidad_personas ?? ''),
      nombre_cabania: String(nombreCabania),
      descripcion: String(reserva?.descripcion ?? ''),
      tipo_reserva: tipoReserva,
      id_mesa: String(reserva?.id_mesa ?? ''),
      nombre_mesa: String(nombreMesa)
    };
  }

  private normalizarFacturaHistorial(factura: any): FacturaHistorial {
    const estadoRaw = String(factura?.estado ?? 'pendiente').toLowerCase();
    const estado = estadoRaw === 'paga' ? 'paga' : 'pendiente';

    return {
      id_factura: String(factura?.id_factura ?? ''),
      numero_factura: String(factura?.numero_factura ?? factura?.id_factura ?? ''),
      fecha_emision: String(factura?.fecha_emision ?? ''),
      subtotal: Number(factura?.subtotal ?? 0),
      impuestos: Number(factura?.impuestos ?? 0),
      estado,
      id_reserva: String(factura?.id_reserva ?? ''),
      total: Number(factura?.total ?? 0)
    };
  }

  private buildAuthHeader(): string {
    const rawToken = (localStorage.getItem('token') ?? '').trim();
    if (!rawToken) {
      return '';
    }

    return /^Bearer\s+/i.test(rawToken) ? rawToken : `Bearer ${rawToken}`;
  }

  isReservationExpiredAndNotConfirmed(reserva: ReservaHistorial): boolean {
    if (this.estaReservaConfirmada(reserva)) return false;

    const fechaFinRaw = String(reserva.fecha_hora_fin ?? '').replace(' ', 'T');
    const fechaFin = new Date(fechaFinRaw);
    if (Number.isNaN(fechaFin.getTime())) return false;

    const ahora = new Date();
    const finOnly = new Date(fechaFin.getFullYear(), fechaFin.getMonth(), fechaFin.getDate());
    const todayOnly = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    return finOnly < todayOnly;
  }

  estaReservaConfirmada(reserva: ReservaHistorial): boolean {
    return String(reserva.estado) === '0';
  }

  enviarFactura(idFactura: string): void {
    this._facturasService.enviarCorreoFactura(Number(idFactura)).subscribe({
      
      next: (response: any) => {
        console.log(response.status);
        if (response.status != 200) {
          this._notificacionesService.error(response.message, 'Error al enviar factura');
        } else {
          this._notificacionesService.success(response.message, 'Factura Enviada');
        }
      }
    });
  }
}

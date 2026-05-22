import { CommonModule, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Alojamiento, AlojamientoService } from '../../services/alojamiento';
import { HabitacionesService } from '../../services/habitaciones.service';
import { FacturasService } from '../../services/facturas.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { UserService } from '../../services/users.service';

type TipoReserva = 'cabaña' | 'mesa';

export interface ReservaAdmin {
  id_reserva: string;
  id_usuario: string;
  nombre_usuario: string;
  correo_usuario: string;
  tipo_reserva: TipoReserva;
  nombre_recurso: string;
  detalle_recurso: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  cantidad_personas: number;
  estado: string;
}

export interface Usuario {
  id?: number;
  id_usuario?: number | string;
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  nombre_completo?: string;
  id_display?: string;
  email_display?: string;
  email?: string;
  correo?: string;
  telefono?: string | number;
  fechaNacimiento?: string;
  fecha_nacimiento?: string;
  tipo_documento?: string;
  numero_documento?: string;
  ciudad?: string;
  estado?: number | string;
  id_rol?: number | string;
  total_reservas?: number;
  fecha_registro: string;
}

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  templateUrl: './panel_admin.html',
  styleUrl: './panel_admin.css'
})
export class PanelAdminComponent implements OnInit {
  constructor(
    private adminService: AlojamientoService,
    private habitacionesService: HabitacionesService,
    private userService: UserService,
    private facturasService: FacturasService,
    private notificacionesService: NotificacionesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  seccionActual = 'alojamientos';
  sidebarColapsado = false;

  mostrarFormulario = false;
  editando = false;
  idEditar: number | null = null;

  busqueda = '';

  alojamientos: Alojamiento[] = [];
  nuevoAlojamiento: Alojamiento = this.formVacio();

  modalVisible = false;
  modalMensaje = '';
  modalTipo: 'confirm' | 'alert' = 'alert';
  modalAccion: (() => void) | null = null;

  reservas: ReservaAdmin[] = [];
  filtroUsuario = '';
  filtroFecha = '';
  filtroTipo: 'todos' | TipoReserva = 'todos';

  usuarios: Usuario[] = [];
  filtroUsuarios = '';
  mostrarFormularioUsuario = false;
  editandoUsuario = false;
  usuarioEditando: Usuario = this.formularioUsuarioVacio();

  ngOnInit(): void {
    this.cargarAlojamientos();
    this.cargarReservas();
    this.cargarUsuarios();
    this.cargarFacturas();
    console.log('[PanelAdmin] ngOnInit - seccionActual =', this.seccionActual);
  }

  facturas: any[] = [];

  cargarFacturas(): void {
    this.facturasService.getFacturas().pipe(catchError((err) => {
      console.error('[PanelAdmin] getFacturas error', err);
      return of([]);
    })).subscribe({
      next: (data) => {
        console.log('[PanelAdmin] getFacturas raw response:', data);
        this.facturas = this.obtenerListaDeRespuesta(data);
        console.log('[PanelAdmin] facturas.length =', this.facturas.length);
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error('Error cargando facturas:', err)
    });
  }

  verFacturaPdf(factura: any): void {
    const id = Number(factura.id_factura ?? factura.id ?? factura.idFactura);
    if (!id) {
      this.mostrarAlerta('ID de factura inválido');
      return;
    }

    this.facturasService.obtenerFacturaPdfHtml(id).subscribe({
      next: (html) => {
        // abrir en nueva ventana el HTML recibido
        const w = window.open('', '_blank');
        if (w) {
          w.document.open();
          w.document.write(html || '<p>Factura vacía</p>');
          w.document.close();
        }
      },
      error: () => this.mostrarAlerta('No fue posible obtener la factura')
    });
  }

  marcarFacturaPagada(factura: any): void {
    const id = Number(factura.id_factura ?? factura.id ?? factura.idFactura);
    if (!id) {
      this.mostrarAlerta('ID de factura inválido');
      return;
    }

    this.facturasService.cambiarEstadoFactura(id, 'paga').subscribe({
      next: () => {
        this.mostrarAlerta('Factura marcada como pagada');
        this.cargarFacturas();
      },
      error: () => this.mostrarAlerta('No fue posible cambiar el estado')
    });
  }

  enviarFactura(factura: any): void {
    const id = Number(factura.id_factura ?? factura.id ?? factura.idFactura);
    if (!id) {
      this.mostrarAlerta('ID de factura inválido');
      return;
    }

    this.facturasService.enviarCorreoFactura(id).subscribe({
      next: (response: any) => {
        if (response?.status && response.status !== 200) {
          this.notificacionesService.error(response.message ?? 'Error al enviar factura', 'Error');
        } else {
          this.notificacionesService.success(response?.message ?? 'Factura enviada', 'Factura');
        }
      },
      error: (err) => {
        console.error('Error enviarFactura', err);
        this.notificacionesService.error('No fue posible enviar la factura', 'Error');
      }
    });
  }

  cargarAlojamientos(): void {
    this.adminService.obtenerAlojamientos().subscribe({
      next: (data) => {
        this.alojamientos = data ?? [];
        this.cdr.detectChanges();
      },
      error: () => this.mostrarAlerta('Error al cargar alojamientos')
    });
  }

  cambiarSeccion(seccion: string): void {
    console.log('[PanelAdmin] cambiarSeccion ->', seccion);
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
    this.mostrarFormulario = true;
  }

  editarAlojamiento(a: Alojamiento): void {
    this.nuevoAlojamiento = { ...a };
    this.idEditar = a.id_cabania ? Number(a.id_cabania) : null;
    this.editando = true;
    this.mostrarFormulario = true;
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.idEditar = null;
    this.nuevoAlojamiento = this.formVacio();
  }

  guardarAlojamiento(): void {
    const payload: Alojamiento = { ...this.nuevoAlojamiento };

    if (this.editando && this.idEditar !== null) {
      const editPayload: Alojamiento = {
        ...payload,
        id: Number(this.idEditar),
        id_cabania: Number(this.idEditar),
        url_imagen: payload.url_imagen
      } as Alojamiento;

      this.adminService.editarAlojamiento(editPayload).subscribe({
        next: () => {
          this.cargarAlojamientos();
          this.cancelarFormulario();
          this.mostrarAlerta('✓ Actualizado correctamente');
        },
        error: () => this.mostrarAlerta('Error al actualizar')
      });
      return;
    }

    this.adminService.crearAlojamiento(payload).subscribe({
      next: () => {
        this.cargarAlojamientos();
        this.cancelarFormulario();
        this.mostrarAlerta('✓ Creado correctamente');
      },
      error: () => this.mostrarAlerta('Error al crear')
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

  cargarReservas(): void {
    forkJoin({
      cabanias: this.habitacionesService.getReservasByUsuario().pipe(catchError(() => of([]))),
      mesas: this.habitacionesService.getReservasMesas().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ cabanias, mesas }) => {
        const reservasCabanias = this.normalizarReservas(this.obtenerListaDeRespuesta(cabanias), 'cabaña');
        const reservasMesas = this.normalizarReservas(this.obtenerListaDeRespuesta(mesas), 'mesa');

        this.reservas = [...reservasCabanias, ...reservasMesas].sort((a, b) => {
          const fechaA = new Date(this.normalizarFechaComparacion(a.fecha_hora_inicio)).getTime();
          const fechaB = new Date(this.normalizarFechaComparacion(b.fecha_hora_inicio)).getTime();
          return fechaB - fechaA;
        });
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error('Error cargando reservas:', err)
    });
  }

  cargarUsuarios(): void {
    this.userService.getUsuarios().pipe(catchError(() => of([]))).subscribe({
      next: (data) => {
        this.usuarios = this.obtenerListaDeRespuesta(data).map((usuario: any) => this.normalizarUsuario(usuario));
        this.cdr.detectChanges();
      },
      error: (err: unknown) => console.error('Error cargando usuarios:', err)
    });
  }

  obtenerListaDeRespuesta(respuesta: any): any[] {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (Array.isArray(respuesta?.data)) {
      return respuesta.data;
    }

    if (Array.isArray(respuesta?.usuarios)) {
      return respuesta.usuarios;
    }

    if (Array.isArray(respuesta?.results)) {
      return respuesta.results;
    }

    if (Array.isArray(respuesta?.data?.usuarios)) {
      return respuesta.data.usuarios;
    }

    if (Array.isArray(respuesta?.reservas)) {
      return respuesta.reservas;
    }

    if (Array.isArray(respuesta?.facturas)) {
      return respuesta.facturas;
    }

    if (Array.isArray(respuesta?.data?.facturas)) {
      return respuesta.data.facturas;
    }

    return [];
  }

  normalizarReservas(reservas: any[], tipoReserva: TipoReserva): ReservaAdmin[] {
    return reservas.map((reserva) => this.normalizarReserva(reserva, tipoReserva));
  }

  get alojamientosFiltrados(): Alojamiento[] {
    if (!this.busqueda.trim()) {
      return this.alojamientos;
    }

    const q = this.busqueda.toLowerCase();
    return this.alojamientos.filter((alojamiento) =>
      alojamiento.nombre?.toLowerCase().includes(q) ||
      String(alojamiento.capacidad ?? '').includes(q)
    );
  }

  normalizarReserva(reserva: any, tipoReserva: TipoReserva): ReservaAdmin {
    const tipoDetectado = String(reserva?.tipo_reserva ?? reserva?.tipoReserva ?? tipoReserva).toLowerCase() === 'mesa'
      ? 'mesa'
      : 'cabaña';
    const idUsuario = String(reserva?.id_usuario ?? reserva?.idUsuario ?? '');

    return {
      id_reserva: String(reserva?.id_reserva ?? reserva?.id ?? ''),
      id_usuario: idUsuario,
      nombre_usuario: this.obtenerNombreUsuario(idUsuario, reserva),
      correo_usuario: this.obtenerCorreoUsuario(idUsuario, reserva),
      tipo_reserva: tipoDetectado,
      nombre_recurso: tipoDetectado === 'mesa' ? this.obtenerNombreMesa(reserva) : this.obtenerNombreCabania(reserva),
      detalle_recurso: tipoDetectado === 'mesa' ? this.obtenerDetalleMesa(reserva) : this.obtenerDetalleCabania(reserva),
      fecha_hora_inicio: String(reserva?.fecha_hora_inicio ?? reserva?.fechaInicio ?? ''),
      fecha_hora_fin: String(reserva?.fecha_hora_fin ?? reserva?.fechaFin ?? ''),
      cantidad_personas: Number(reserva?.cantidad_personas ?? reserva?.personas ?? reserva?.cantidad ?? 0),
      estado: String(reserva?.estado ?? '')
    };
  }

  obtenerNombreUsuario(idUsuario: string, reserva?: any): string {
    const usuarioEncontrado = this.usuarios.find((usuario) => this.obtenerIdUsuario(usuario) === idUsuario);

    if (usuarioEncontrado) {
      const nombreCompleto = `${usuarioEncontrado.nombres ?? usuarioEncontrado.nombre ?? ''} ${usuarioEncontrado.apellidos ?? ''}`.trim();
      return nombreCompleto || usuarioEncontrado.email || usuarioEncontrado.correo || `Usuario #${idUsuario}`;
    }

    const nombreDirecto = String(
      reserva?.nombre_usuario ??
      reserva?.usuario_nombre ??
      reserva?.nombre ??
      reserva?.nombres ??
      ''
    ).trim();

    return nombreDirecto || (idUsuario ? `Usuario #${idUsuario}` : 'Usuario sin nombre');
  }

  obtenerCorreoUsuario(idUsuario: string, reserva?: any): string {
    const usuarioEncontrado = this.usuarios.find((usuario) => this.obtenerIdUsuario(usuario) === idUsuario);
    return String(usuarioEncontrado?.email ?? usuarioEncontrado?.correo ?? reserva?.correo_usuario ?? reserva?.correo ?? '');
  }

  obtenerIdUsuario(usuario: Usuario): string {
    return String(usuario.id_usuario ?? usuario.id ?? '');
  }

  normalizarUsuario(usuario: any): Usuario & { nombre_completo: string; id_display: string; email_display: string } {
    const nombreCompleto = this.obtenerNombreCompletoUsuario(usuario);
    const idDisplay = String(usuario?.id_usuario ?? usuario?.id ?? usuario?.numero_documento ?? '');
    const emailDisplay = String(usuario?.email ?? usuario?.correo ?? usuario?.cuenta?.correo ?? '');
    const fechaNacimiento = String(usuario?.fecha_nacimiento ?? usuario?.fechaNacimiento ?? '');

    return {
      ...usuario,
      id: Number(usuario?.id ?? usuario?.id_usuario ?? 0),
      nombres: String(usuario?.nombres ?? usuario?.nombre ?? ''),
      apellidos: String(usuario?.apellidos ?? ''),
      fecha_registro: String(usuario?.fecha_registro ?? usuario?.created_at ?? usuario?.fecha_creacion ?? ''),
      fecha_nacimiento: fechaNacimiento,
      telefono: usuario?.telefono ?? '',
      tipo_documento: String(usuario?.tipo_documento ?? usuario?.tipoDocumento ?? ''),
      numero_documento: String(usuario?.numero_documento ?? usuario?.numeroDocumento ?? ''),
      ciudad: String(usuario?.ciudad ?? ''),
      estado: usuario?.estado ?? '',
      id_rol: usuario?.id_rol ?? '',
      total_reservas: Number(usuario?.total_reservas ?? usuario?.reservas_total ?? usuario?.cantidad_reservas ?? 0),
      nombre_completo: nombreCompleto,
      id_display: idDisplay,
      email_display: emailDisplay
    };
  }

  obtenerNombreCompletoUsuario(usuario: any): string {
    const nombres = String(usuario?.nombres ?? usuario?.nombre ?? '').trim();
    const apellidos = String(usuario?.apellidos ?? '').trim();
    const partes = [nombres, apellidos].filter(Boolean);

    if (partes.length > 0) {
      return partes.join(' ');
    }

    return String(usuario?.correo ?? usuario?.email ?? 'Usuario sin nombre').trim();
  }

  get usuariosFiltrados(): Usuario[] {
    const filtro = this.filtroUsuarios.trim().toLowerCase();

    if (!filtro) {
      return this.usuarios;
    }

    return this.usuarios.filter((usuario) => {
      const nombre = (usuario.nombre_completo || this.obtenerNombreCompletoUsuario(usuario)).toLowerCase();
      const correo = String(usuario.email_display ?? usuario.email ?? usuario.correo ?? '').toLowerCase();
      const documento = String(usuario.numero_documento ?? '').toLowerCase();
      return nombre.includes(filtro) || correo.includes(filtro) || documento.includes(filtro);
    });
  }

  editarUsuario(usuario: Usuario): void {
    this.editandoUsuario = true;
    this.usuarioEditando = {
      ...usuario,
      nombres: String(usuario.nombres ?? usuario.nombre_completo ?? '').split(' ')[0] ?? '',
      apellidos: String(usuario.apellidos ?? '').trim(),
      fecha_nacimiento: String(usuario.fecha_nacimiento ?? ''),
      telefono: usuario.telefono ?? '',
      tipo_documento: String(usuario.tipo_documento ?? ''),
      numero_documento: String(usuario.numero_documento ?? ''),
      ciudad: String(usuario.ciudad ?? ''),
      estado: usuario.estado ?? 1,
      id_rol: usuario.id_rol ?? 2,
      email: String(usuario.email_display ?? usuario.email ?? usuario.correo ?? '')
    };
    this.mostrarFormularioUsuario = true;
  }

  crearUsuarioNuevo(): void {
    this.editandoUsuario = false;
    this.usuarioEditando = this.formularioUsuarioVacio();
    this.mostrarFormularioUsuario = true;
  }

  cancelarFormularioUsuario(): void {
    this.mostrarFormularioUsuario = false;
    this.editandoUsuario = false;
    this.usuarioEditando = this.formularioUsuarioVacio();
  }

  guardarUsuario(): void {
    const estabaEditando = this.editandoUsuario;
    const payload = {
      nombres: this.usuarioEditando.nombres ?? '',
      apellidos: this.usuarioEditando.apellidos ?? '',
      telefono: this.usuarioEditando.telefono ?? '',
      fecha_nacimiento: this.usuarioEditando.fecha_nacimiento ?? '',
      tipo_documento: this.usuarioEditando.tipo_documento ?? '',
      numero_documento: this.usuarioEditando.numero_documento ?? '',
      ciudad: this.usuarioEditando.ciudad ?? '',
      estado: this.usuarioEditando.estado ?? 1,
      id_rol: this.usuarioEditando.id_rol ?? 2,
      correo: this.usuarioEditando.email ?? this.usuarioEditando.correo ?? ''
    };

    const idUsuario = String(this.usuarioEditando.id_display ?? this.usuarioEditando.id ?? '');

    const request = this.editandoUsuario
      ? this.userService.actualizarUsuarioAdmin(idUsuario, payload)
      : this.userService.actualizarUsuarioAdmin(idUsuario, payload);

    request.subscribe({
      next: () => {
        this.cargarUsuarios();
        this.cancelarFormularioUsuario();
        this.mostrarAlerta(estabaEditando ? 'Usuario actualizado correctamente' : 'Usuario guardado correctamente');
      },
      error: () => this.mostrarAlerta('No fue posible guardar el usuario')
    });
  }

  confirmarEliminarUsuario(usuario: Usuario): void {
    const nombre = usuario.nombre_completo || this.obtenerNombreCompletoUsuario(usuario);
    this.mostrarConfirmacion(`¿Seguro que deseas eliminar a ${nombre}?`, () => this.eliminarUsuario(usuario));
  }

  eliminarUsuario(usuario: Usuario): void {
    const idUsuario = String(usuario.id_display ?? usuario.id ?? '');
    this.userService.eliminarUsuarioId(idUsuario).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.mostrarAlerta('Usuario eliminado correctamente');
      },
      error: () => this.mostrarAlerta('No fue posible eliminar el usuario')
    });
  }

  obtenerNombreCabania(reserva: any): string {
    return String(
      reserva?.nombre_cabania ??
      reserva?.nombreCabania ??
      reserva?.nombre_habitacion ??
      reserva?.nombreHabitacion ??
      reserva?.alojamiento_nombre ??
      'Cabaña sin nombre'
    );
  }

  obtenerDetalleCabania(reserva: any): string {
    const personas = Number(reserva?.cantidad_personas ?? reserva?.personas ?? 0);
    const noches = this.calcularNoches(String(reserva?.fecha_hora_inicio ?? ''), String(reserva?.fecha_hora_fin ?? ''));

    const partes = [
      personas > 0 ? `${personas} personas` : 'Personas no definidas',
      noches > 0 ? `${noches} noche${noches === 1 ? '' : 's'}` : 'Sin noches calculadas'
    ];

    return partes.join(' · ');
  }

  obtenerNombreMesa(reserva: any): string {
    return String(
      reserva?.nombre_mesa ??
      reserva?.nombreMesa ??
      reserva?.nombre ??
      reserva?.mesa_nombre ??
      reserva?.id_mesa ??
      'Mesa sin nombre'
    );
  }

  obtenerDetalleMesa(reserva: any): string {
    const personas = Number(reserva?.cantidad_personas ?? reserva?.personas ?? 0);
    const fechaInicio = this.formatearFechaHora(reserva?.fecha_hora_inicio ?? '');
    const fechaFin = this.formatearFechaHora(reserva?.fecha_hora_fin ?? '');

    const partes = [fechaInicio || 'Sin inicio', fechaFin || 'Sin fin'];

    if (personas > 0) {
      partes.push(`${personas} personas`);
    }

    return partes.join(' · ');
  }

  formatearFechaHora(valor: string): string {
    if (!valor) {
      return '';
    }

    const parsed = new Date(this.normalizarFechaComparacion(valor));
    if (Number.isNaN(parsed.getTime())) {
      return valor;
    }

    return parsed.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  normalizarFechaComparacion(valor: string): string {
    return String(valor ?? '').replace(' ', 'T');
  }

  formatearFecha(valor: string): string {
    if (!valor) {
      return '';
    }

    const parsed = new Date(this.normalizarFechaComparacion(valor));
    if (Number.isNaN(parsed.getTime())) {
      return valor;
    }

    return parsed.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  calcularNoches(inicio: string, fin: string): number {
    if (!inicio || !fin) {
      return 0;
    }

    const fecha1 = new Date(this.normalizarFechaComparacion(inicio));
    const fecha2 = new Date(this.normalizarFechaComparacion(fin));
    const diferenciaMs = fecha2.getTime() - fecha1.getTime();
    const dias = diferenciaMs / (1000 * 60 * 60 * 24);
    return dias > 0 ? Math.ceil(dias) : 0;
  }

  getEstadoReservaLabel(estado: string): string {
    const value = String(estado).trim().toLowerCase();

    if (value === '0' || value === 'activa' || value === 'confirmada') {
      return 'Confirmada';
    }

    if (value === '1' || value === 'pendiente') {
      return 'Pendiente';
    }

    if (value === '2' || value === 'cancelada' || value === 'cancelado') {
      return 'Cancelada';
    }

    return estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Sin estado';
  }

  getEstadoReservaClass(estado: string): string {
    const value = String(estado).trim().toLowerCase();

    if (value === '0' || value === 'activa' || value === 'confirmada') {
      return 'status-confirmed';
    }

    if (value === '1' || value === 'pendiente') {
      return 'status-pending';
    }

    return 'status-cancelled';
  }

  getTipoReservaClass(tipoReserva: TipoReserva): string {
    return tipoReserva === 'mesa' ? 'type-table' : 'type-cabania';
  }

  getTipoReservaLabel(tipoReserva: TipoReserva): string {
    return tipoReserva === 'mesa' ? 'Mesa' : 'Cabaña';
  }

  getResumenReserva(reserva: ReservaAdmin): string {
    if (reserva.tipo_reserva === 'mesa') {
      return `${this.formatearFechaHora(reserva.fecha_hora_inicio)} · ${this.formatearFechaHora(reserva.fecha_hora_fin)}`;
    }

    const noches = this.calcularNoches(reserva.fecha_hora_inicio, reserva.fecha_hora_fin);
    return `${this.formatearFecha(reserva.fecha_hora_inicio)} a ${this.formatearFecha(reserva.fecha_hora_fin)} · ${noches} noche${noches === 1 ? '' : 's'}`;
  }

  get reservasFiltradas(): ReservaAdmin[] {
    const filtroUsuario = this.filtroUsuario.trim().toLowerCase();

    return this.reservas.filter((reserva) => {
      const coincideUsuario = !filtroUsuario ||
        reserva.nombre_usuario.toLowerCase().includes(filtroUsuario) ||
        reserva.correo_usuario.toLowerCase().includes(filtroUsuario) ||
        reserva.id_usuario.toLowerCase().includes(filtroUsuario);

      const coincideFecha = !this.filtroFecha ||
        this.normalizarFechaComparacion(reserva.fecha_hora_inicio).startsWith(this.filtroFecha) ||
        this.normalizarFechaComparacion(reserva.fecha_hora_fin).startsWith(this.filtroFecha);

      const coincideTipo = this.filtroTipo === 'todos' || reserva.tipo_reserva === this.filtroTipo;

      return coincideUsuario && coincideFecha && coincideTipo;
    });
  }

  get totalAlojamientos(): number {
    return this.alojamientos.length;
  }

  get capacidadTotal(): number {
    return this.alojamientos.reduce((acc, alojamiento) => acc + (Number(alojamiento.capacidad) || 0), 0);
  }

  get totalReservas(): number {
    return this.reservas.length;
  }

  get reservasCabania(): number {
    return this.reservas.filter((reserva) => reserva.tipo_reserva === 'cabaña').length;
  }

  get reservasMesa(): number {
    return this.reservas.filter((reserva) => reserva.tipo_reserva === 'mesa').length;
  }

  get reservasConfirmadas(): number {
    return this.reservas.filter((reserva) => {
      const estado = String(reserva.estado).trim().toLowerCase();
      return estado === '0' || estado === 'confirmada' || estado === 'activa';
    }).length;
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
      id: 0,
      nombre: '',
      precio_por_persona: 0,
      capacidad: 0,
      url_imagen: ''
    };
  }

  private formularioUsuarioVacio(): Usuario {
    return {
      id: 0,
      id_display: '',
      nombre_completo: '',
      nombres: '',
      apellidos: '',
      email_display: '',
      email: '',
      correo: '',
      telefono: '',
      fecha_nacimiento: '',
      fecha_registro: '',
      tipo_documento: '',
      numero_documento: '',
      ciudad: '',
      estado: 1,
      id_rol: 2,
      total_reservas: 0
    };
  }

  cerrarSesion(): void {
    localStorage.removeItem('cuenta');
    localStorage.removeItem('id_usuario');
    localStorage.removeItem('id_rol');
    localStorage.removeItem('token');
    localStorage.removeItem('nombres');
    localStorage.removeItem('apellidos');
    this.router.navigate(['/login']);
  }
}

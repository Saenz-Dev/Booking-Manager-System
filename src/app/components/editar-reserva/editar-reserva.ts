import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { finalize } from 'rxjs';
import { HabitacionesService } from '../../services/habitaciones.service';
import { NotificacionesService } from '../../services/notificaciones.service';

interface ReservationResult {
  message: string;
  success: boolean;
}

interface ReservaEditable {
  id_reserva: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  id_usuario: string;
  estado: string;
  cantidad_personas: string;
  descripcion?: string;
  nombre_cabania?: string;
  nombre_mesa?: string;
  id_mesa?: string;
  tipo_reserva?: 'cabaña' | 'mesa';
}

@Component({
  selector: 'app-editar-reserva',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './editar-reserva.html',
  styleUrl: './editar-reserva.css'
})
export class EditarReservaComponent implements OnInit, OnChanges {
  @Input() reserva: ReservaEditable | null = null;
  @Input() tipoReserva: 'cabaña' | 'mesa' | null = null;
  @Output() reservationUpdated = new EventEmitter<ReservationResult>();
  @Output() cancelEdit = new EventEmitter<void>();

  habitaciones: any[] = [];
  selectedRoomId: string | number | null = null;
  numeroHuespedes = 1;
  numerosHuespedes = [1, 2, 3, 4, 5, 6, 7, 8];

  mesas: any[] = [];
  mesasDisponibles: any[] = [];
  selectedTableId: string | number | null = null;
  tableDate = '';
  tableStartTime = '';
  tableEndTime = '';
  tablePeople = 1;
  tableHours = ['11', '12', '13', '14', '15', '16', '17'];
  numerosPersonasMesa = Array.from({ length: 50 }, (_, i) => i + 1);
  isSubmittingTableReservation = false;
  isCheckingTableAvailability = false;
  tableSummaryVisible = false;
  tableAvailabilityMessage = '';
  tableAvailabilityState: 'idle' | 'checking' | 'available' | 'unavailable' = 'idle';

  roomRate = 0;
  roomRateLabel = 'Cabaña';
  checkIn = '';
  checkOut = '';
  descripcionReserva = '';

  roomSummaryVisible = false;
  isSubmittingReservation = false;
  isCheckingAvailability = false;
  hasDisponibilidadLoaded = false;
  disponibilidadPorCabania: Record<string, boolean> = {};
  roomSummary = {
    type: 'Cabaña',
    rate: '--/persona/noche',
    nights: '-- noches',
    sub: '--',
    tax: '--',
    total: '--'
  };

  constructor(
    private _habitacionesService: HabitacionesService
    , private _notificacionesService: NotificacionesService
  ) {}

  ngOnInit(): void {
    if (this.isReservationTypeMesa()) {
      this.cargarMesas();
      return;
    }

    this.cargarHabitaciones();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reserva'] && this.reserva) {
      this.aplicarReservaEditable();
      if (this.isReservationTypeMesa()) {
        this.intentarSeleccionarMesaActual();
        this.validarDisponibilidadMesa();
      } else {
        this.intentarSeleccionarCabaniaActual();
        this.calcRoom();
        this.validarDisponibilidadSilenciosa();
      }
    }
  }

  cerrar(): void {
    if (this.isSubmittingReservation || this.isCheckingAvailability) {
      return;
    }

    this.cancelEdit.emit();
  }

  getReservationType(): 'cabaña' | 'mesa' {
    return this.tipoReserva ?? this.reserva?.tipo_reserva ?? 'cabaña';
  }

  isReservationTypeMesa(): boolean {
    return this.getReservationType() === 'mesa';
  }

  getReservationTypeLabel(): string {
    return this.getReservationType() === 'mesa' ? 'mesa' : 'cabaña';
  }

  getReservationTitle(): string {
    return this.getReservationType() === 'mesa' ? 'mesa' : 'cabaña';
  }

  cargarHabitaciones(): void {
    this._habitacionesService.getHabitaciones().subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const data = Array.isArray(response?.data) ? response.data : [];

        this.habitaciones = statusOk ? data.filter((habitacion: any) => this.isHabitacionActiva(habitacion)) : [];
        this.intentarSeleccionarCabaniaActual();
        this.validarDisponibilidadSilenciosa();
      },
      error: () => {
        this.habitaciones = [];
      }
    });
  }

  cargarMesas(): void {
    this._habitacionesService.getMesas().subscribe({
      next: (response: any) => {
        const statusOk = this.isSuccessfulResponse(response);
        const data = this.getResponseData(response);

        this.mesas = statusOk ? data : [];
        this.intentarSeleccionarMesaActual();
        this.validarDisponibilidadMesa();
      },
      error: () => {
        this.mesas = [];
      }
    });
  }

  onGuestCountChange(value: string): void {
    if (this.isReservationTypeMesa()) {
      this.onTablePeopleChange(value);
      return;
    }

    this.numeroHuespedes = Number(value);
    const habitacionSeleccionada = this.getHabitacionSeleccionada();

    if (habitacionSeleccionada && !this.canUseHabitacion(habitacionSeleccionada)) {
      this.autoSelectFirstAvailableRoom();
    }

    this.calcRoom();
    this.validarDisponibilidadSilenciosa();
  }

  onCheckInChange(value: string): void {
    if (this.isReservationTypeMesa()) {
      this.onTableDateChange(value);
      return;
    }

    this.checkIn = value;

    if (this.checkOut && this.getDateValue(this.checkOut).getTime() <= this.getDateValue(this.checkIn).getTime()) {
      this.checkOut = this.getNextDate(this.checkIn);
    }

    this.calcRoom();
    this.validarDisponibilidadSilenciosa();
  }

  onCheckOutChange(value: string): void {
    if (this.isReservationTypeMesa()) {
      this.onTableEndTimeChange(value);
      return;
    }

    this.checkOut = value;
    this.calcRoom();
    this.validarDisponibilidadSilenciosa();
  }

  onTableDateChange(value: string): void {
    this.tableDate = value;
    this.tableEndTime = '';
    this.selectedTableId = null;
    this.validarDisponibilidadMesa();
  }

  onTableStartTimeChange(value: string): void {
    this.tableStartTime = value;
    this.tableEndTime = '';
    this.selectedTableId = null;
    this.validarDisponibilidadMesa();
  }

  onTableEndTimeChange(value: string): void {
    this.tableEndTime = value;
    this.selectedTableId = null;
    this.validarDisponibilidadMesa();
  }

  onTablePeopleChange(value: string): void {
    const num = Number(value);
    if (!Number.isNaN(num) && num > 0) {
      this.tablePeople = num;
      this.validarDisponibilidadMesa();
    }
  }

  selectRoom(habitacion: any): void {
    this.selectedRoomId = this.getHabitacionId(habitacion);
    const valor = this.getPrecioHabitacion(habitacion);
    const nombre = this.getNombreHabitacion(habitacion);
    this.roomRate = valor;
    this.roomRateLabel = `${nombre} - ${this.formatMoney(valor)}/noche`;
    this.calcRoom();
  }

  getMesaId(mesa: any): string | number {
    return mesa?.id_mesa ?? mesa?.id ?? mesa?.nombre ?? JSON.stringify(mesa);
  }

  getMesaNombre(mesa: any): string {
    return String(mesa?.nombre ?? mesa?.numero ?? `Mesa ${mesa?.id_mesa ?? mesa?.id ?? '?'}`);
  }

  getMesaSeleccionada(): any | null {
    if (this.selectedTableId === null) {
      return null;
    }

    return this.mesasDisponibles.find((mesa: any) => this.getMesaId(mesa) === this.selectedTableId)
      ?? this.mesas.find((mesa: any) => this.getMesaId(mesa) === this.selectedTableId)
      ?? this.reserva;
  }

  getMesaCapacidad(mesa: any): number {
    const capacidad = Number(mesa?.capacidad ?? 0);
    return Number.isFinite(capacidad) && capacidad > 0 ? capacidad : 0;
  }

  getMesaDescripcion(mesa: any): string {
    const descripcion = mesa?.descripcion ?? mesa?.detalle ?? '';
    if (descripcion) {
      return String(descripcion);
    }

    const capacidad = this.getMesaCapacidad(mesa);
    return capacidad > 0 ? `Mesa para hasta ${capacidad} personas` : 'Mesa disponible';
  }

  isMesaSelected(mesa: any): boolean {
    return this.selectedTableId === this.getMesaId(mesa);
  }

  selectTable(mesa: any): void {
    this.selectedTableId = this.getMesaId(mesa);
  }

  selectTableSafe(mesa: any): void {
    if (!this.canUseMesa(mesa)) {
      return;
    }

    this.selectTable(mesa);
  }

  canConfirmTableReservation(): boolean {
    return this.isReservationTypeMesa() && this.canGoToTableStep2() && !!this.selectedTableId;
  }

  canGoToTableStep2(): boolean {
    return this.tableDate !== '' && this.tableStartTime !== '' && this.tableEndTime !== '' && this.tablePeople > 0;
  }

  getAvailableEndTimes(): string[] {
    if (!this.tableStartTime) {
      return this.tableHours;
    }

    const startHour = parseInt(this.tableStartTime, 10);
    return this.tableHours.filter((hour) => parseInt(hour, 10) > startHour);
  }

  goToTableStep2(): void {
    if (!this.canGoToTableStep2() || this.isCheckingTableAvailability) {
      return;
    }

    this.validarDisponibilidadMesaParaAvanzar(() => {
      this.tableSummaryVisible = true;
    });
  }

  goBackToTableStep1(): void {
    this.tableSummaryVisible = false;
    this.selectedTableId = null;
  }

  selectRoomSafe(habitacion: any): void {
    // Solo permitir seleccionar si está disponible en las fechas elegidas
    // No se permite excepciones por ser la cabaña anterior
    if (!this.canUseHabitacion(habitacion)) {
      return;
    }

    this.selectRoom(habitacion);
  }

  isRoomSelected(habitacion: any): boolean {
    return this.selectedRoomId === this.getHabitacionId(habitacion);
  }

  esReservaActual(habitacion: any): boolean {
    if (!this.reserva?.nombre_cabania) {
      return false;
    }

    const targetName = String(this.reserva.nombre_cabania).trim().toLowerCase();
    const habitacionName = this.getNombreHabitacion(habitacion).trim().toLowerCase();
    return targetName === habitacionName;
  }

  canSubmit(): boolean {
    if (this.isReservationTypeMesa()) {
      return this.canConfirmTableReservation();
    }

    const habitacionSeleccionada = this.getHabitacionSeleccionada();
    return this.isCheckInValid() && this.isCheckOutValid() && this.numeroHuespedes > 0 && !!habitacionSeleccionada && this.canUseHabitacion(habitacionSeleccionada) && this.roomSummaryVisible;
  }

  submitReservationUpdate(): void {
    if (!this.reserva || !this.canSubmit()) {
      return;
    }

    if (this.isReservationTypeMesa()) {
      this.submitTableReservationUpdate();
      return;
    }

    this.validarDisponibilidadReserva(() => {
      this._notificacionesService.success('Disponibilidad validada correctamente', 'Reserva');
      const habitacionSeleccionada = this.getHabitacionSeleccionada();
      if (!habitacionSeleccionada || !this.canUseHabitacion(habitacionSeleccionada)) {
        this._notificacionesService.warning('La cabaña seleccionada no está disponible para las fechas elegidas', 'Reserva');
        this.reservationUpdated.emit({
          message: 'La cabaña seleccionada no está disponible para las fechas elegidas',
          success: false
        });
        return;
      }

      const payload = {
        fecha_hora_inicio: this.toUtcMidnight(this.checkIn),
        fecha_hora_fin: this.toUtcMidnight(this.checkOut),
        id_usuario: this.reserva?.id_usuario ?? localStorage.getItem('id_usuario') ?? '',
        estado: Number(this.reserva?.estado ?? '1'),
        cantidad_personas: String(this.numeroHuespedes),
        descripcion: this.descripcionReserva.trim(),
        nombre_cabania: this.getNombreHabitacion(habitacionSeleccionada),
        id_reserva: Number(this.reserva?.id_reserva ?? 0)
      };

      this.isSubmittingReservation = true;
      this._habitacionesService.putReserva(payload).subscribe({
        next: (response: any) => {
          const statusOk = this.isSuccessfulResponse(response);
          const message = String(response?.message ?? 'Reserva modificada exitosamente');

          this.reservationUpdated.emit({
            message,
            success: statusOk
          });
        },
        error: (error: any) => {
          const message = String(error?.error?.message ?? 'No fue posible modificar la reserva');
          this._notificacionesService.error(message, 'Reserva');
          this.reservationUpdated.emit({
            message,
            success: false
          });
          this.isSubmittingReservation = false;
        },
        complete: () => {
          this.isSubmittingReservation = false;
        }
      });
    });
  }

  private submitTableReservationUpdate(): void {
    if (!this.reserva || !this.canConfirmTableReservation() || this.isSubmittingTableReservation || this.isCheckingTableAvailability) {
      return;
    }

    const mesaSeleccionada = this.mesasDisponibles.find(
      (mesa: any) => this.getMesaId(mesa) === this.selectedTableId
    );

    if (!mesaSeleccionada) {
      this._notificacionesService.warning('La mesa seleccionada no está disponible', 'Reserva');
      this.reservationUpdated.emit({
        message: 'La mesa seleccionada no está disponible',
        success: false
      });
      return;
    }

    const payload = {
      id_reserva: Number(this.reserva?.id_reserva ?? 0),
      fecha_hora_inicio: `${this.tableDate} ${this.tableStartTime}:00:00`,
      fecha_hora_fin: `${this.tableDate} ${this.tableEndTime}:00:00`,
      id_usuario: this.reserva?.id_usuario ?? localStorage.getItem('id_usuario') ?? '',
      estado: Number(this.reserva?.estado ?? '1'),
      cantidad_personas: this.tablePeople,
      descripcion: this.descripcionReserva.trim(),
      id_mesa: this.selectedTableId
    };

    this.isSubmittingTableReservation = true;
    this._habitacionesService.putReservaMesa(payload).subscribe({
      next: (response: any) => {
        const statusOk = this.isSuccessfulResponse(response);
        const message = String(response?.message ?? 'Reserva de mesa modificada exitosamente');

        this.reservationUpdated.emit({
          message,
          success: statusOk
        });
      },
      error: (error: any) => {
        const message = String(error?.error?.message ?? 'No fue posible modificar la reserva de mesa');
        this._notificacionesService.error(message, 'Reserva');
        this.reservationUpdated.emit({
          message,
          success: false
        });
        this.isSubmittingTableReservation = false;
      },
      complete: () => {
        this.isSubmittingTableReservation = false;
      }
    });
  }

  getCheckInMin(): string {
    return this.getTodayDate();
  }

  getCheckOutMin(): string {
    return this.checkIn ? this.getNextDate(this.checkIn) : this.getTomorrowDate();
  }

  getNombreHabitacion(habitacion: any): string {
    return String(habitacion?.nombre ?? 'Cabaña');
  }

  getDescripcionHabitacion(habitacion: any): string {
    const capacidad = this.getCapacidadHabitacion(habitacion);
    const descripcion = habitacion?.descripcion ?? habitacion?.detalle ?? habitacion?.caracteristicas ?? '';
    if (descripcion) {
      return String(descripcion);
    }

    return capacidad > 0
      ? `Cabaña cómoda y equipada para hasta ${capacidad} personas.`
      : 'Cabaña cómoda y equipada para una estadía agradable.';
  }

  getCapacidadHabitacion(habitacion: any): number {
    const capacidad = Number(habitacion?.capacidad ?? 0);
    return Number.isFinite(capacidad) && capacidad > 0 ? capacidad : 0;
  }

  getPrecioHabitacion(habitacion: any): number {
    const valor = Number(habitacion?.precio_por_persona ?? 0);
    return Number.isFinite(valor) && valor > 0 ? valor : 0;
  }

  getImagenHabitacion(habitacion: any): string {
    const image = habitacion?.url_imagen ?? '';
    return image ? String(image) : 'assets/fondo.jpg';
  }

  isHabitacionDisponibleParaHuespedes(habitacion: any): boolean {
    const capacidad = this.getCapacidadHabitacion(habitacion);
    return capacidad === 0 || this.numeroHuespedes <= capacidad;
  }

  isHabitacionDisponiblePorFecha(habitacion: any): boolean {
    if (!this.hasDisponibilidadLoaded) {
      return true;
    }

    const keys = this.getHabitacionLookupKeys(habitacion);
    if (keys.length === 0) {
      return true;
    }

    return keys.some((key: string) => this.disponibilidadPorCabania[key] === true);
  }

  formatMoney(value: number): string {
    return '$' + value.toLocaleString('es-CO');
  }

  private aplicarReservaEditable(): void {
    if (!this.reserva) {
      return;
    }

    const personas = Number(this.reserva.cantidad_personas);
    this.numeroHuespedes = Number.isFinite(personas) && personas > 0 ? personas : 1;
    this.descripcionReserva = String(this.reserva.descripcion ?? '');

    if (this.isReservationTypeMesa()) {
      this.tableDate = this.toDateOnly(this.reserva.fecha_hora_inicio) || this.getTodayDate();
      this.tableStartTime = this.toTimeOnly(this.reserva.fecha_hora_inicio);
      this.tableEndTime = this.toTimeOnly(this.reserva.fecha_hora_fin);
      this.tablePeople = this.numeroHuespedes;
      this.tableSummaryVisible = true;
      return;
    }

    this.checkIn = this.toDateOnly(this.reserva.fecha_hora_inicio) || this.getTomorrowDate();
    this.checkOut = this.toDateOnly(this.reserva.fecha_hora_fin) || this.getNextDate(this.checkIn);

    if (this.getDateValue(this.checkOut).getTime() <= this.getDateValue(this.checkIn).getTime()) {
      this.checkOut = this.getNextDate(this.checkIn);
    }
  }

  private intentarSeleccionarCabaniaActual(): void {
    if (!this.reserva || this.habitaciones.length === 0) {
      return;
    }

    const targetName = String(this.reserva.nombre_cabania ?? '').trim().toLowerCase();
    const habitacionByName = this.habitaciones.find((habitacion: any) => this.getNombreHabitacion(habitacion).trim().toLowerCase() === targetName);

    if (habitacionByName) {
      this.selectRoom(habitacionByName);
      return;
    }

    const habitacionSeleccionada = this.getHabitacionSeleccionada();
    if (habitacionSeleccionada) {
      this.selectRoom(habitacionSeleccionada);
      return;
    }

    const primera = this.habitaciones[0];
    if (primera) {
      this.selectRoom(primera);
    }
  }

  private intentarSeleccionarMesaActual(): void {
    if (!this.reserva || this.mesas.length === 0) {
      return;
    }

    const targetMesaId = String(this.reserva.id_mesa ?? '').trim();
    const mesaById = this.mesas.find((mesa: any) => String(this.getMesaId(mesa)).trim() === targetMesaId);

    if (mesaById) {
      this.selectTable(mesaById);
      return;
    }

    const targetName = String(this.reserva.nombre_mesa ?? '').trim().toLowerCase();
    const mesaByName = this.mesas.find((mesa: any) => this.getMesaNombre(mesa).trim().toLowerCase() === targetName);

    if (mesaByName) {
      this.selectTable(mesaByName);
      return;
    }

    if (this.mesas[0]) {
      this.selectTable(this.mesas[0]);
    }
  }

  private validarDisponibilidadMesa(): void {
    if (!this.isReservationTypeMesa() || !this.tableDate || !this.tableStartTime || !this.tableEndTime || this.isCheckingTableAvailability) {
      return;
    }

    this.isCheckingTableAvailability = true;
    this.tableAvailabilityState = 'checking';
    this.tableAvailabilityMessage = 'Validando disponibilidad de mesas...';

    const fechaHoraInicio = `${this.tableDate} ${this.tableStartTime}:00:00`;
    const fechaHoraFin = `${this.tableDate} ${this.tableEndTime}:00:00`;

    this._habitacionesService.getDisponibilidadMesas(fechaHoraInicio, fechaHoraFin).pipe(
      finalize(() => {
        this.isCheckingTableAvailability = false;
      })
    ).subscribe({
      next: (response: any) => {
        const statusOk = this.isSuccessfulResponse(response);
        const data = this.getResponseData(response);

        if (!statusOk) {
          this.mesasDisponibles = [];
          this.tableAvailabilityState = 'unavailable';
          this.tableAvailabilityMessage = String(response?.message ?? 'No fue posible validar disponibilidad de mesas');
          return;
        }

        if (Array.isArray(data)) {
          this.mesasDisponibles = data.filter((mesa: any) => mesa?.disponible === true);
        } else {
          const mesa = data as any;
          this.mesasDisponibles = mesa?.disponible === true ? [mesa] : [];
        }

        this.tableAvailabilityState = this.mesasDisponibles.length > 0 ? 'available' : 'unavailable';
        this.tableAvailabilityMessage = this.mesasDisponibles.length > 0
          ? `${this.mesasDisponibles.length} mesa(s) disponible(s) para esta fecha y hora.`
          : 'No hay mesas disponibles para esta fecha y hora.';

        if (this.selectedTableId) {
          const mesaSeleccionadaDisponible = this.mesasDisponibles.some(
            (mesa: any) => this.getMesaId(mesa) === this.selectedTableId
          );

          if (!mesaSeleccionadaDisponible) {
            this.selectedTableId = null;
          }
        }

        if (this.mesasDisponibles.length > 0 && !this.selectedTableId) {
          this.selectTable(this.mesasDisponibles[0]);
        }
      }
    });
  }

  private validarDisponibilidadMesaParaAvanzar(onAvailable: () => void): void {
    if (this.isCheckingTableAvailability) {
      return;
    }

    this.isCheckingTableAvailability = true;
    const fechaHoraInicio = `${this.tableDate} ${this.tableStartTime}:00:00`;
    const fechaHoraFin = `${this.tableDate} ${this.tableEndTime}:00:00`;

    this._habitacionesService.getDisponibilidadMesas(fechaHoraInicio, fechaHoraFin).pipe(
      finalize(() => {
        this.isCheckingTableAvailability = false;
      })
    ).subscribe({
      next: (response: any) => {
        const statusOk = this.isSuccessfulResponse(response);
        const data = this.getResponseData(response);

        if (!statusOk) {
          const message = String(response?.message ?? 'No fue posible validar disponibilidad de mesas');
          this._notificacionesService.warning(message, 'Disponibilidad');
          this.reservationUpdated.emit({
            message,
            success: false
          });
          return;
        }

        if (Array.isArray(data)) {
          this.mesasDisponibles = data.filter((mesa: any) => mesa?.disponible === true);
        } else {
          const mesa = data as any;
          this.mesasDisponibles = mesa?.disponible === true ? [mesa] : [];
        }

        if (this.mesasDisponibles.length === 0) {
          const message = 'No hay mesas disponibles para esta fecha y hora';
          this._notificacionesService.warning(message, 'Disponibilidad');
          this.reservationUpdated.emit({
            message,
            success: false
          });
          return;
        }

        this.selectTable(this.mesasDisponibles[0]);
        this.tableAvailabilityState = 'available';
        this.tableAvailabilityMessage = `${this.mesasDisponibles.length} mesa(s) disponible(s) para esta fecha y hora.`;
        this._notificacionesService.success('Mesas disponibles cargadas', 'Disponibilidad');
        onAvailable();
      },
      error: (error: any) => {
        const backendMessage = error?.error?.message ?? error?.error?.data ?? '';
        const statusCode = error?.status ? ` (HTTP ${error.status})` : '';
        const message = String(backendMessage || `No fue posible validar disponibilidad${statusCode}`);
        this._notificacionesService.error(message, 'Disponibilidad');
        this.reservationUpdated.emit({
          message,
          success: false
        });
      }
    });
  }

  private canUseMesa(mesa: any): boolean {
    const capacidad = this.getMesaCapacidad(mesa);
    return capacidad === 0 || this.tablePeople <= capacidad;
  }

  private validarDisponibilidadReserva(onAvailable: () => void): void {
    if (this.isCheckingAvailability) {
      return;
    }

    this.isCheckingAvailability = true;
    this._habitacionesService.getDisponibilidadReserva(
      this.toUtcMidnight(this.checkIn),
      this.toUtcMidnight(this.checkOut)
    ).pipe(
      finalize(() => {
        this.isCheckingAvailability = false;
      })
    ).subscribe({
      next: (response: any) => {
        const statusOk = this.isSuccessfulResponse(response);
        const data = this.getResponseData(response);

        if (!statusOk) {
          const message = String(response?.message ?? 'No fue posible validar disponibilidad');
          this._notificacionesService.warning(message, 'Reserva');
          this.reservationUpdated.emit({
            message,
            success: false
          });
          return;
        }

        this.actualizarDisponibilidadCabania(data);
        onAvailable();
      },
      error: (error: any) => {
        const backendMessage = error?.error?.message ?? error?.error?.data ?? '';
        const statusCode = error?.status ? ` (HTTP ${error.status})` : '';
        const message = String(backendMessage || `No fue posible validar disponibilidad${statusCode}`);
        this._notificacionesService.error(message, 'Reserva');
        this.reservationUpdated.emit({
          message,
          success: false
        });
      }
    });
  }

  private validarDisponibilidadSilenciosa(): void {
    if (!this.isCheckInValid() || !this.isCheckOutValid() || this.isCheckingAvailability) {
      return;
    }

    this.isCheckingAvailability = true;
    this._habitacionesService.getDisponibilidadReserva(
      this.toUtcMidnight(this.checkIn),
      this.toUtcMidnight(this.checkOut)
    ).pipe(
      finalize(() => {
        this.isCheckingAvailability = false;
      })
    ).subscribe({
      next: (response: any) => {
        const statusOk = this.isSuccessfulResponse(response);
        const data = this.getResponseData(response);
        if (!statusOk) {
          return;
        }

        this.actualizarDisponibilidadCabania(data);
      }
    });
  }

  private actualizarDisponibilidadCabania(disponibilidad: any[]): void {
    const nuevoEstado: Record<string, boolean> = {};

    for (const item of disponibilidad) {
      const keys = this.getDisponibilidadLookupKeys(item);
      for (const key of keys) {
        nuevoEstado[key] = item?.disponible === true;
      }
    }

    this.disponibilidadPorCabania = nuevoEstado;
    this.hasDisponibilidadLoaded = true;

    const habitacionSeleccionada = this.getHabitacionSeleccionada();
    if (!habitacionSeleccionada || !this.canUseHabitacion(habitacionSeleccionada)) {
      this.autoSelectFirstAvailableRoom();
    }
  }

  private getHabitacionLookupKeys(habitacion: any): string[] {
    const keys = [
      habitacion?.id_cabania,
      habitacion?.id_habitacion,
      habitacion?.id,
      this.getNombreHabitacion(habitacion).trim().toLowerCase()
    ].map((value: any) => String(value ?? '').trim()).filter((value: string) => !!value);

    return Array.from(new Set(keys));
  }

  private getDisponibilidadLookupKeys(item: any): string[] {
    const keys = [
      item?.id_cabania,
      item?.id_habitacion,
      item?.id,
      item?.nombre_cabania,
      item?.nombre,
      item?.cabania
    ].map((value: any) => String(value ?? '').trim().toLowerCase()).filter((value: string) => !!value);

    return Array.from(new Set(keys));
  }

  private autoSelectFirstAvailableRoom(): void {
    const primeraDisponible = this.habitaciones.find((habitacion: any) => this.canUseHabitacion(habitacion));

    if (primeraDisponible) {
      this.selectRoom(primeraDisponible);
      return;
    }

    this.selectedRoomId = null;
  }

  private canUseHabitacion(habitacion: any): boolean {
    return this.isHabitacionDisponibleParaHuespedes(habitacion) && this.isHabitacionDisponiblePorFecha(habitacion);
  }

  private calcRoom(): void {
    if (!this.checkIn || !this.checkOut) {
      this.roomSummaryVisible = false;
      return;
    }

    const startDate = this.getDateValue(this.checkIn);
    const endDate = this.getDateValue(this.checkOut);
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);

    if (nights <= 0) {
      this.roomSummaryVisible = false;
      return;
    }

    const sub = this.roomRate * nights * this.numeroHuespedes;
    const tax = Math.round(sub * 0.19);
    const total = sub + tax;
    this.roomSummary = {
      type: this.roomRateLabel.split('-')[0].trim(),
      rate: this.formatMoney(this.roomRate) + '/persona/noche',
      nights: nights === 1
        ? `1 noche x ${this.numeroHuespedes} ${this.numeroHuespedes === 1 ? 'persona' : 'personas'}`
        : `${nights} noches x ${this.numeroHuespedes} ${this.numeroHuespedes === 1 ? 'persona' : 'personas'}`,
      sub: this.formatMoney(sub),
      tax: this.formatMoney(tax),
      total: this.formatMoney(total)
    };
    this.roomSummaryVisible = true;
  }

  private getHabitacionId(habitacion: any): string | number {
    return habitacion?.id_cabania ?? habitacion?.id_habitacion ?? habitacion?.id ?? habitacion?.nombre ?? JSON.stringify(habitacion);
  }

  private getHabitacionSeleccionada(): any | null {
    if (this.selectedRoomId === null) {
      return null;
    }

    return this.habitaciones.find((habitacion: any) => this.getHabitacionId(habitacion) === this.selectedRoomId) ?? null;
  }

  private toUtcMidnight(dateValue: string): string {
    return `${dateValue}T00:00:00Z`;
  }

  private isSuccessfulResponse(response: any): boolean {
    if (Array.isArray(response)) {
      return true;
    }

    const status = Number(response?.status ?? response?.code ?? 200);
    return !Number.isNaN(status) && status >= 200 && status < 300;
  }

  private getResponseData(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    return Array.isArray(response?.data) ? response.data : [];
  }

  private toDateOnly(value: string): string {
    if (!value) {
      return '';
    }

    const datePart = String(value).split('T')[0].split(' ')[0];
    return datePart;
  }

  private toTimeOnly(value: string): string {
    if (!value) {
      return '';
    }

    const parts = String(value).split(' ');
    const timePart = parts.length > 1 ? parts[1] : parts[0];
    return timePart.substring(0, 5);
  }

  private isCheckInValid(): boolean {
    if (!this.checkIn) {
      return false;
    }

    const checkIn = this.getDateValue(this.checkIn);
    const today = this.getDateValue(this.getTodayDate());
    return checkIn.getTime() >= today.getTime();
  }

  private isCheckOutValid(): boolean {
    if (!this.checkOut || !this.checkIn) {
      return false;
    }

    const checkIn = this.getDateValue(this.checkIn);
    const checkOut = this.getDateValue(this.checkOut);
    return checkOut.getTime() > checkIn.getTime();
  }

  private isHabitacionActiva(habitacion: any): boolean {
    const estado = String(habitacion?.estado ?? habitacion?.status ?? '').toLowerCase();
    if (!estado) {
      return true;
    }

    return estado === '1' || estado === 'true' || estado === 'activo' || estado === 'active' || estado === 'disponible';
  }

  private getDateValue(value: string): Date {
    return new Date(`${value}T00:00:00`);
  }

  private getTodayDate(): string {
    const today = new Date();
    return this.formatDateInput(today);
  }

  private getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDateInput(tomorrow);
  }

  private getNextDate(baseDate: string): string {
    const date = this.getDateValue(baseDate);
    date.setDate(date.getDate() + 1);
    return this.formatDateInput(date);
  }

  private formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

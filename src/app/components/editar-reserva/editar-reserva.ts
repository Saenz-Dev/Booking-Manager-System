import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { HabitacionesService } from '../../services/habitaciones.service';

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
  nombre_cabania?: string;
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
  @Output() reservationUpdated = new EventEmitter<ReservationResult>();
  @Output() cancelEdit = new EventEmitter<void>();

  habitaciones: any[] = [];
  selectedRoomId: string | number | null = null;
  numeroHuespedes = 1;
  numerosHuespedes = [1, 2, 3, 4, 5, 6, 7, 8];

  roomRate = 0;
  roomRateLabel = 'Cabaña';
  checkIn = '';
  checkOut = '';

  roomSummaryVisible = false;
  isSubmittingReservation = false;
  isCheckingAvailability = false;
  hasDisponibilidadLoaded = false;
  disponibilidadPorCabania: Record<string, boolean> = {};
  roomSummary = {
    type: 'Cabaña',
    rate: '--/noche',
    nights: '-- noches',
    sub: '--',
    tax: '--',
    total: '--'
  };

  constructor(
    private _habitacionesService: HabitacionesService
  ) {}

  ngOnInit(): void {
    this.cargarHabitaciones();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reserva'] && this.reserva) {
      this.aplicarReservaEditable();
      this.intentarSeleccionarCabaniaActual();
      this.calcRoom();
      this.validarDisponibilidadSilenciosa();
    }
  }

  cerrar(): void {
    if (this.isSubmittingReservation || this.isCheckingAvailability) {
      return;
    }

    this.cancelEdit.emit();
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

  onGuestCountChange(value: string): void {
    this.numeroHuespedes = Number(value);
    const habitacionSeleccionada = this.getHabitacionSeleccionada();

    if (habitacionSeleccionada && !this.canUseHabitacion(habitacionSeleccionada)) {
      this.autoSelectFirstAvailableRoom();
    }

    this.calcRoom();
    this.validarDisponibilidadSilenciosa();
  }

  onCheckInChange(value: string): void {
    this.checkIn = value;

    if (this.checkOut && this.getDateValue(this.checkOut).getTime() <= this.getDateValue(this.checkIn).getTime()) {
      this.checkOut = this.getNextDate(this.checkIn);
    }

    this.calcRoom();
    this.validarDisponibilidadSilenciosa();
  }

  onCheckOutChange(value: string): void {
    this.checkOut = value;
    this.calcRoom();
    this.validarDisponibilidadSilenciosa();
  }

  selectRoom(habitacion: any): void {
    this.selectedRoomId = this.getHabitacionId(habitacion);
    const valor = this.getPrecioHabitacion(habitacion);
    const nombre = this.getNombreHabitacion(habitacion);
    this.roomRate = valor;
    this.roomRateLabel = `${nombre} - ${this.formatMoney(valor)}/noche`;
    this.calcRoom();
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
    const habitacionSeleccionada = this.getHabitacionSeleccionada();
    return this.isCheckInValid() && this.isCheckOutValid() && this.numeroHuespedes > 0 && !!habitacionSeleccionada && this.canUseHabitacion(habitacionSeleccionada) && this.roomSummaryVisible;
  }

  submitReservationUpdate(): void {
    if (!this.reserva || !this.canSubmit() || this.isSubmittingReservation || this.isCheckingAvailability) {
      return;
    }

    this.validarDisponibilidadReserva(() => {
      const habitacionSeleccionada = this.getHabitacionSeleccionada();
      if (!habitacionSeleccionada || !this.canUseHabitacion(habitacionSeleccionada)) {
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
        nombre_cabania: this.getNombreHabitacion(habitacionSeleccionada),
        id_reserva: Number(this.reserva?.id_reserva ?? 0)
      };

      this.isSubmittingReservation = true;
      this._habitacionesService.putReserva(payload).subscribe({
        next: (response: any) => {
          const statusOk = response?.status === 200 || response?.code === 200;
          const message = String(response?.message ?? 'Reserva modificada exitosamente');

          this.reservationUpdated.emit({
            message,
            success: statusOk
          });
        },
        error: (error: any) => {
          const message = String(error?.error?.message ?? 'No fue posible modificar la reserva');
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

  private validarDisponibilidadReserva(onAvailable: () => void): void {
    if (this.isCheckingAvailability) {
      return;
    }

    this.isCheckingAvailability = true;
    this._habitacionesService.getDisponibilidadReserva(
      this.toUtcMidnight(this.checkIn),
      this.toUtcMidnight(this.checkOut)
    ).subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const data = Array.isArray(response?.data) ? response.data : [];

        if (!statusOk) {
          const message = String(response?.message ?? 'No fue posible validar disponibilidad');
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
        this.reservationUpdated.emit({
          message,
          success: false
        });
      },
      complete: () => {
        this.isCheckingAvailability = false;
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
    ).subscribe({
      next: (response: any) => {
        const statusOk = response?.status === 200 || response?.code === 200;
        const data = Array.isArray(response?.data) ? response.data : [];
        if (!statusOk) {
          return;
        }

        this.actualizarDisponibilidadCabania(data);
      },
      complete: () => {
        this.isCheckingAvailability = false;
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

    const sub = this.roomRate * nights;
    const tax = Math.round(sub * 0.19);
    const total = sub + tax;
    this.roomSummary = {
      type: this.roomRateLabel.split('-')[0].trim(),
      rate: this.formatMoney(this.roomRate) + '/noche',
      nights: nights === 1 ? '1 noche' : `${nights} noches`,
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

  private toDateOnly(value: string): string {
    if (!value) {
      return '';
    }

    const datePart = String(value).split('T')[0].split(' ')[0];
    return datePart;
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

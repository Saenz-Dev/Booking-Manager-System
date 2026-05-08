import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { finalize } from 'rxjs';
import { HabitacionesService } from '../../services/habitaciones.service';
import { NotificacionesService } from '../../services/notificaciones.service';

type ReservationType = 'room' | 'table';

interface ReservationResult {
    message: string;
    success: boolean;
}

@Component({
    selector: 'app-crear-reserva',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './crear-reserva.html',
    styleUrls: ['./crear-reserva.css']
})
export class CrearReservaComponent implements OnInit {
    @Output() reservationConfirmed = new EventEmitter<ReservationResult>();

    selectedType: ReservationType = 'room';
    reservationStep = 1;
    habitaciones: any[] = [];
    selectedRoomId: string | number | null = null;
    numeroHuespedes = 1;
    numerosHuespedes = [1, 2, 3, 4, 5, 6, 7, 8];
    roomDescription = '';

    // Mesa de restaurante
    tableDate = '';
    tableStartTime = '';
    tableEndTime = '';
    tablePeople = 1;
    tableDescription = '';
    tableHours = ['11', '12', '13', '14', '15', '16', '17'];
    numerosPersonasMesa = Array.from({ length: 50 }, (_, i) => i + 1);
    isSubmittingTableReservation = false;
    mesas: any[] = [];
    selectedTableId: string | number | null = null;
    mesasDisponibles: any[] = [];
    isCheckingTableAvailability = false;
    tableSummaryVisible = false;
    reservationTableStep = 1;
    tableAvailabilityMessage = '';
    tableAvailabilityState: 'idle' | 'checking' | 'available' | 'unavailable' = 'idle';

    roomRate = 140000;
    roomRateLabel = 'Habitación - $140.000/noche';
    checkIn = '';
    checkOut = '';

    roomSummaryVisible = false;
    isSubmittingReservation = false;
    isCheckingAvailability = false;
    hasDisponibilidadLoaded = false;
    disponibilidadPorCabania: Record<string, boolean> = {};
    roomSummary = {
        type: 'Habitacion doble',
        rate: '$140.000/persona/noche',
        nights: '-- noches',
        sub: '--',
        tax: '--',
        total: '--'
    };

    constructor(
        private _habitacionesService: HabitacionesService,
        private _notificacionesService: NotificacionesService
    ) {}

    ngOnInit(): void {
        this.setDefaultDates();
        this.cargarHabitaciones();
    }

    cargarHabitaciones(): void {
        this._habitacionesService.getHabitaciones().subscribe({
            next: (response: any) => {
                console.log('Respuesta de habitaciones:', response);

                const statusOk = this.isSuccessfulResponse(response);
                const data = this.getResponseData(response);

                if (statusOk) {
                    console.log('Habitaciones cargadas:', data);
                    this.habitaciones = data.filter((habitacion: any) => this.isHabitacionActiva(habitacion));
                    if (this.habitaciones.length > 0) {
                        const primeraHabitacion = this.habitaciones[0];
                        this.selectRoom(primeraHabitacion);
                    } else {
                        this.selectedRoomId = null;
                    }
                    this.validarDisponibilidadSilenciosa();
                    return;
                }

                this.habitaciones = [];
                this.selectedRoomId = null;
            },
            error: () => {
                this.habitaciones = [];
                this.selectedRoomId = null;
            }
        });
    }

    selectType(type: ReservationType): void {
        this.selectedType = type;

        if (type === 'room') {
            this.setDefaultDates();
            if (this.habitaciones.length > 0) {
                this.selectRoom(this.habitaciones[0]);
            }
        } else if (type === 'table') {
            this.resetTableForm();
            this.cargarMesas();
        }
    }

    resetTableForm(): void {
        const today = new Date().toISOString().split('T')[0];
        this.tableDate = today;
        this.tableStartTime = '';
        this.tableEndTime = '';
        this.tablePeople = 1;
        this.tableDescription = '';
        this.selectedTableId = null;
        this.mesasDisponibles = [];
        this.tableSummaryVisible = false;
        this.reservationTableStep = 1;
        this.tableAvailabilityMessage = '';
        this.tableAvailabilityState = 'idle';
    }

    cargarMesas(): void {
        this._habitacionesService.getMesas().subscribe({
            next: (response: any) => {
                const statusOk = this.isSuccessfulResponse(response);
                const data = this.getResponseData(response);

                if (statusOk && data.length > 0) {
                    this.mesas = data;
                    return;
                }

                this.mesas = [];
                this.selectedTableId = null;
            },
            error: () => {
                this.mesas = [];
                this.selectedTableId = null;
            }
        });
    }

    goToTableStep2(): void {
        if (!this.canGoToTableStep2() || this.isCheckingTableAvailability) {
            return;
        }

        this.validarDisponibilidadMesaParaAvanzar(() => {
            this.reservationTableStep = 2;
        });
    }

    goBackToTableStep1(): void {
        this.reservationTableStep = 1;
        this.selectedTableId = null;
    }

    canGoToTableStep2(): boolean {
        return this.tableDate !== '' && this.tableStartTime !== '' && this.tableEndTime !== '' && this.tablePeople > 0;
    }

    getAvailableEndTimes(): string[] {
        if (!this.tableStartTime) return this.tableHours;
        const startHour = parseInt(this.tableStartTime, 10);
        return this.tableHours.filter((hour) => parseInt(hour, 10) > startHour);
    }

    selectTable(mesa: any): void {
        this.selectedTableId = this.getMesaId(mesa);
    }

    selectTableSafe(mesa: any): void {
        if (!mesa) {
            return;
        }
        this.selectTable(mesa);
    }

    isTableSelected(mesa: any): boolean {
        return this.selectedTableId === this.getMesaId(mesa);
    }

    getMesaId(mesa: any): string | number {
        return mesa?.id_mesa ?? mesa?.id ?? mesa?.nombre ?? JSON.stringify(mesa);
    }

    getMesaNombre(mesa: any): string {
        return String(mesa?.nombre ?? mesa?.numero ?? `Mesa ${mesa?.id_mesa ?? mesa?.id ?? '?'}`);
    }

    getMesaCapacidad(mesa: any): number {
        const capacidad = Number(mesa?.capacidad ?? 0);
        return Number.isFinite(capacidad) && capacidad > 0 ? capacidad : 0;
    }

    isMesaDisponibleParaPersonas(mesa: any): boolean {
        const capacidad = this.getMesaCapacidad(mesa);
        return capacidad === 0 || this.tablePeople <= capacidad;
    }

    getMesaDescripcion(mesa: any): string {
        const descripcion = mesa?.descripcion ?? mesa?.detalle ?? '';
        if (descripcion) {
            return String(descripcion);
        }
        const capacidad = this.getMesaCapacidad(mesa);
        return capacidad > 0 ? `Mesa para hasta ${capacidad} personas` : 'Mesa disponible';
    }

    onTablePeopleChange(value: string): void {
        const num = parseInt(value, 10);
        if (!Number.isNaN(num) && num > 0) {
            this.tablePeople = num;
            this.validarDisponibilidadMesa();
        }
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

    canConfirmTableReservation(): boolean {
        return this.reservationTableStep === 2 && !!this.selectedTableId && this.tablePeople > 0;
    }

    validarDisponibilidadMesa(): void {
        if (!this.tableDate || !this.tableStartTime || !this.tableEndTime || this.isCheckingTableAvailability) {
            this.mesasDisponibles = [];
            this.tableAvailabilityMessage = 'Selecciona fecha, hora de inicio y hora de fin para validar disponibilidad.';
            this.tableAvailabilityState = 'idle';
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

                // Procesar mesas disponibles
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

                // Avanzar automáticamente al paso 2 si hay mesas disponibles
                if (this.mesasDisponibles.length > 0 && this.reservationTableStep === 1) {
                    this.selectTable(this.mesasDisponibles[0]);
                    this.reservationTableStep = 2;
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
                    this.reservationConfirmed.emit({
                        message,
                        success: false
                    });
                    return;
                }

                // Procesar mesas disponibles
                if (Array.isArray(data)) {
                    this.mesasDisponibles = data.filter((mesa: any) => mesa?.disponible === true);
                } else {
                    const mesa = data as any;
                    this.mesasDisponibles = mesa?.disponible === true ? [mesa] : [];
                }

                if (this.mesasDisponibles.length === 0) {
                    const message = 'No hay mesas disponibles para esta fecha y hora';
                    this._notificacionesService.warning(message, 'Disponibilidad');
                    this.reservationConfirmed.emit({
                        message,
                        success: false
                    });
                    return;
                }

                // Seleccionar la primera mesa disponible
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
                console.error('Error validando disponibilidad de mesas:', error);
                this._notificacionesService.error(message, 'Disponibilidad');
                this.reservationConfirmed.emit({
                    message,
                    success: false
                });
            }
        });
    }

    confirmTableReservation(): void {
        if (!this.canConfirmTableReservation() || this.isSubmittingTableReservation || !this.selectedTableId) {
            return;
        }

        // Validar que la mesa seleccionada está en las disponibles
        const mesaSeleccionada = this.mesasDisponibles.find(
            (mesa: any) => this.getMesaId(mesa) === this.selectedTableId
        );

        if (!mesaSeleccionada) {
            this._notificacionesService.warning('La mesa seleccionada no está disponible', 'Reserva de Mesa');
            return;
        }

        this.isSubmittingTableReservation = true;

        // Construir fecha y hora en formato Y-m-d H:i:s
        const fechaHoraInicio = `${this.tableDate} ${this.tableStartTime}:00:00`;
        const fechaHoraFin = `${this.tableDate} ${this.tableEndTime}:00:00`;

        const payload = {
            fecha_hora_inicio: fechaHoraInicio,
            fecha_hora_fin: fechaHoraFin,
            id_usuario: localStorage.getItem('id_usuario') || '',
            estado: 1,
            cantidad_personas: this.tablePeople,
            descripcion: this.tableDescription.trim(),
            id_mesa: this.selectedTableId
        };

        this._habitacionesService.postReservaMesa(payload).subscribe({
            next: (response: any) => {
                const statusOk = this.isSuccessfulResponse(response);
                const message = String(response?.message ?? 'Reserva de mesa realizada exitosamente');

                if (statusOk) {
                    this._notificacionesService.success(message, 'Reserva de Mesa');
                    this.resetTableForm();
                    this.selectedType = 'room';
                    this.reservationConfirmed.emit({ success: true, message });
                    return;
                }

                this._notificacionesService.warning(message, 'Reserva de Mesa');
                this.reservationConfirmed.emit({ success: false, message });
            },
            error: (error: any) => {
                const message = String(error?.error?.message ?? 'No fue posible reservar la mesa');
                this._notificacionesService.error(message, 'Reserva de Mesa');
                this.reservationConfirmed.emit({ success: false, message });
            },
            complete: () => {
                this.isSubmittingTableReservation = false;
            }
        });
    }

    onRoomTypeChange(rateValue: string, label: string): void {
        this.roomRate = Number(rateValue);
        this.roomRateLabel = label;
        this.calcRoom();
    }

    onGuestCountChange(value: string): void {
        this.numeroHuespedes = Number(value);

        const habitacionSeleccionada = this.getHabitacionSeleccionada();
        if (habitacionSeleccionada && !this.canUseHabitacion(habitacionSeleccionada)) {
            this.autoSelectFirstAvailableRoom();
        }

        this.validarDisponibilidadSilenciosa();
    }

    goToNextStep(): void {
        if (!this.canContinue() || this.isCheckingAvailability) {
            return;
        }

        this.validarDisponibilidadReserva(() => {
            this._notificacionesService.success('Disponibilidad validada correctamente', 'Reserva');
            this.reservationStep = 2;
            this.calcRoom();
        });
    }

    goBackToStepOne(): void {
        this.reservationStep = 1;
    }

    selectRoom(habitacion: any): void {
        const roomId = this.getHabitacionId(habitacion);
        this.selectedRoomId = roomId;
        const valor = this.getPrecioHabitacion(habitacion);
        const nombre = this.getNombreHabitacion(habitacion);
        this.onRoomTypeChange(String(valor), `${nombre} - ${this.formatMoney(valor)}/noche`);
    }

    selectRoomSafe(habitacion: any): void {
        if (!this.canUseHabitacion(habitacion)) {
            return;
        }

        this.selectRoom(habitacion);
    }

    isRoomSelected(habitacion: any): boolean {
        return this.selectedRoomId === this.getHabitacionId(habitacion);
    }

    getNombreHabitacion(habitacion: any): string {
        return String(habitacion?.nombre ?? 'Habitación');
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

    getPrecioHabitacion(habitacion: any): number {
        const valor = Number(habitacion?.precio_por_persona ?? 0);
        return Number.isFinite(valor) && valor > 0 ? valor : 0;
    }

    getImagenHabitacion(habitacion: any): string {
        const image = habitacion?.url_imagen ?? '';

        if (image) {
            return String(image);
        }

        return 'assets/fondo.jpg';
    }

    formatMoney(value: number): string {
        return '$' + value.toLocaleString('es-CO');
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

    submitRoomReservation(): void {
        if (!this.canConfirmRoomReservation() || this.isSubmittingReservation || this.isCheckingAvailability) {
            return;
        }

        const habitacionSeleccionada = this.getHabitacionSeleccionada();
        if (!habitacionSeleccionada || !this.canUseHabitacion(habitacionSeleccionada)) {
            this.reservationConfirmed.emit({
                message: 'La cabaña seleccionada no está disponible para las fechas elegidas',
                success: false
            });
            return;
        }

        const payload = {
            fecha_hora_inicio: this.toUtcMidnight(this.checkIn),
            fecha_hora_fin: this.toUtcMidnight(this.checkOut),
            id_usuario: localStorage.getItem('id_usuario') ?? '',
            estado: 1,
            cantidad_personas: String(this.numeroHuespedes),
            descripcion: this.roomDescription.trim(),
            nombre_cabania: this.getNombreHabitacion(habitacionSeleccionada)
        };

        this.isSubmittingReservation = true;
        this._habitacionesService.postReservaCabania(payload).subscribe({
            next: (response: any) => {
                const message = String(response?.message ?? 'Reserva creada exitosamente');
                const statusOk = this.isSuccessfulResponse(response);

                if (statusOk) {
                    this.resetReservationForm();
                }

                this.reservationConfirmed.emit({
                    message,
                    success: statusOk
                });
            },
            error: (error: any) => {
                const message = String(error?.error?.message ?? 'No fue posible crear la reserva');
                this.reservationConfirmed.emit({
                    message,
                    success: false
                });
                this.isSubmittingReservation = false;
            },
            complete: () => {
                this.isSubmittingReservation = false;
            }
        });
    }

    resetReservationForm(): void {
        this.selectedType = 'room';
        this.numeroHuespedes = 1;
        this.roomDescription = '';
        this.reservationStep = 1;

        if (this.habitaciones.length > 0) {
            this.selectRoom(this.habitaciones[0]);
        } else {
            this.selectedRoomId = null;
        }

        this.setDefaultDates();
        this.validarDisponibilidadSilenciosa();
    }

    confirmReservation(type: string): void {
        this.reservationConfirmed.emit({
            message: type,
            success: true
        });
    }

    getCheckInMin(): string {
        return this.getTodayDate();
    }

    getCheckOutMin(): string {
        return this.checkIn ? this.getNextDate(this.checkIn) : this.getTomorrowDate();
    }

    canContinue(): boolean {
        return this.numeroHuespedes > 0 && this.isCheckInValid() && this.isCheckOutValid();
    }

    canConfirmRoomReservation(): boolean {
        const habitacionSeleccionada = this.getHabitacionSeleccionada();
        return this.roomSummaryVisible && !!habitacionSeleccionada && this.canUseHabitacion(habitacionSeleccionada);
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
                    this.reservationConfirmed.emit({
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
                console.error('Error validando disponibilidad:', error);
                this._notificacionesService.error(message, 'Reserva');
                this.reservationConfirmed.emit({
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

    private setDefaultDates(): void {
        this.checkIn = this.getTomorrowDate();
        this.checkOut = this.getNextDate(this.checkIn);
        this.reservationStep = 1;
        this.calcRoom();
        this.validarDisponibilidadSilenciosa();
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

    private getHabitacionLookupKeys(habitacion: any): string[] {
        const keys = [
            habitacion?.id_cabania,
            habitacion?.id_habitacion,
            habitacion?.id,
            this.getNombreHabitacion(habitacion).trim().toLowerCase()
        ].map((value: any) => String(value ?? '').trim().toLowerCase()).filter((value: string) => !!value);

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

    private isHabitacionActiva(habitacion: any): boolean {
        const estado = String(habitacion?.estado ?? '1');
        return estado === '1' || estado.toLowerCase() === 'true';
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private getTodayDate(): string {
        return this.formatDate(new Date());
    }

    private getTomorrowDate(): string {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.formatDate(tomorrow);
    }

    private getNextDate(dateValue: string): string {
        const date = this.getDateValue(dateValue);
        date.setDate(date.getDate() + 1);
        return this.formatDate(date);
    }

    private getDateValue(dateValue: string): Date {
        return new Date(`${dateValue}T00:00:00`);
    }

    private isCheckInValid(): boolean {
        return !!this.checkIn && this.getDateValue(this.checkIn).getTime() >= this.getDateValue(this.getTodayDate()).getTime();
    }

    private isCheckOutValid(): boolean {
        return !!this.checkIn && !!this.checkOut && this.getDateValue(this.checkOut).getTime() > this.getDateValue(this.checkIn).getTime();
    }
}

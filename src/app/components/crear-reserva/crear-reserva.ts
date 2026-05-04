import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HabitacionesService } from '../../services/habitaciones.service';

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
    styleUrl: './crear-reserva.css'
})
export class CrearReservaComponent implements OnInit {
    // Avisa al padre cuando termina una reserva.
    @Output() reservationConfirmed = new EventEmitter<ReservationResult>();

    selectedType: ReservationType = 'room';
    reservationStep = 1;
    habitaciones: any[] = [];
    selectedRoomId: string | number | null = null;
    numeroHuespedes = 1;
    numerosHuespedes = [1, 2, 3, 4, 5, 6, 7, 8];

    roomRate = 140000;
    roomRateLabel = 'Habitación - $140.000/noche';
    checkIn = '';
    checkOut = '';

    roomSummaryVisible = false;
    isSubmittingReservation = false;
    isCheckingAvailability = false;
    hasDisponibilidadLoaded = false;
    isWaitingStepTransition = false;
    disponibilidadPorCabania: Record<string, boolean> = {};
    roomSummary = {
        type: 'Habitacion doble',
        rate: '$140.000/noche',
        nights: '-- noches',
        sub: '--',
        tax: '--',
        total: '--'
    };

    constructor(
        private _habitacionesService: HabitacionesService
    ) {}

    ngOnInit(): void {
        this.setDefaultDates();
        this.cargarHabitaciones();
    }

    cargarHabitaciones(): void {
        this._habitacionesService.getHabitaciones().subscribe({
            next: (response: any) => {
                console.log('Respuesta de habitaciones:', response);
                
                const statusOk = response?.status === 200 || response?.code === 200;
                const data = Array.isArray(response?.data) ? response.data : [];

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
        }
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
        if (!this.canContinue() || this.isCheckingAvailability || this.isWaitingStepTransition) {
            return;
        }

        this.validarDisponibilidadReserva(() => {
            this.isWaitingStepTransition = true;
            window.setTimeout(() => {
                this.reservationStep = 2;
                this.calcRoom();
                this.isWaitingStepTransition = false;
            }, 1000);
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
        return String(
            habitacion?.nombre ?? 'Habitación'
        );
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
        const valor = Number(
            habitacion?.precio_por_persona ?? 0
        );

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

        this.validarDisponibilidadReserva(() => {
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
                nombre_cabania: this.getNombreHabitacion(habitacionSeleccionada)
            };

            this.isSubmittingReservation = true;
            this._habitacionesService.postReservaCabania(payload).subscribe({
                next: (response: any) => {
                    const message = String(response?.message ?? 'Reserva creada exitosamente');
                    const statusOk = response?.status === 201 || response?.code === 201;
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
        });
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
        ).subscribe({
            next: (response: any) => {
                const statusOk = response?.status === 200 || response?.code === 200;
                const data = Array.isArray(response?.data) ? response.data : [];

                if (!statusOk) {
                    const message = String(response?.message ?? 'No fue posible validar disponibilidad');
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
                this.reservationConfirmed.emit({
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

    // Calcula resumen y total de la reserva de habitación.
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

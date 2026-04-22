import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HabitacionesService } from '../../services/habitaciones.service';

type ReservationType = 'room' | 'table';

@Component({
    selector: 'app-crear-reserva',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './crear-reserva.html',
    styleUrl: './crear-reserva.css'
})
export class CrearReservaComponent implements OnInit {
    // Avisa al padre cuando termina una reserva.
    @Output() reservationConfirmed = new EventEmitter<string>();

    selectedType: ReservationType = 'room';
    habitaciones: any[] = [];
    numeroHuespedes = 1;
    numerosHuespedes = [1, 2, 3, 4, 5, 6, 7, 8];

    roomRate = 140000;
    roomRateLabel = 'Habitación - $140.000/noche';
    checkIn = '';
    checkOut = '';

    roomSummaryVisible = false;
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
                if (response?.code === 200 && Array.isArray(response?.data)) {
                    console.log('Habitaciones cargadas:', response.data);
                    this.habitaciones = response.data;
                    if (this.habitaciones.length > 0) {
                        const primeraHabitacion = this.habitaciones[0];
                        const valor = this.getPrecioHabitacion(primeraHabitacion);
                        const nombre = this.getNombreHabitacion(primeraHabitacion);
                        this.onRoomTypeChange(String(valor), `${nombre} - ${this.formatMoney(valor)}/noche`);
                    }
                    return;
                }

                this.habitaciones = [];
            },
            error: () => {
                this.habitaciones = [];
            }
        });
    }

    selectType(type: ReservationType): void {
        this.selectedType = type;

        if (type === 'room') {
            this.setDefaultDates();
        }
    }

    onRoomTypeChange(rateValue: string, label: string): void {
        this.roomRate = Number(rateValue);
        this.roomRateLabel = label;
        this.calcRoom();
    }

    onGuestCountChange(value: string): void {
        this.numeroHuespedes = Number(value);
    }

    getNombreHabitacion(habitacion: any): string {
        return String(
            habitacion?.nombre ?? 'Habitación'
        );
    }

    getPrecioHabitacion(habitacion: any): number {
        const valor = Number(
            habitacion?.precio_por_persona ?? 0
        );

        return Number.isFinite(valor) && valor > 0 ? valor : 0;
    }

    formatMoney(value: number): string {
        return '$' + value.toLocaleString('es-CO');
    }

    onCheckInChange(value: string): void {
        this.checkIn = value;
        this.calcRoom();
    }

    onCheckOutChange(value: string): void {
        this.checkOut = value;
        this.calcRoom();
    }

    confirmReservation(type: string): void {
        this.reservationConfirmed.emit(type);
    }

    // Calcula resumen y total de la reserva de habitación.
    private calcRoom(): void {
        if (!this.checkIn || !this.checkOut) {
            this.roomSummaryVisible = false;
            return;
        }

        const startDate = new Date(this.checkIn);
        const endDate = new Date(this.checkOut);
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
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + 3);

        this.checkIn = this.formatDate(tomorrow);
        this.checkOut = this.formatDate(nextDay);
        this.calcRoom();
    }

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }
}

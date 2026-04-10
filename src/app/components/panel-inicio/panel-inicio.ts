import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type TabName = 'reservar' | 'historial' | 'facturas' | 'perfil';
type ReservationType = 'room' | 'table';

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-inicio.html',
  styleUrl: './panel-inicio.css'
})
export class PanelInicio {
  activeTab: TabName = 'reservar';
  selectedType: ReservationType = 'room';

  roomRate = 140000;
  roomRateLabel = 'Doble — $140.000/noche';
  checkIn = '';
  checkOut = '';

  roomSummaryVisible = false;
  roomSummary = {
    type: 'Habitación doble',
    rate: '$140.000/noche',
    nights: '— noches',
    sub: '—',
    tax: '—',
    total: '—'
  };

  toastMessage = '';
  toastVisible = false;

  constructor() {
    this.setDefaultDates();
  }

  showTab(name: TabName): void {
    this.activeTab = name;
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

  onCheckInChange(value: string): void {
    this.checkIn = value;
    this.calcRoom();
  }

  onCheckOutChange(value: string): void {
    this.checkOut = value;
    this.calcRoom();
  }

  calcRoom(): void {
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
    const money = (value: number): string => '$' + value.toLocaleString('es-CO');

    this.roomSummary = {
      type: this.roomRateLabel.split('—')[0].trim(),
      rate: money(this.roomRate) + '/noche',
      nights: nights === 1 ? '1 noche' : `${nights} noches`,
      sub: money(sub),
      tax: money(tax),
      total: money(total)
    };
    this.roomSummaryVisible = true;
  }

  confirmReservation(type: string): void {
    this.showToast(`¡Reserva de ${type} confirmada! Te llegará un correo de confirmación.`);
    window.setTimeout(() => this.showTab('historial'), 1800);
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

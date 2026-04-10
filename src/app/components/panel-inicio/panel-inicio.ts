import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacionesService } from '../../services/notificaciones.service';
import { EditarUsuarioComponent } from '../editar-usuario/editar-usuario';

type TabName = 'reservar' | 'historial' | 'facturas' | 'perfil';
type ReservationType = 'room' | 'table';

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [CommonModule, EditarUsuarioComponent],
  templateUrl: './panel-inicio.html',
  styleUrl: './panel-inicio.css'
})
export class PanelInicio implements OnInit {
  activeTab: TabName = 'reservar';
  selectedType: ReservationType = 'room';
  usuarioSesion = 'Usuario';
  usuarioIniciales = 'US';

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
  mostrarModalCerrarSesion = false;

  constructor(
    private router: Router,
    private _notificacionesService: NotificacionesService
  ) {
    this.setDefaultDates();
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this._notificacionesService.warning('Debe iniciar sesión', 'Sesión');
      this.router.navigate(['/login']);
      return;
    }
    
    this.usuarioSesion = `${localStorage.getItem('nombres') ?? ''} ${localStorage.getItem('apellidos') ?? ''}`.trim() || 'Usuario';
    this.usuarioIniciales = this.obtenerIniciales(this.usuarioSesion);
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

  private obtenerIniciales(texto: string): string {
    const partes = texto.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'US';

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase();
  }
}

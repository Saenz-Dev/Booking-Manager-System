import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificacionesService } from '../../services/notificaciones.service';
import { EditarUsuarioComponent } from '../editar-usuario/editar-usuario';
import { CrearReservaComponent } from '../crear-reserva/crear-reserva';

type TabName = 'reservar' | 'historial' | 'facturas' | 'perfil';

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [CommonModule, EditarUsuarioComponent, CrearReservaComponent],
  templateUrl: './panel-inicio.html',
  styleUrl: './panel-inicio.css'
})
export class PanelInicio implements OnInit {
  activeTab: TabName = 'reservar';
  usuarioSesion = 'Usuario';
  usuarioIniciales = 'US';

  toastMessage = '';
  toastVisible = false;
  mostrarModalCerrarSesion = false;

  constructor(
    private router: Router,
    private _notificacionesService: NotificacionesService
  ) {}

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

  onReservationConfirmed(type: string): void {
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

  private obtenerIniciales(texto: string): string {
    const partes = texto.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'US';

    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }

    return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase();
  }
}

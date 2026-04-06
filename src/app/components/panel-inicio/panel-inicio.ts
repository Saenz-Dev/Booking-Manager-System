import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-panel-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-inicio.html',
  styleUrls: ['./panel-inicio.css']
})
export class PanelInicio {
  selectedType: 'room' | 'table' = 'room';

  showTab(_tab: 'reservar' | 'historial' | 'facturas' | 'perfil'): void {
    // Placeholder method to avoid template errors while UI is static.
  }

  selectType(type: 'room' | 'table'): void {
    this.selectedType = type;
  }

  calcRoom(): void {
    // Placeholder for future room-price calculation.
  }

  confirmReservation(_type: string): void {
    // Placeholder for future reservation confirmation logic.
  }

  showInvoice(): void {
    // Placeholder for future invoice view logic.
  }

  showToast(_message: string): void {
    // Placeholder for future toast notification logic.
  }
} 

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesService } from '../../services/notificaciones.service';

@Component({
    selector: 'app-notificaciones',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notificaciones.html',
    styleUrl: './notificaciones.css'
})
export class NotificacionesComponent {
    // El template pinta las notificaciones emitidas por el servicio.
    constructor(public noti: NotificacionesService) { }
}
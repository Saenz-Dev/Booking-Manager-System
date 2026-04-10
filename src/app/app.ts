import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificacionesComponent } from "./components/notificaciones/notificaciones";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificacionesComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Booking_Manager_System');
}

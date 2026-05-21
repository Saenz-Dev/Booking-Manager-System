import { Routes } from '@angular/router';
import { Registrar } from './components/registrar/registrar';
import { Login } from './components/login/login';
import { PanelInicio } from './components/panel-inicio/panel-inicio';
import { RecuperarContrasena } from './components/recuperar-contrasena/recuperar-contrasena';
import { PanelAdminComponent } from './components/panel_admin/panel_admin';

// Rutas principales del flujo de autenticación y panel.
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'registrar', component: Registrar },
  { path: 'login', component: Login },
  { path: 'recuperar-contrasena', component: RecuperarContrasena },
  { path: 'inicio', component: PanelInicio },
  { path: 'panel_admin', component: PanelAdminComponent}
];
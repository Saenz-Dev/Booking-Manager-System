import { Routes } from '@angular/router';
import { Registrar } from './components/registrar/registrar';
import { Login } from './components/login/login';
import { PanelInicio } from './components/panel-inicio/panel-inicio';
import { PanelAdminComponent } from './components/panel_admin/panel_admin'; 

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'registrar', component: Registrar },
  { path: 'login', component: Login },
  { path: 'inicio', component: PanelInicio },
  { path: 'panel_admin', component: PanelAdminComponent}
];
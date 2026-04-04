import { Routes } from '@angular/router';
import { Registrar } from './components/registrar/registrar';
import { Login } from './components/login/login';
import { PanelInicio } from './components/panel-inicio/panel-inicio';

export const routes: Routes = [
    { path: 'registrar', component: Registrar },
    { path: 'login', component: Login },
    { path: 'inicio', component: PanelInicio }
];

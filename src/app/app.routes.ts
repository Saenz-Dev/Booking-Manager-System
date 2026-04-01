import { Routes } from '@angular/router';
import { Registrar } from './components/registrar/registrar';
import { Login } from './components/login/login';

export const routes: Routes = [
    { path: 'registrar', component: Registrar },
    { path: 'login', component: Login }
];

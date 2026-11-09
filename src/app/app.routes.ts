import { Routes } from '@angular/router';
import { Shell } from './components/layout/shell/shell';

export const routes: Routes = [
    {
        path:'',
        component: Shell,
        children:[
            { path: '', redirectTo: 'dashboard', pathMatch: 'full'},
            { path:'dashboard', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard) },
            { path: 'solicitudes', loadComponent: () => import('./components/solicitudes-list/solicitudes-list').then(m => m.SolicitudesList) },
            { path: 'solicitudes/nueva', loadComponent: () => import('./components/solicitud-form/solicitud-form').then(m => m.SolicitudForm) },
            { path: 'solicitudes/:id', loadComponent: () => import('./components/solicitud-detail/solicitud-detail').then(m => m.SolicitudDetail) },
            { path: 'aprobaciones', loadComponent: () => import('./components/aprobaciones/aprobaciones').then(m => m.AprobacionesComponent) },
            { path: 'tesoreria', loadComponent: () => import('./components/tesoreria/tesoreria').then(m => m.TesoreriaComponent) },
            { path: 'reportes', loadComponent: () => import('./components/reportes/reportes').then(m => m.ReportesComponent) }
        ]
    },
    {path: '**', redirectTo: ''}
];


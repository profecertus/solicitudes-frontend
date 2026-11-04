import { Routes } from '@angular/router';
import { Shell } from './components/layout/shell/shell';
import { SolicitudForm } from './components/solicitud-form/solicitud-form';
import { SolicitudesList } from './components/solicitudes-list/solicitudes-list';
import { SolicitudDetail } from './components/solicitud-detail/solicitud-detail';
import { Dashboard } from './components/dashboard/dashboard';

export const routes: Routes = [
    {
        path:'',
        component: Shell,
        children:[
            { path: '', redirectTo: 'dashboard', pathMatch: 'full'},
            { path:'dashboard', component:Dashboard},
            { path: 'solicitudes', component: SolicitudesList },
            { path: 'solicitudes/nueva', component: SolicitudForm },
            { path: 'solicitudes/:id', component: SolicitudDetail }
        ]
    },
    {path: '**', redirectTo: ''}
];

import { Component, inject, signal } from '@angular/core';
import { OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../../services/solicitud.service';
import { NotificationService } from '../../services/notification.service';
import { EstadoSolicitud, RolUsuario, Solicitud, TimelineItem } from '../../models/solicitud.model';
import { RolService } from '../../services/rol.service';

@Component({
  selector: 'app-solicitud-detail',
  imports: [CommonModule, FormsModule ],
  templateUrl: './solicitud-detail.html',
  styleUrl: './solicitud-detail.css',
})
export class SolicitudDetail implements OnInit{
  //private route = inject(RouterLink);
  private httpService = inject(SolicitudService);
  private notify = inject(NotificationService);
  rolService = inject(RolService);

  readonly EstadoSolicitud = EstadoSolicitud;
  readonly RolUsuario = RolUsuario;

  solcitud?:Solicitud;
  eventosTimeLine: TimelineItem[] = [];

  // Estados reactivos para el Modal de Aprobación
  readonly modalPagoAbierto = signal<boolean>(false);
  readonly pagoMedio = signal<string>('Transferencia Bancaria');
  readonly pagoOperacion = signal<string>('');

  readonly mediosPagoDisponibles = [
    'Transferencia Bancaria', 
    'Cheque de Gerencia', 
    'Efectivo / Caja Chica',
    'Deposito en Cuenta',
  ];

  ngOnInit(): void {
    return;
  }
}
